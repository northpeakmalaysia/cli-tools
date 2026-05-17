import type { ToolPolicy } from '@swarmai/plugin-sdk';
/**
 * Subcommand safety classification (doc 15 §3).
 *
 * Two layers:
 *   1. A static `KNOWN` table for ~25 common CLIs, hand-curated so the
 *      obvious `docker rm` / `git push --force` style commands are
 *      always master-gated even if a hand-written manifest forgot to
 *      flip `mutating: true`.
 *   2. A keyword-driven heuristic for anything not in the table — same
 *      logic an experienced operator would apply at a glance.
 *
 * The classification feeds `policyForClass()` which maps to the actual
 * `ToolPolicy` value the registry consumes.
 */
export type SubcommandClass = 'read-only' | 'mutating' | 'destructive';
/**
 * Map `(bin, sub)` to a safety class.
 *
 * The match is case-insensitive and tolerant of underscore vs hyphen vs
 * space (manifest authors use any of the three).
 */
export declare function classifySubcommand(bin: string, sub: string): SubcommandClass;
/**
 * Pick the ToolPolicy for a class. `mutating` is parameterised because
 * some hosts prefer pair-gated for everyday writes (the operator
 * standing-approval handles it) and reserve `master` only for the
 * destructive bucket.
 */
export declare function policyForClass(c: SubcommandClass, defaultMutatingPolicy?: 'master' | 'pair-gated'): ToolPolicy;
