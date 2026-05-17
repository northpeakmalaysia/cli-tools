import type { ArgSpec, CliManifest, Subcommand } from './manifest.js';

/**
 * Heuristic `--help` parser (doc 15 §3).
 *
 * Most modern CLIs (docker, kubectl, git, gh, ...) emit a roughly
 * uniform two-column help layout: leading whitespace, the flag or
 * subcommand token(s), at least two spaces of gutter, then a free-text
 * description. We exploit that shape with deliberately conservative
 * regexes — the goal is to seed a manifest that a human will polish,
 * not to capture every edge case (heredocs, multi-line wrapping,
 * sub-sub-commands beyond two levels, etc.).
 *
 * Output sets `mutating: false` for every subcommand; callers layer
 * `policy.ts#classifySubcommand` on top to flip the destructive ones.
 */

/** A line that looks like `  ps    List containers`. */
const SUBCOMMAND_LINE = /^\s{2,}([a-z][\w-]+)\s{2,}(\S.*?)\s*$/;

/**
 * A flag line — supports:
 *   `-a, --all                  Show all`
 *   `-f, --filter FILTER        Filter`
 *   `--format string            Format output`
 *   `-n int                     Number of lines`
 *   `--dry-run                  Don't actually do it`
 *
 * Capture groups:
 *   1: optional short flag (`-a`)
 *   2: long flag (`--all`)  OR  short flag when no long form
 *   3: optional value spec (`FILTER`, `string`, `int`, `<pattern>`)
 *   4: description
 */
const FLAG_LINE =
  /^\s{2,}(?:(-[A-Za-z0-9]),\s+)?(--?[A-Za-z0-9][\w-]*)(?:[=\s]+([A-Za-z<][\w<>.-]*))?\s{2,}(\S.*?)\s*$/;

/**
 * Tokens used by many help formatters to describe the type of a flag's
 * argument. We map these to manifest `ArgSpec.type`.
 */
const INT_VALUE_HINTS = new Set(['int', 'integer', 'number', 'n', 'count']);
const STRING_VALUE_HINTS = new Set([
  'string',
  'str',
  'path',
  'file',
  'dir',
  'name',
  'url',
  'host',
  'value',
  'text',
  'pattern',
]);

/**
 * Parse a top-level `<bin> --help` blob. Returns whatever it could
 * extract — the caller layers this onto a hand-tuned base manifest.
 */
export function parseHelp(text: string): Partial<CliManifest> {
  const lines = text.split(/\r?\n/);
  const subcommands: Record<string, Subcommand> = {};
  const topLevelArgs: ArgSpec[] = [];

  // Cheap section tracking — many CLIs split `Commands:` / `Options:`.
  // We don't strictly require it; lines are matched on shape, not section.
  let inCommands = false;
  let inFlags = false;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    const lower = line.trim().toLowerCase();

    if (/^(commands?|subcommands?|management commands?|available commands?):?$/.test(lower)) {
      inCommands = true;
      inFlags = false;
      continue;
    }
    if (/^(options?|flags?|global options?):?$/.test(lower)) {
      inFlags = true;
      inCommands = false;
      continue;
    }
    if (lower === '' || /^[a-z][\w ]+:\s*$/i.test(lower)) {
      // Blank lines and other section headers reset the section gate
      // but keep accumulating — we still pattern-match every line.
      if (lower === '') {
        inCommands = false;
        inFlags = false;
      }
      continue;
    }

    const flagMatch = FLAG_LINE.exec(line);
    if (flagMatch) {
      const arg = flagToArgSpec(flagMatch);
      if (arg) topLevelArgs.push(arg);
      continue;
    }

    // Don't mistake a flag for a subcommand — `-x` would otherwise hit
    // the broader SUBCOMMAND_LINE pattern with the `-` stripped.
    if (line.trim().startsWith('-')) continue;

    const subMatch = SUBCOMMAND_LINE.exec(line);
    if (subMatch && (inCommands || !inFlags)) {
      const [, name, desc] = subMatch;
      if (!name || subcommands[name]) continue;
      subcommands[name] = {
        description: desc?.trim() ?? '',
        mutating: false,
        argv: [name],
        args: [],
        timeoutMs: 60_000,
      };
    }
  }

  const out: Partial<CliManifest> = {};
  if (Object.keys(subcommands).length > 0) out.subcommands = subcommands;
  if (topLevelArgs.length > 0) {
    // Stash top-level flags under a synthetic root subcommand so the
    // caller can lift them onto every concrete sub later. Naming
    // chosen to avoid clashing with real CLI verbs.
    out.subcommands = {
      ...(out.subcommands ?? {}),
      __root__: {
        description: 'Top-level flags inherited by every subcommand',
        mutating: false,
        argv: [],
        args: topLevelArgs,
        timeoutMs: 60_000,
      },
    };
  }
  return out;
}

/**
 * Parse `<bin> <sub> --help` and return one fully-populated Subcommand
 * (argv pinned to `parentArgv`, description and args filled).
 */
export function parseSubcommandHelp(text: string, subName: string, parentArgv: string[]): Subcommand {
  const lines = text.split(/\r?\n/);
  const args: ArgSpec[] = [];
  let description = '';
  let inFlags = false;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    const lower = line.trim().toLowerCase();

    if (/^(options?|flags?):?$/.test(lower)) {
      inFlags = true;
      continue;
    }
    if (lower === '') {
      inFlags = false;
      continue;
    }

    // First non-blank, non-header line that looks like prose becomes the description.
    if (
      !description &&
      !inFlags &&
      !line.startsWith(' ') &&
      !/^usage:/i.test(line) &&
      !/^[a-z][\w ]+:\s*$/i.test(line)
    ) {
      description = line.trim();
      continue;
    }

    const flagMatch = FLAG_LINE.exec(line);
    if (flagMatch) {
      const arg = flagToArgSpec(flagMatch);
      if (arg && !args.find((a) => a.name === arg.name)) args.push(arg);
    }
  }

  return {
    description: description || `${subName} subcommand`,
    mutating: false,
    argv: parentArgv.length > 0 ? parentArgv : [subName],
    args,
    timeoutMs: 60_000,
  };
}

function flagToArgSpec(match: RegExpExecArray): ArgSpec | null {
  const [, , longOrShort, valueHint] = match;
  if (!longOrShort) return null;

  // Prefer the long form when present; we got it via group 2.
  const flag = longOrShort;
  // Derive a CamelCase-ish identifier from the flag name. `--dry-run` → `dryRun`.
  const stripped = flag.replace(/^-+/, '');
  const name = stripped.replace(/-([a-z0-9])/gi, (_m, c: string) => c.toUpperCase());
  if (!name) return null;

  // No value hint at all → boolean. Otherwise sniff the hint.
  let type: ArgSpec['type'] = 'boolean';
  if (valueHint) {
    const hint = valueHint.toLowerCase().replace(/[<>]/g, '');
    if (INT_VALUE_HINTS.has(hint)) type = 'integer';
    else if (STRING_VALUE_HINTS.has(hint)) type = 'string';
    else type = 'string'; // Unknown hint → assume string (safer than boolean).
  }

  return {
    name,
    flag,
    description: match[4]?.trim(),
    type,
    required: false,
    repeating: false,
  };
}
