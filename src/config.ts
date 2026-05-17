import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { CliManifest } from './manifest.js';

/**
 * Per-CLI operator decisions for the cli-wrapper boot path (doc 15 §3.2).
 *
 * The file lives at `<workspaceRoot>/cli-tools.yaml` (workspace-scoped,
 * mirroring `device-perms.yaml`'s precedent in `apps/server/src/api/devices.ts`).
 * Each entry pins exactly one CLI manifest:
 *
 *   - `enabled: false` (default for bundled manifests) keeps the wrapper
 *     OFF until the operator opts in. Fresh installs see zero CLI tools
 *     registered — no `git`/`docker`/`npm` subcommands swarm the model's
 *     attention budget unless asked for.
 *   - `enabled: true` means "load this manifest at boot, resolve the bin
 *     once, register the wrapped tools".
 *   - `binPath?: string` pins an absolute path; when absent the boot path
 *     falls back to `discoverCliBinaries()`'s `resolveBinaryPath(name)`.
 *   - `defaultMutatingPolicy?: 'master' | 'pair-gated'` lets the operator
 *     downgrade master-gated mutating subcommands to pair-gated for a
 *     specific CLI without editing the manifest. Per-subcommand
 *     `mutating: true` always wins over this hint — this is just the
 *     default for ambiguous cases the manifest didn't mark.
 *
 * No `~/.swarmai/` global form exists today (and won't until cross-
 * workspace defaults become a real ask) — keeping it workspace-scoped
 * means the same machine can run two workspaces with different opt-ins.
 */

export interface CliToolEntry {
  /** Binary name. Matches `CliManifest.bin` for bundled / hand-written manifests. */
  name: string;
  /** When false, manifest is loaded but tools are not registered. */
  enabled: boolean;
  /** Pinned absolute path; if absent, look up via `discoverCliBinaries()`. */
  binPath?: string;
  /**
   * Per-CLI policy override for mutating subcommands.
   * `master` (default) — every mutating sub requires master gating.
   * `pair-gated` — mutating subs become pair-gated; only destructive subs
   *   stay master-gated. Useful for CLIs the operator runs constantly
   *   (`gh pr edit`, `kubectl apply`) where master-prompt fatigue defeats
   *   the audit benefit.
   */
  defaultMutatingPolicy?: 'master' | 'pair-gated';
}

export interface CliToolsConfig {
  version: 1;
  clis: CliToolEntry[];
}

export const CLI_TOOLS_FILENAME = 'cli-tools.yaml';

const VALID_MUTATING_POLICIES: ReadonlySet<'master' | 'pair-gated'> = new Set([
  'master',
  'pair-gated',
]);

export function configPath(workspaceRoot: string): string {
  return join(workspaceRoot, CLI_TOOLS_FILENAME);
}

/**
 * Load and validate the workspace cli-tools.yaml.
 *
 * Returns `{ version: 1, clis: [] }` when the file is missing — fresh
 * installs are silent rather than auto-creating a file the operator
 * never asked for. Throws on malformed YAML or schema violations so the
 * boot path can surface the failure instead of silently dropping every
 * configured CLI. (Compare `loadDevicePerms`, which swallows errors —
 * we deliberately don't, because CLI registration is a security-
 * sensitive decision and we want the operator to know the file is bad.)
 */
export function loadCliToolsConfig(workspaceRoot: string): CliToolsConfig {
  const file = configPath(workspaceRoot);
  if (!existsSync(file)) {
    return { version: 1, clis: [] };
  }
  const raw = readFileSync(file, 'utf8');
  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new Error(
      `cli-tools.yaml is malformed YAML at ${file}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
  return validateConfig(parsed, file);
}

/**
 * Persist a CliToolsConfig to disk. Creates the workspace dir if missing
 * (defensive — tmpdir tests may construct workspaceRoot before mkdir).
 * Stringifies through `yaml` rather than JSON so hand-edits feel native.
 */
export function saveCliToolsConfig(
  workspaceRoot: string,
  cfg: CliToolsConfig,
): void {
  const file = configPath(workspaceRoot);
  const dir = dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, stringifyYaml(cfg), 'utf8');
}

/**
 * Seed a fresh-install entry list — one disabled entry per bundled
 * manifest. The boot path calls this when the operator hasn't yet
 * created `cli-tools.yaml`; today we DON'T auto-persist the result
 * (per `registerCliWrappedTools()`'s "no surprise registration" rule),
 * but the helper exists so the upcoming `swarmai cli list` command can
 * surface the candidate set in one place.
 */
export function defaultEnabledForBundled(
  bundled: CliManifest[],
): CliToolEntry[] {
  return bundled.map((m) => ({ name: m.bin, enabled: false }));
}

// ---------------------------------------------------------------------
// internals
// ---------------------------------------------------------------------

function validateConfig(parsed: unknown, file: string): CliToolsConfig {
  if (parsed === null || parsed === undefined) {
    // Empty file = empty config. Operators sometimes `touch` the file
    // before hand-editing; treat that as a deliberate empty list rather
    // than a parse error.
    return { version: 1, clis: [] };
  }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `cli-tools.yaml at ${file} must be a YAML mapping with keys 'version' and 'clis'`,
    );
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error(
      `cli-tools.yaml at ${file} has unsupported version ${JSON.stringify(
        obj.version,
      )}; expected 1`,
    );
  }
  const rawClis = obj.clis;
  if (rawClis === undefined || rawClis === null) {
    return { version: 1, clis: [] };
  }
  if (!Array.isArray(rawClis)) {
    throw new Error(
      `cli-tools.yaml at ${file} 'clis' must be a list (got ${typeof rawClis})`,
    );
  }
  const clis: CliToolEntry[] = [];
  rawClis.forEach((raw, idx) => {
    clis.push(validateEntry(raw, idx, file));
  });
  return { version: 1, clis };
}

function validateEntry(raw: unknown, idx: number, file: string): CliToolEntry {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(
      `cli-tools.yaml at ${file} clis[${idx}] must be a mapping`,
    );
  }
  const obj = raw as Record<string, unknown>;
  const name = obj.name;
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error(
      `cli-tools.yaml at ${file} clis[${idx}].name must be a non-empty string`,
    );
  }
  if (typeof obj.enabled !== 'boolean') {
    throw new Error(
      `cli-tools.yaml at ${file} clis[${idx}].enabled (for '${name}') must be a boolean`,
    );
  }
  const entry: CliToolEntry = { name, enabled: obj.enabled };
  if (obj.binPath !== undefined) {
    if (typeof obj.binPath !== 'string' || obj.binPath.trim().length === 0) {
      throw new Error(
        `cli-tools.yaml at ${file} clis[${idx}].binPath (for '${name}') must be a non-empty string when present`,
      );
    }
    entry.binPath = obj.binPath;
  }
  if (obj.defaultMutatingPolicy !== undefined) {
    if (
      typeof obj.defaultMutatingPolicy !== 'string' ||
      !VALID_MUTATING_POLICIES.has(
        obj.defaultMutatingPolicy as 'master' | 'pair-gated',
      )
    ) {
      throw new Error(
        `cli-tools.yaml at ${file} clis[${idx}].defaultMutatingPolicy (for '${name}') must be 'master' or 'pair-gated'`,
      );
    }
    entry.defaultMutatingPolicy = obj.defaultMutatingPolicy as
      | 'master'
      | 'pair-gated';
  }
  return entry;
}
