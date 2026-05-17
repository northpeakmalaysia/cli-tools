import type { ToolDef } from '@swarmai/plugin-sdk';
/**
 * Native vs wrapped-CLI dedup (doc 15 §3).
 *
 * When SwarmAI ships a first-party tool (e.g. `git_status`) we don't
 * also want the wrapped-CLI version (`cli.git.status`) competing for
 * the LLM's attention — two near-identical tools force the model to
 * pick, and the native one is almost always the right choice (it has
 * a hand-tuned schema, structured output, and integrates with the
 * approval system at a lower granularity).
 *
 * `mode` lets a host invert the rule for cases where the wrapped
 * version is preferred (e.g. when the native tool is gated behind a
 * provider tier the operator can't use).
 */
export type DedupMode = 'prefer-native' | 'prefer-wrapped';
/**
 * Return the subset of `wrappedTools` that should stay registered
 * given the set of native tool names already present.
 *
 * Naming rules — a wrapped tool is named `cli.<bin>.<sub>`. The native
 * equivalent might appear under either `<bin>_<sub>` (the convention
 * used by `git_status`, `docker_ps`) or `<bin>.<sub>` (used by some
 * adapters that prefer dot-namespacing).
 *
 * Anything that doesn't match the `cli.<bin>.<sub>` shape is passed
 * through untouched — we only dedup tools we're confident we know
 * how to compare.
 */
export declare function dedupAgainstNative(wrappedTools: ToolDef[], nativeNames: Set<string>, mode?: DedupMode): ToolDef[];
