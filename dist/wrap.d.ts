import type { ToolDef } from '@swarmai/plugin-sdk';
import type { CliManifest } from './manifest.js';
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
export declare function wrapCli(opts: WrapOptions): ToolDef[];
