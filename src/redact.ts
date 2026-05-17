/**
 * Output redactor (doc 15 §3).
 *
 * Wrapped CLIs frequently echo back tokens — `aws sts get-caller-identity`
 * dumps the access key, `gh auth status` leaks `gh_*` tokens, and curl
 * output happily prints whatever Authorization header you fed it. Before
 * stdout/stderr lands in audit logs / dashboard transcripts we run every
 * line through this redactor.
 *
 * Each pattern below has a one-line rationale because regex-driven
 * redaction tends to bit-rot silently as new token formats appear.
 * Patterns are intentionally conservative — when in doubt, leave the
 * value alone (false negatives are an audit-trail bug; false positives
 * destroy debug context).
 */

const REPLACEMENT = '<REDACTED>';

interface Rule {
  /** Short label kept for future structured-logging — not used at runtime. */
  label: string;
  /** Pattern with at least one capture group; only that group is redacted. */
  pattern: RegExp;
  /** When true, the entire match is replaced. */
  whole?: boolean;
}

const RULES: Rule[] = [
  // AWS access key IDs are a fixed shape: `AKIA` + 16 base32 chars. Distinctive
  // enough that whole-match replacement is safe (no risk of stomping prose).
  { label: 'aws-access-key-id', pattern: /AKIA[0-9A-Z]{16}/g, whole: true },

  // AWS secret access keys aren't self-identifying; the only reliable signal is
  // the `aws_secret_access_key = …` pairing in `~/.aws/credentials` output.
  // Capture the value (40 chars of base64-ish) and replace just that group so
  // the surrounding context stays legible.
  {
    label: 'aws-secret-access-key',
    pattern: /(aws_secret_access_key\s*[=:]\s*)([A-Za-z0-9/+]{40})/gi,
  },

  // Bearer tokens — RFC 6750 syntax. 20 chars minimum to avoid clobbering
  // literal "Bearer Foo" in docs.
  { label: 'bearer', pattern: /Bearer\s+([A-Za-z0-9._-]{20,})/g },

  // GitHub PATs / fine-grained tokens / app installation tokens / user-to-server
  // tokens. Prefix `gh[pousr]_` is documented and unique.
  { label: 'github-token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, whole: true },

  // Slack tokens. `xoxa`/`xoxb`/`xoxp`/`xoxr`/`xoxs` covers app, bot, user,
  // refresh, session tokens.
  { label: 'slack-token', pattern: /xox[abprs]-[A-Za-z0-9-]{10,}/g, whole: true },

  // Generic high-entropy secrets in `key=value` style. We require a triggering
  // keyword (password/token/secret/key) to avoid mauling arbitrary base64 in
  // logs (e.g. content-hash digests). 16-char minimum dodges the worst false
  // positives.
  {
    label: 'generic-keyed-secret',
    pattern: /(password|token|secret|key)(\s*[=:]\s*['"]?)([A-Za-z0-9+/=_-]{16,})(['"]?)/gi,
  },

  // JWTs — three dot-separated base64url segments. The `eyJ` prefix is the
  // base64 of `{"` which every JWT header starts with, so it's a strong
  // identifying anchor.
  { label: 'jwt', pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, whole: true },
];

/**
 * Run every rule over `s`. Each match is replaced inline with the
 * `<REDACTED>` marker; structure / line breaks / surrounding context
 * are preserved so operators can still read the log.
 *
 * Deliberately NOT redacted: hex sha digests, IPv4/IPv6 addresses,
 * email addresses, ULIDs, UUIDs. These are routinely useful in
 * incident triage and rarely sensitive on their own.
 */
export function redactOutput(s: string): string {
  let out = s;
  for (const rule of RULES) {
    if (rule.whole) {
      out = out.replace(rule.pattern, REPLACEMENT);
      continue;
    }
    // For partial rules, replace only the secret-bearing capture group so the
    // surrounding context (key name, quotes, equals sign) survives.
    out = out.replace(rule.pattern, (match, ...groups) => {
      // Last two args from `replace` are offset + full string; drop them.
      const captures = groups.slice(0, -2) as string[];
      if (captures.length === 0) return REPLACEMENT;
      // Find the longest capture group — by convention it's the secret value.
      let secretIdx = 0;
      for (let i = 1; i < captures.length; i++) {
        if ((captures[i] ?? '').length > (captures[secretIdx] ?? '').length) secretIdx = i;
      }
      const secret = captures[secretIdx];
      if (!secret) return match;
      return match.replace(secret, REPLACEMENT);
    });
  }
  return out;
}
