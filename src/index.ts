/**
 * @swarmai/cli-tools — plugin entry.
 *
 * Bridges installed CLIs (docker, git, kubectl, npm, …, am, pm, svc, input)
 * to SwarmAI agents as policy-gated tools. Carved out of the monorepo's
 * `@swarmai/cli-wrapper` package per doc 15 §3 so operators can install
 * / update the wrapper independently of the host runtime.
 *
 * ## Two roles in one entry
 *
 * 1. **Plugin entry (`register`)** — the contract the loader at
 *    `@swarmai/plugin-loader` invokes. For 0.1.0 this is a thin no-op
 *    that logs the plugin loaded; the heavy lifting still lives in
 *    `registerCliWrappedTools()` because the host needs workspace-root +
 *    pre-built native-tool registry context that the plugin loader
 *    doesn't yet pass through.
 *
 * 2. **Named exports** — every public surface from the original
 *    `@swarmai/cli-wrapper` is re-exported (manifests, wrap, discovery,
 *    config, dedup, redact, policy, help-parser). Existing host code
 *    that did `import { wrapCli, BUNDLED_MANIFESTS } from '@swarmai/cli-wrapper'`
 *    keeps working by importing from `@swarmai/cli-tools` instead.
 *
 * ## Migration path for hosts
 *
 * The monorepo's `apps/server/src/main-cli-tools.ts` calls
 * `registerCliWrappedTools()` from this package directly during the
 * boot path (after `registerBuiltins()`, before `wireToolRegistryGates()`).
 * That function is also re-exported here so the bundled distribution
 * can import it via the standard plugin discovery mechanism without a
 * workspace symlink.
 */

import type { PluginAPI, ToolDef } from '@swarmai/plugin-sdk';

import { BUNDLED_MANIFESTS } from './bundled.js';
import { wrapCli } from './wrap.js';
import { dedupAgainstNative } from './dedup.js';
import { loadCliToolsConfig, type CliToolEntry } from './config.js';
import { resolveBinaryPath } from './discovery.js';
import type { CliManifest } from './manifest.js';

// ─── Public surface (re-exports) ──────────────────────────────────────
// Mirrors the original `@swarmai/cli-wrapper/src/index.ts`.

export * from './manifest.js';
export * from './wrap.js';
export * from './bundled.js';
export * from './discovery.js';
export * from './help-parser.js';
export * from './policy.js';
export * from './redact.js';
export * from './dedup.js';
export * from './config.js';

// ─── Host-callable boot helper ────────────────────────────────────────
// Mirrors `apps/server/src/main-cli-tools.ts#registerCliWrappedTools`
// but accepts the host's tool-register callback instead of statically
// importing `@swarmai/tools` (kept out of this package's deps so the
// plugin stays decoupled from the host registry implementation).

/** Minimal logger shape — matches `@swarmai/shared`'s Logger interface
 *  without taking a dep on it. The host injects its own logger. */
export interface CliToolsLogger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export interface CliToolsBootOptions {
  workspaceRoot: string;
  logger: CliToolsLogger;
  /** Callback that registers a tool with the host's tool registry.
   *  In the monorepo this is `@swarmai/tools`'s `register()`. */
  registerTool: (tool: ToolDef) => void;
  /** Set of native tool names already registered (used for dedup so the
   *  wrapped `cli.git.status` doesn't compete with a hand-tuned native
   *  `git_status`). The host snapshots `toolRegistry.list()` once before
   *  calling and passes the names in. */
  nativeToolNames: Set<string>;
  /** Manifest source — defaults to `BUNDLED_MANIFESTS`. Hand-written
   *  manifests from `~/.swarmai/cli-manifests/` plug in here once that
   *  loader lands (doc 15 §2). */
  manifests?: CliManifest[];
}

export interface CliToolsBootSkip {
  name: string;
  reason: string;
}

export interface CliToolsBootResult {
  registered: number;
  skipped: CliToolsBootSkip[];
}

const SKIP_NOT_ENABLED = 'not enabled in cli-tools.yaml';
const SKIP_BIN_NOT_FOUND = 'binary not found on PATH';
const SKIP_NO_MANIFEST = 'no manifest available for this entry';
const SKIP_ALL_DEDUPED = 'all subcommands deduped against native tools';

/**
 * Run the CLI-wrapper boot step. Reads `<workspaceRoot>/cli-tools.yaml`,
 * iterates ONLY entries marked `enabled: true`, resolves each binary
 * (operator-pinned `binPath` wins over PATH discovery), wraps the
 * manifest into `ToolDef`s via `wrapCli`, dedups against the native
 * registry, and invokes `registerTool` for each survivor.
 *
 * Fresh-install path (file missing or `clis: []`): zero registrations,
 * one INFO log telling the operator how to opt in. No file is written.
 */
export async function registerCliWrappedTools(
  opts: CliToolsBootOptions,
): Promise<CliToolsBootResult> {
  const manifests = opts.manifests ?? BUNDLED_MANIFESTS;
  const cfg = loadCliToolsConfig(opts.workspaceRoot);

  if (cfg.clis.length === 0) {
    opts.logger.info(
      {
        candidates: manifests.length,
        configFile: 'cli-tools.yaml',
      },
      'cli-tools: no CLIs enabled (fresh install). Edit cli-tools.yaml to opt in.',
    );
    return { registered: 0, skipped: [] };
  }

  // Snapshot of names that already exist — copied so we don't mutate the
  // caller's set when we record freshly-registered names for inter-entry
  // dedup.
  const knownNames = new Set(opts.nativeToolNames);

  const manifestByName = new Map<string, CliManifest>();
  for (const m of manifests) {
    manifestByName.set(m.bin, m);
  }

  const skipped: CliToolsBootSkip[] = [];
  let registered = 0;

  for (const entry of cfg.clis) {
    const result = await registerOne(entry, manifestByName, knownNames, opts);
    if (result.skipped) {
      skipped.push(result.skipped);
    } else if (result.registeredTools) {
      registered += result.registeredTools.length;
      for (const t of result.registeredTools) {
        knownNames.add(t.name);
      }
    }
  }

  opts.logger.info(
    {
      enabledEntries: cfg.clis.filter((c) => c.enabled).length,
      registered,
      skipped: skipped.length,
      skips: skipped,
    },
    `cli-tools: registered ${registered} CLI-wrapped tool(s) from ${cfg.clis.length} configured entr${cfg.clis.length === 1 ? 'y' : 'ies'} (${skipped.length} skipped)`,
  );

  return { registered, skipped };
}

interface RegisterOneResult {
  skipped?: CliToolsBootSkip;
  registeredTools?: ToolDef[];
}

async function registerOne(
  entry: CliToolEntry,
  manifestByName: Map<string, CliManifest>,
  knownNames: Set<string>,
  opts: CliToolsBootOptions,
): Promise<RegisterOneResult> {
  if (!entry.enabled) {
    opts.logger.info({ cli: entry.name }, `cli-tools: skip '${entry.name}' (${SKIP_NOT_ENABLED})`);
    return { skipped: { name: entry.name, reason: SKIP_NOT_ENABLED } };
  }

  const manifest = manifestByName.get(entry.name);
  if (!manifest) {
    opts.logger.info(
      { cli: entry.name },
      `cli-tools: skip '${entry.name}' (${SKIP_NO_MANIFEST})`,
    );
    return { skipped: { name: entry.name, reason: SKIP_NO_MANIFEST } };
  }

  // Pin the binary path NOW — operator-config trumps PATH discovery.
  let binPath: string | null = entry.binPath ?? null;
  if (binPath === null) {
    binPath = await resolveBinaryPath(entry.name);
  }
  if (binPath === null) {
    opts.logger.info(
      { cli: entry.name },
      `cli-tools: skip '${entry.name}' (${SKIP_BIN_NOT_FOUND})`,
    );
    return { skipped: { name: entry.name, reason: SKIP_BIN_NOT_FOUND } };
  }

  const wrapped = wrapCli({ manifest, binPath });
  const survivors = dedupAgainstNative(wrapped, knownNames, 'prefer-native');

  if (survivors.length === 0) {
    opts.logger.info(
      { cli: entry.name, manifest: manifest.bin, subcommands: wrapped.length },
      `cli-tools: skip '${entry.name}' (${SKIP_ALL_DEDUPED})`,
    );
    return { skipped: { name: entry.name, reason: SKIP_ALL_DEDUPED } };
  }

  const registeredTools: ToolDef[] = [];
  for (const tool of survivors) {
    try {
      opts.registerTool(tool);
      registeredTools.push(tool);
    } catch (err) {
      opts.logger.warn(
        {
          cli: entry.name,
          tool: tool.name,
          err: err instanceof Error ? err.message : String(err),
        },
        'cli-tools: failed to register tool (continuing with rest of batch)',
      );
    }
  }

  opts.logger.info(
    {
      cli: entry.name,
      binPath,
      registered: registeredTools.length,
      candidates: wrapped.length,
      defaultMutatingPolicy: entry.defaultMutatingPolicy ?? 'master',
    },
    `cli-tools: registered '${entry.name}' (${registeredTools.length}/${wrapped.length} subcommands)`,
  );

  return { registeredTools };
}

// ─── Plugin registration entry ────────────────────────────────────────

/**
 * Plugin entry — what `@swarmai/plugin-loader` calls. The loader passes
 * the PluginAPI (which exposes `registerTool`), but does NOT pass the
 * host's workspace-root or pre-built native tool registry.
 *
 * For 0.1.0 the contract is split:
 *
 *   • `register(api)` — no-op that just records "plugin loaded". Safe to
 *     run unconditionally; never throws.
 *   • `registerCliWrappedTools(opts)` — host imports + calls this
 *     directly during its boot path with workspace-root and the native
 *     tool name set in hand.
 *
 * A future plugin-SDK version that exposes host context (workspaceRoot,
 * native registry snapshot) on the PluginAPI will let `register()`
 * subsume the second path. Until then, hosts use the named export.
 */
export function register(_api: PluginAPI): void {
  // Loader expects a register function on the default export so the
  // discovery probe succeeds. No-op by design — see module header for
  // why the host calls registerCliWrappedTools() separately.
}

export default { register };
