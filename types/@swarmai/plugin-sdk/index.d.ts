/**
 * Local ambient types for `@swarmai/plugin-sdk`.
 *
 * Surfaces only the symbols `@swarmai/cli-tools` consumes. The actual
 * runtime module is provided by the host at load time (declared as a
 * peerDependency in package.json) — these stubs exist purely so the
 * standalone TypeScript build doesn't fail to resolve missing-package
 * imports in environments where the monorepo isn't checked out next to
 * this plugin.
 *
 * Kept in lock-step with `packages/plugin-sdk/src/{plugin-api,tool-contract}.ts`
 * in the SwarmAI monorepo. If those contracts change in a way cli-tools
 * needs to track, mirror the change here.
 */

declare module '@swarmai/plugin-sdk' {
  // ─── tool-contract.ts ────────────────────────────────────────────

  export interface ToolContext {
    sessionId: string;
    agentId: string;
    isMain: boolean;
    currentTier?: 'heavy' | 'average' | 'simple';
  }

  export type ToolPolicy = 'open' | 'pair-gated' | 'master';

  // We only need a structural definition here. The handler input is
  // typed as `unknown` so cli-tools' adapter (`wrap.ts`) can build
  // `ToolDef`s with arbitrary zod schemas without a generic dance.
  export interface ToolDef<S = unknown, O = unknown> {
    name: string;
    toolset: string;
    description: string;
    schema: S;
    handler: (input: unknown, ctx: ToolContext) => Promise<O>;
    emoji?: string;
    policy?: ToolPolicy;
    requiresApproval?: boolean;
    maxResultSize?: number;
    minTier?: 'heavy' | 'average' | 'simple';
    schemaOverride?: Record<string, unknown>;
  }

  // ─── plugin-api.ts (minimal subset) ──────────────────────────────

  // cli-tools only inspects `registerTool` on the PluginAPI. The full
  // interface in the monorepo declares register{Provider,Channel,…} too;
  // we declare a permissive shape so cli-tools' `register(api)` signature
  // is structurally compatible with whatever the host passes.
  export interface PluginAPI {
    registerTool(tool: ToolDef): void;
    [k: string]: unknown;
  }
}
