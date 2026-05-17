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
export declare const ArgSpecSchema: z.ZodObject<{
    name: z.ZodString;
    /** When set, value is a flag like `--foo VALUE`. Otherwise positional. */
    flag: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["string", "integer", "boolean"]>>;
    required: z.ZodDefault<z.ZodBoolean>;
    /** Repeating arg gets passed as `[value, value, ...]`. */
    repeating: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "string" | "boolean" | "integer";
    required: boolean;
    repeating: boolean;
    flag?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    flag?: string | undefined;
    description?: string | undefined;
    type?: "string" | "boolean" | "integer" | undefined;
    required?: boolean | undefined;
    repeating?: boolean | undefined;
}>;
export type ArgSpec = z.infer<typeof ArgSpecSchema>;
export declare const SubcommandSchema: z.ZodObject<{
    description: z.ZodString;
    mutating: z.ZodDefault<z.ZodBoolean>;
    args: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        /** When set, value is a flag like `--foo VALUE`. Otherwise positional. */
        flag: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        type: z.ZodDefault<z.ZodEnum<["string", "integer", "boolean"]>>;
        required: z.ZodDefault<z.ZodBoolean>;
        /** Repeating arg gets passed as `[value, value, ...]`. */
        repeating: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "string" | "boolean" | "integer";
        required: boolean;
        repeating: boolean;
        flag?: string | undefined;
        description?: string | undefined;
    }, {
        name: string;
        flag?: string | undefined;
        description?: string | undefined;
        type?: "string" | "boolean" | "integer" | undefined;
        required?: boolean | undefined;
        repeating?: boolean | undefined;
    }>, "many">>;
    /** Subcommand path before user args (e.g. ['ps'] or ['compose', 'up']). */
    argv: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    /** Per-call timeout. */
    timeoutMs: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    mutating: boolean;
    args: {
        name: string;
        type: "string" | "boolean" | "integer";
        required: boolean;
        repeating: boolean;
        flag?: string | undefined;
        description?: string | undefined;
    }[];
    argv: string[];
    timeoutMs: number;
}, {
    description: string;
    mutating?: boolean | undefined;
    args?: {
        name: string;
        flag?: string | undefined;
        description?: string | undefined;
        type?: "string" | "boolean" | "integer" | undefined;
        required?: boolean | undefined;
        repeating?: boolean | undefined;
    }[] | undefined;
    argv?: string[] | undefined;
    timeoutMs?: number | undefined;
}>;
export type Subcommand = z.infer<typeof SubcommandSchema>;
export declare const CliManifestSchema: z.ZodObject<{
    bin: z.ZodString;
    description: z.ZodString;
    /** When true, treat any subcommand not in this manifest as forbidden.
     *  When false, unknown subcommands are passed through *as read-only*. */
    strict: z.ZodDefault<z.ZodBoolean>;
    subcommands: z.ZodRecord<z.ZodString, z.ZodObject<{
        description: z.ZodString;
        mutating: z.ZodDefault<z.ZodBoolean>;
        args: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            /** When set, value is a flag like `--foo VALUE`. Otherwise positional. */
            flag: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            type: z.ZodDefault<z.ZodEnum<["string", "integer", "boolean"]>>;
            required: z.ZodDefault<z.ZodBoolean>;
            /** Repeating arg gets passed as `[value, value, ...]`. */
            repeating: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: "string" | "boolean" | "integer";
            required: boolean;
            repeating: boolean;
            flag?: string | undefined;
            description?: string | undefined;
        }, {
            name: string;
            flag?: string | undefined;
            description?: string | undefined;
            type?: "string" | "boolean" | "integer" | undefined;
            required?: boolean | undefined;
            repeating?: boolean | undefined;
        }>, "many">>;
        /** Subcommand path before user args (e.g. ['ps'] or ['compose', 'up']). */
        argv: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        /** Per-call timeout. */
        timeoutMs: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        mutating: boolean;
        args: {
            name: string;
            type: "string" | "boolean" | "integer";
            required: boolean;
            repeating: boolean;
            flag?: string | undefined;
            description?: string | undefined;
        }[];
        argv: string[];
        timeoutMs: number;
    }, {
        description: string;
        mutating?: boolean | undefined;
        args?: {
            name: string;
            flag?: string | undefined;
            description?: string | undefined;
            type?: "string" | "boolean" | "integer" | undefined;
            required?: boolean | undefined;
            repeating?: boolean | undefined;
        }[] | undefined;
        argv?: string[] | undefined;
        timeoutMs?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    bin: string;
    strict: boolean;
    subcommands: Record<string, {
        description: string;
        mutating: boolean;
        args: {
            name: string;
            type: "string" | "boolean" | "integer";
            required: boolean;
            repeating: boolean;
            flag?: string | undefined;
            description?: string | undefined;
        }[];
        argv: string[];
        timeoutMs: number;
    }>;
}, {
    description: string;
    bin: string;
    subcommands: Record<string, {
        description: string;
        mutating?: boolean | undefined;
        args?: {
            name: string;
            flag?: string | undefined;
            description?: string | undefined;
            type?: "string" | "boolean" | "integer" | undefined;
            required?: boolean | undefined;
            repeating?: boolean | undefined;
        }[] | undefined;
        argv?: string[] | undefined;
        timeoutMs?: number | undefined;
    }>;
    strict?: boolean | undefined;
}>;
export type CliManifest = z.infer<typeof CliManifestSchema>;
