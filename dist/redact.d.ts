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
/**
 * Run every rule over `s`. Each match is replaced inline with the
 * `<REDACTED>` marker; structure / line breaks / surrounding context
 * are preserved so operators can still read the log.
 *
 * Deliberately NOT redacted: hex sha digests, IPv4/IPv6 addresses,
 * email addresses, ULIDs, UUIDs. These are routinely useful in
 * incident triage and rarely sensitive on their own.
 */
export declare function redactOutput(s: string): string;
