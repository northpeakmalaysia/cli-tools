# @swarmai/cli-tools

> **SwarmAI plugin** — Wraps installed CLIs as agent-callable tools, with capability-ladder policy gating.

Bridges any CLI on the host machine (docker, git, kubectl, npm, aws, terraform, …, plus Android-specific tools like `am`, `pm`, `pkg`, `svc`, `input` for Termux) into the SwarmAI tool registry. Each subcommand becomes a tool named `cli.<bin>.<sub>`; read-only subcommands register as `pair-gated`, mutating / destructive ones as `master`.

Carved out of the monorepo's `@swarmai/cli-wrapper` package so operators can install / update the wrapper independently of the host runtime.

## Install

1. Drop this folder into `F:\Published\Pluggins\` (Windows) or `~/.swarmai/plugins/` (POSIX), or anywhere on `$SWARMAI_PLUGINS_DIR`.
2. (If using a custom layout) set `SWARMAI_PLUGINS_DIR` to the parent directory before launching the gateway.
3. Restart `swarmai start`. Boot logs will include `plugin-loader: resolved plugin discovery roots` listing where the loader looked.

The plugin ships as a standalone package — `pnpm/npm install` inside this folder only pulls `yaml` + dev deps; `@swarmai/plugin-sdk` and `@swarmai/shared` come from the host as peer dependencies.

## Configuration

Per-workspace at `<workspaceRoot>/cli-tools.yaml`:

```yaml
version: 1
clis:
  - name: git
    enabled: true                  # off by default; flip per-CLI opt-in
    # binPath: /usr/bin/git        # optional — overrides PATH discovery
    # defaultMutatingPolicy: pair-gated   # optional — downgrade non-destructive mutates
  - name: docker
    enabled: false
  - name: kubectl
    enabled: true
    defaultMutatingPolicy: pair-gated
```

Fresh installs see zero CLI tools registered. The plugin never auto-writes this file — operators opt in deliberately.

## Bundled manifests

50 starter manifests ship in `src/bundled.ts`. Operators extend in `~/.swarmai/cli-manifests/` (hand-written manifests win over bundled).

| Category | CLIs |
| --- | --- |
| Source control | `git`, `gh`, `glab`, `svn`, `hg` |
| Containers | `docker`, `podman`, `kubectl`, `helm`, `kustomize`, `k9s` |
| Package managers | `npm`, `pnpm`, `yarn`, `bun`, `pip`, `poetry`, `uv`, `cargo` |
| Cloud | `aws`, `gcloud`, `az`, `heroku`, `fly`, `doctl`, `supabase` |
| Databases | `psql`, `mysql`, `redis-cli`, `sqlite3`, `mongo` |
| Media / data | `ffmpeg`, `magick`, `jq`, `yq`, `xmllint` |
| Network | `curl`, `httpie` |
| Search / file | `rg`, `fd`, `bat`, `eza` |
| Infrastructure | `terraform`, `ansible`, `packer`, `vagrant` |
| Android (Termux) | `am`, `pm`, `pkg`, `svc`, `input`, `termux-battery-status` |

## Adding a custom manifest

Implement the `CliManifest` type from `src/manifest.ts`:

```ts
import type { CliManifest } from '@swarmai/cli-tools';

export const MY_TOOL_MANIFEST: CliManifest = {
  bin: 'my-tool',
  description: 'Internal devops swiss-army knife.',
  strict: true,
  subcommands: {
    status: { description: 'Show status', mutating: false, argv: ['status'], args: [], timeoutMs: 30_000 },
    deploy: { description: 'Deploy app', mutating: true,  argv: ['deploy'], args: [
      { name: 'env', type: 'string', required: true } as never,
    ], timeoutMs: 5 * 60_000 },
  },
};
```

Drop the file in `~/.swarmai/cli-manifests/my-tool.ts` once the hand-written-manifest loader lands (doc 15 §2). Until then, hosts can pass the manifest via the `manifests:` option on `registerCliWrappedTools()`.

## Security model

- **Argv-only spawning.** `wrap.ts` calls `child_process.spawn(bin, argv, { shell: false })`. User-supplied args never reach a shell interpreter — no injection surface.
- **Read-only → pair-gated.** Subcommands marked `mutating: false` register with `policy: 'pair-gated'`. Any paired master can invoke them.
- **Mutating → master.** Subcommands with `mutating: true` register with `policy: 'master'` by default. Override per-CLI to `pair-gated` via `defaultMutatingPolicy` in `cli-tools.yaml`.
- **Output redaction.** stdout/stderr pass through `redact.ts` before audit logging — AWS keys, GitHub PATs, Slack tokens, JWTs, Bearer headers, and generic `password=…` / `token=…` pairs are replaced with `<REDACTED>`.
- **Hard timeouts.** Every spawn has a per-subcommand `timeoutMs` (default 60s); SIGTERM on timeout.
- **Output cap.** stdout/stderr capped at 32KB per call, truncated marker appended.

## Android (Termux) note

Works in Termux out of the box. The bundled set includes `am` (activity manager), `pm` (package manager), `pkg` (apt wrapper), `svc` (system services), `input` (input events), and `termux-battery-status`. Useful for SwarmAI hosts running on Pixel/Samsung devices for ambient automation.

## Plugin contract (advanced)

For 0.1.0 the loader-invoked `register(api)` is a no-op (plugin SDK doesn't yet hand the plugin workspace-root / native-tool snapshot). Hosts call `registerCliWrappedTools(opts)` directly during boot:

```ts
import { registerCliWrappedTools } from '@swarmai/cli-tools';
import { register, toolRegistry } from '@swarmai/tools';

await registerCliWrappedTools({
  workspaceRoot,
  logger,
  registerTool: register,
  nativeToolNames: new Set(toolRegistry.list().map((t) => t.name)),
});
```

A later plugin-SDK version will subsume this into the standard `register(api)` contract.

## Build (for forks)

```sh
npm install
npm run build       # tsc → dist/
npm run typecheck
```

## License

PolyForm Noncommercial 1.0.0. Matches the SwarmAI Hub default published-plugin license.
