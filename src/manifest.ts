import { z } from '@swarmai/shared';

/**
 * CLI manifest schema (doc 15 §2).
 *
 * A manifest tells SwarmAI:
 *   - which CLI binary it wraps (`bin: 'docker'`)
 *   - which subcommands are exposed (`subcommands: { ps: {...}, run: {...} }`)
 *   - whether each subcommand mutates state (`mutating: true` → master-only by default)
 *   - argument schema (parsed from `--help` or hand-tuned)
 *
 * Bundled manifests live under `cli-wrapper/manifests/` and ship with
 * the runtime. Operators can drop additional manifests into
 * `~/.swarmai/cli-manifests/` to wrap private tooling.
 */

export const ArgSpecSchema = z.object({
  name: z.string(),
  /** When set, value is a flag like `--foo VALUE`. Otherwise positional. */
  flag: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['string', 'integer', 'boolean']).default('string'),
  required: z.boolean().default(false),
  /** Repeating arg gets passed as `[value, value, ...]`. */
  repeating: z.boolean().default(false),
});
export type ArgSpec = z.infer<typeof ArgSpecSchema>;

export const SubcommandSchema = z.object({
  description: z.string(),
  mutating: z.boolean().default(false),
  args: z.array(ArgSpecSchema).default([]),
  /** Subcommand path before user args (e.g. ['ps'] or ['compose', 'up']). */
  argv: z.array(z.string()).default([]),
  /** Per-call timeout. */
  timeoutMs: z.number().int().positive().default(60_000),
});
export type Subcommand = z.infer<typeof SubcommandSchema>;

export const CliManifestSchema = z.object({
  bin: z.string(),
  description: z.string(),
  /** When true, treat any subcommand not in this manifest as forbidden.
   *  When false, unknown subcommands are passed through *as read-only*. */
  strict: z.boolean().default(true),
  subcommands: z.record(z.string(), SubcommandSchema),
});
export type CliManifest = z.infer<typeof CliManifestSchema>;
