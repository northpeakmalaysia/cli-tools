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
 * Walk PATH (and `extraPath`) and return one entry per unique binary
 * name. Failed `--version` probes still emit an entry with
 * `version: undefined` — discovery never throws.
 */
export declare function discoverCliBinaries(opts?: DiscoverOptions): Promise<DiscoveredCli[]>;
/**
 * Single-binary lookup — used by `wrap.ts` to pin the absolute path of
 * the binary at install time (doc 15 §3.5). Returns null when the bin
 * isn't on PATH.
 */
export declare function resolveBinaryPath(name: string): Promise<string | null>;
