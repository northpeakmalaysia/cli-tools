import type { CliManifest } from './manifest.js';
/**
 * Bundled CLI manifests (doc 15 §3.6 — "40+ pre-configured CLI manifests").
 *
 * These are starter manifests for common tools. Each is intentionally
 * minimal — operators copy and extend in `~/.swarmai/cli-manifests/`.
 * Mutating subcommands get `mutating: true` so `wrapCli` registers
 * them as master-policy.
 *
 * Subcommand-name keys use `snake_case` joining the actual argv parts
 * (`get_pods`, not `getPods` or `get pods`). The dot becomes
 * `cli.<bin>.<sub_name>` in the wrap layer.
 *
 * Conservative defaults — when in doubt the entry is `mutating: true`.
 * Operators who want a leaner read-only surface pin their own manifest
 * in `~/.swarmai/cli-manifests/` and that wins over the bundled one.
 */
export declare const GIT_MANIFEST: CliManifest;
export declare const DOCKER_MANIFEST: CliManifest;
export declare const KUBECTL_MANIFEST: CliManifest;
export declare const NPM_MANIFEST: CliManifest;
export declare const GH_MANIFEST: CliManifest;
export declare const GLAB_MANIFEST: CliManifest;
export declare const SVN_MANIFEST: CliManifest;
export declare const HG_MANIFEST: CliManifest;
export declare const PODMAN_MANIFEST: CliManifest;
export declare const HELM_MANIFEST: CliManifest;
export declare const KUSTOMIZE_MANIFEST: CliManifest;
export declare const K9S_MANIFEST: CliManifest;
export declare const PNPM_MANIFEST: CliManifest;
export declare const YARN_MANIFEST: CliManifest;
export declare const BUN_MANIFEST: CliManifest;
export declare const PIP_MANIFEST: CliManifest;
export declare const POETRY_MANIFEST: CliManifest;
export declare const UV_MANIFEST: CliManifest;
export declare const CARGO_MANIFEST: CliManifest;
export declare const AWS_MANIFEST: CliManifest;
export declare const GCLOUD_MANIFEST: CliManifest;
export declare const AZ_MANIFEST: CliManifest;
export declare const HEROKU_MANIFEST: CliManifest;
export declare const FLY_MANIFEST: CliManifest;
export declare const DOCTL_MANIFEST: CliManifest;
export declare const SUPABASE_MANIFEST: CliManifest;
export declare const PSQL_MANIFEST: CliManifest;
export declare const MYSQL_MANIFEST: CliManifest;
export declare const REDIS_CLI_MANIFEST: CliManifest;
export declare const SQLITE3_MANIFEST: CliManifest;
export declare const MONGO_MANIFEST: CliManifest;
export declare const FFMPEG_MANIFEST: CliManifest;
export declare const MAGICK_MANIFEST: CliManifest;
export declare const JQ_MANIFEST: CliManifest;
export declare const YQ_MANIFEST: CliManifest;
export declare const XMLLINT_MANIFEST: CliManifest;
export declare const CURL_MANIFEST: CliManifest;
export declare const HTTPIE_MANIFEST: CliManifest;
export declare const RG_MANIFEST: CliManifest;
export declare const FD_MANIFEST: CliManifest;
export declare const BAT_MANIFEST: CliManifest;
export declare const EZA_MANIFEST: CliManifest;
export declare const TERRAFORM_MANIFEST: CliManifest;
export declare const ANSIBLE_MANIFEST: CliManifest;
export declare const PACKER_MANIFEST: CliManifest;
export declare const VAGRANT_MANIFEST: CliManifest;
/**
 * Android Activity Manager — `am`. Available on every Android device
 * but restricted: a plain Termux shell can only launch its own
 * activities. The interesting use-cases (launching arbitrary apps,
 * force-stopping background apps) require the elevated `shell` uid via
 * Shizuku — operators using these via Shizuku call `shizuku_run`
 * directly. This manifest covers the non-elevated path.
 */
export declare const AM_MANIFEST: CliManifest;
/**
 * Android Package Manager — `pm`. Read-only operations only here
 * (package listing, path-of-apk, dump). Install/uninstall would need
 * the elevated `shell` uid and go through `shizuku_run` instead.
 */
export declare const PM_MANIFEST: CliManifest;
/**
 * Termux `pkg` — wraps Debian's `apt` under the hood. Read-only listing
 * + search are pair-gated, install / upgrade / uninstall are mutating.
 */
export declare const TERMUX_PKG_MANIFEST: CliManifest;
/**
 * Termux:API battery — `termux-battery-status`. Single read-only call,
 * emits JSON. Lives alongside the desktop `battery` tool which already
 * routes through this binary on Android; the manifest gives the agent
 * a direct CLI surface too (one-line scripts can shell out to it
 * without going through `desktop.battery`).
 */
export declare const TERMUX_BATTERY_MANIFEST: CliManifest;
/**
 * Android service control — `svc`. Toggles WiFi/Bluetooth/data radios
 * and (destructively) reboots the device. The binary itself requires
 * root or the system uid; on a non-rooted device it MUST be invoked via
 * Shizuku's `rish` shell (i.e. through the `shizuku_run` tool, or by a
 * wrapping shell that's already been elevated). The wrapper does NOT
 * enforce that — see the description.
 */
export declare const SVC_MANIFEST: CliManifest;
/**
 * Android input injection — `input`. Synthesises key events, taps,
 * swipes, and text input. Same elevation story as `svc`: needs root or
 * shell-uid in the general case, so must be invoked via Shizuku's `rish`
 * (use the `shizuku_run` tool from agent code).
 */
export declare const INPUT_MANIFEST: CliManifest;
/**
 * All bundled manifests in alphabetical order by bin name (excepting
 * the original four, which stay at the top for diff continuity).
 */
export declare const BUNDLED_MANIFESTS: CliManifest[];
