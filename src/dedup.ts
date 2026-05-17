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
export function dedupAgainstNative(
  wrappedTools: ToolDef[],
  nativeNames: Set<string>,
  mode: DedupMode = 'prefer-native',
): ToolDef[] {
  const out: ToolDef[] = [];
  for (const tool of wrappedTools) {
    const parsed = parseWrappedName(tool.name);
    if (!parsed) {
      // Not a wrapped-CLI tool; leave the caller's hand-built tools alone.
      out.push(tool);
      continue;
    }
    const { bin, sub } = parsed;
    const nativeUnderscore = `${bin}_${sub}`;
    const nativeDot = `${bin}.${sub}`;
    const hasNative = nativeNames.has(nativeUnderscore) || nativeNames.has(nativeDot);

    if (hasNative && mode === 'prefer-native') {
      // Drop the wrapped tool; native wins.
      continue;
    }
    out.push(tool);
  }
  return out;
}

function parseWrappedName(name: string): { bin: string; sub: string } | null {
  if (!name.startsWith('cli.')) return null;
  const rest = name.slice(4);
  // First dot separates bin from sub; subsequent dots belong to the sub
  // (e.g. `cli.docker.system.prune` → bin=docker, sub=system.prune).
  const dot = rest.indexOf('.');
  if (dot < 1 || dot === rest.length - 1) return null;
  return { bin: rest.slice(0, dot), sub: rest.slice(dot + 1) };
}
