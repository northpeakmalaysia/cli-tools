import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

/**
 * CLI binary discovery (doc 15 §3.5).
 *
 * Scans `process.env.PATH` (plus optional extra dirs) for executable
 * files, dedups by bare binary name (first hit on PATH wins, matching
 * shell precedence), and best-effort probes each one with `--version`
 * so callers can show a one-line summary to the operator.
 *
 * Everything here is filesystem-side; no LLM, no network. The
 * `runProbe` helper deliberately uses `shell: false` and a hard
 * 2-second timeout — we treat unknown binaries as potentially
 * hostile / hung and never let one block discovery.
 */

export interface DiscoveredCli {
  /** Bare binary name (no extension on Windows). */
  name: string;
  /** Resolved absolute path. */
  path: string;
  /** Parsed from `<bin> --version` best-effort; undefined when the probe failed. */
  version?: string;
  source: 'path' | 'extra-path';
}

export interface DiscoverOptions {
  /** When given, only return entries whose `name` is in this list. */
  include?: string[];
  /** Extra directories to scan after PATH (still subject to first-wins dedup). */
  extraPath?: string[];
}

/**
 * Windows-only set of file extensions we treat as runnable. We strip
 * these to derive the bare `name` so the discovery output matches what
 * an operator would type (`docker`, not `docker.exe`).
 */
const WIN_EXEC_EXTS = new Set(['.exe', '.cmd', '.bat', '.ps1']);
const IS_WINDOWS = process.platform === 'win32';
const PATH_SEP = IS_WINDOWS ? ';' : ':';
const PROBE_TIMEOUT_MS = 2_000;
const PROBE_CONCURRENCY = 10;

/**
 * Walk PATH (and `extraPath`) and return one entry per unique binary
 * name. Failed `--version` probes still emit an entry with
 * `version: undefined` — discovery never throws.
 */
export async function discoverCliBinaries(opts: DiscoverOptions = {}): Promise<DiscoveredCli[]> {
  const include = opts.include ? new Set(opts.include) : null;

  const pathDirs = parsePath(process.env.PATH ?? '');
  const extraDirs = opts.extraPath ?? [];

  // First-wins dedup keyed by bare binary name; matches shell precedence.
  const candidates = new Map<string, { path: string; source: DiscoveredCli['source'] }>();

  for (const dir of pathDirs) {
    await collectFromDir(dir, 'path', candidates, include);
  }
  for (const dir of extraDirs) {
    await collectFromDir(dir, 'extra-path', candidates, include);
  }

  const entries = Array.from(candidates.entries()).map(([name, info]) => ({
    name,
    path: info.path,
    source: info.source,
  }));

  // Probe in capped concurrency to avoid forking the world.
  const out: DiscoveredCli[] = [];
  for (let i = 0; i < entries.length; i += PROBE_CONCURRENCY) {
    const batch = entries.slice(i, i + PROBE_CONCURRENCY);
    const probed = await Promise.all(
      batch.map(async (e) => ({
        ...e,
        version: await probeVersion(e.path),
      })),
    );
    out.push(...probed);
  }

  // Stable name-order for predictable UX.
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Single-binary lookup — used by `wrap.ts` to pin the absolute path of
 * the binary at install time (doc 15 §3.5). Returns null when the bin
 * isn't on PATH.
 */
export async function resolveBinaryPath(name: string): Promise<string | null> {
  const dirs = parsePath(process.env.PATH ?? '');
  for (const dir of dirs) {
    const hit = await findInDir(dir, name);
    if (hit) return hit;
  }
  return null;
}

// ---------------------------------------------------------------------------
// internals

function parsePath(raw: string): string[] {
  return raw
    .split(PATH_SEP)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function collectFromDir(
  dir: string,
  source: DiscoveredCli['source'],
  out: Map<string, { path: string; source: DiscoveredCli['source'] }>,
  include: Set<string> | null,
): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return; // Missing/forbidden PATH entries are common; silently skip.
  }
  for (const entry of entries) {
    const name = bareName(entry);
    if (name === null) continue;
    if (include && !include.has(name)) continue;
    if (out.has(name)) continue; // First-wins dedup.
    const full = path.join(dir, entry);
    if (!(await isExecutable(full))) continue;
    out.set(name, { path: full, source });
  }
}

async function findInDir(dir: string, name: string): Promise<string | null> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (bareName(entry) !== name) continue;
    const full = path.join(dir, entry);
    if (await isExecutable(full)) return full;
  }
  return null;
}

/**
 * Convert a directory entry into the bare bin name an operator would
 * type. Returns null when the file isn't a candidate (e.g. POSIX
 * dotfile, Windows non-executable extension).
 */
function bareName(entry: string): string | null {
  if (entry.startsWith('.')) return null;
  if (IS_WINDOWS) {
    const ext = path.extname(entry).toLowerCase();
    if (!WIN_EXEC_EXTS.has(ext)) return null;
    return path.basename(entry, ext);
  }
  return entry;
}

async function isExecutable(full: string): Promise<boolean> {
  try {
    const s = await stat(full);
    if (!s.isFile()) return false;
    // On Windows the extension check in `bareName` is the gate; stat
    // doesn't reliably surface the execute bit. On POSIX, any +x on
    // owner/group/other counts.
    if (IS_WINDOWS) return true;
    return (s.mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

/**
 * Best-effort `<bin> --version` probe with a hard 2-second timeout.
 * Returns the first non-empty line of stdout (or stderr — some tools
 * print version to stderr) trimmed; undefined on any failure.
 *
 * We do this inline (rather than via `@swarmai/tools`) because
 * cli-wrapper deliberately doesn't depend on it. ~30 lines of spawn
 * plumbing is cheaper than a new workspace dep.
 */
async function probeVersion(bin: string): Promise<string | undefined> {
  return new Promise<string | undefined>((resolve) => {
    let settled = false;
    let stdout = '';
    let stderr = '';
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(bin, ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      });
    } catch {
      resolve(undefined);
      return;
    }
    const done = (v: string | undefined): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill('SIGTERM');
      } catch {
        // already exited
      }
      resolve(v);
    };
    const timer = setTimeout(() => done(undefined), PROBE_TIMEOUT_MS);
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (c: string) => (stdout += c));
    child.stderr?.on('data', (c: string) => (stderr += c));
    child.on('error', () => done(undefined));
    child.on('exit', () => {
      const combined = (stdout || stderr).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      done(combined[0]);
    });
  });
}
