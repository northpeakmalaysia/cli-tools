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
export declare const CLI_TOOLS_FILENAME = "cli-tools.yaml";
export declare function configPath(workspaceRoot: string): string;
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
export declare function loadCliToolsConfig(workspaceRoot: string): CliToolsConfig;
/**
 * Persist a CliToolsConfig to disk. Creates the workspace dir if missing
 * (defensive — tmpdir tests may construct workspaceRoot before mkdir).
 * Stringifies through `yaml` rather than JSON so hand-edits feel native.
 */
export declare function saveCliToolsConfig(workspaceRoot: string, cfg: CliToolsConfig): void;
/**
 * Seed a fresh-install entry list — one disabled entry per bundled
 * manifest. The boot path calls this when the operator hasn't yet
 * created `cli-tools.yaml`; today we DON'T auto-persist the result
 * (per `registerCliWrappedTools()`'s "no surprise registration" rule),
 * but the helper exists so the upcoming `swarmai cli list` command can
 * surface the candidate set in one place.
 */
export declare function defaultEnabledForBundled(bundled: CliManifest[]): CliToolEntry[];
