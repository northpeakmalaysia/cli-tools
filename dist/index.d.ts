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
import type { CliManifest } from './manifest.js';
export * from './manifest.js';
export * from './wrap.js';
export * from './bundled.js';
export * from './discovery.js';
export * from './help-parser.js';
export * from './policy.js';
export * from './redact.js';
export * from './dedup.js';
export * from './config.js';
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
export declare function registerCliWrappedTools(opts: CliToolsBootOptions): Promise<CliToolsBootResult>;
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
export declare function register(_api: PluginAPI): void;
declare const _default: {
    register: typeof register;
};
export default _default;
