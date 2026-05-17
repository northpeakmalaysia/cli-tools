import { spawn } from 'node:child_process';
import { z } from '@swarmai/shared';
import type { ToolDef } from '@swarmai/plugin-sdk';
import type { CliManifest, ArgSpec, Subcommand } from './manifest.js';

/**
 * Wrap a CLI manifest as a set of `ToolDef`s.
 *
 * Each subcommand becomes a tool named `cli.<bin>.<sub>`. Schema is
 * synthesised from `args[]`. Handler invokes the binary via
 * `spawn` (argv-only, never `shell: true` — the user's args never
 * reach a shell interpreter).
 *
 * Mutating subcommands get policy `master`; read-only get `pair-gated`.
 */

export interface WrapOptions {
  manifest: CliManifest;
  /** Override the binary path — useful if `bin` isn't on PATH. */
  binPath?: string;
  /** Per-call working directory. */
  cwd?: string;
  /** Hard environment whitelist. Default: pass-through. */
  env?: Record<string, string>;
}

export function wrapCli(opts: WrapOptions): ToolDef[] {
  const tools: ToolDef[] = [];
  for (const [subName, sub] of Object.entries(opts.manifest.subcommands)) {
    tools.push(buildSubcommandTool(opts, subName, sub));
  }
  return tools;
}

function buildSubcommandTool(opts: WrapOptions, subName: string, sub: Subcommand): ToolDef {
  const schema = buildSchema(sub.args);
  const fullName = `cli.${opts.manifest.bin}.${subName}`;
  const def: ToolDef<typeof schema, { exitCode: number; stdout: string; stderr: string; argv: string[] }> = {
    name: fullName,
    toolset: `cli.${opts.manifest.bin}`,
    description: sub.description,
    emoji: sub.mutating ? '⚙️' : '🔧',
    policy: sub.mutating ? 'master' : 'pair-gated',
    schema,
    handler: async (input) => {
      const userArgs = composeArgs(sub.args, input as Record<string, unknown>);
      const argv = [...sub.argv, ...userArgs];
      return await runProcess(opts.binPath ?? opts.manifest.bin, argv, {
        cwd: opts.cwd,
        env: opts.env,
        timeoutMs: sub.timeoutMs,
      });
    },
  };
  return def as unknown as ToolDef;
}

function buildSchema(args: ArgSpec[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const a of args) {
    let s: z.ZodTypeAny;
    switch (a.type) {
      case 'integer':
        s = z.number().int();
        break;
      case 'boolean':
        s = z.boolean();
        break;
      default:
        s = z.string();
    }
    if (a.repeating) s = z.array(s);
    if (a.description) s = s.describe(a.description);
    shape[a.name] = a.required ? s : s.optional();
  }
  return z.object(shape);
}

function composeArgs(specs: ArgSpec[], input: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const spec of specs) {
    const v = input[spec.name];
    if (v === undefined || v === null || v === '') continue;
    const values = Array.isArray(v) ? v : [v];
    for (const value of values) {
      if (spec.flag) {
        if (spec.type === 'boolean') {
          if (value === true) out.push(spec.flag);
        } else {
          out.push(spec.flag, String(value));
        }
      } else {
        out.push(String(value));
      }
    }
  }
  return out;
}

interface RunOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs: number;
}

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  argv: string[];
  timedOut?: boolean;
}

function runProcess(bin: string, argv: string[], opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(bin, argv, {
      cwd: opts.cwd,
      env: opts.env ? { ...process.env, ...opts.env } : process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      // CRITICAL: shell:false — args go straight to execvp, no
      // interpolation. Treat manifest authors as the only source of
      // command-line truth.
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, opts.timeoutMs);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (c: string) => (stdout += c));
    child.stderr.on('data', (c: string) => (stderr += c));
    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? -1,
        stdout: truncate(stdout),
        stderr: truncate(stderr),
        argv: [bin, ...argv],
        timedOut: timedOut || undefined,
      });
    });
  });
}

const MAX_OUTPUT_BYTES = 32_000;
function truncate(s: string): string {
  if (Buffer.byteLength(s, 'utf8') <= MAX_OUTPUT_BYTES) return s;
  return Buffer.from(s, 'utf8').subarray(0, MAX_OUTPUT_BYTES).toString('utf8') + '\n…[truncated]';
}
