import type { CliManifest, Subcommand } from './manifest.js';
/**
 * Parse a top-level `<bin> --help` blob. Returns whatever it could
 * extract — the caller layers this onto a hand-tuned base manifest.
 */
export declare function parseHelp(text: string): Partial<CliManifest>;
/**
 * Parse `<bin> <sub> --help` and return one fully-populated Subcommand
 * (argv pinned to `parentArgv`, description and args filled).
 */
export declare function parseSubcommandHelp(text: string, subName: string, parentArgv: string[]): Subcommand;
