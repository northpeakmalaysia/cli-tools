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

// ─── Source control / dev ────────────────────────────────────────────

export const GIT_MANIFEST: CliManifest = {
  bin: 'git',
  description: 'Git VCS — read-only ops only by default; mutating ops marked.',
  strict: true,
  subcommands: {
    status: { description: 'Show working tree status', mutating: false, argv: ['status'], args: [], timeoutMs: 30_000 },
    log: {
      description: 'Show commit log',
      mutating: false,
      argv: ['log', '--oneline', '-n'],
      args: [{ name: 'n', type: 'integer', required: false, description: 'Number of commits' } as never],
      timeoutMs: 30_000,
    },
    diff: { description: 'Show changes', mutating: false, argv: ['diff'], args: [], timeoutMs: 30_000 },
    show: {
      description: 'Show a commit / object',
      mutating: false,
      argv: ['show'],
      args: [{ name: 'ref', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    branch: { description: 'List branches', mutating: false, argv: ['branch', '-vv'], args: [], timeoutMs: 30_000 },
    add: {
      description: 'Stage files for commit',
      mutating: true,
      argv: ['add'],
      args: [{ name: 'paths', type: 'string', required: true, repeating: true, description: 'Paths to add' } as never],
      timeoutMs: 30_000,
    },
    commit: {
      description: 'Record changes to the repository',
      mutating: true,
      argv: ['commit', '-m'],
      args: [{ name: 'message', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    push: {
      description: 'Push commits to a remote',
      mutating: true,
      argv: ['push'],
      args: [
        { name: 'remote', type: 'string', required: false } as never,
        { name: 'branch', type: 'string', required: false } as never,
      ],
      timeoutMs: 2 * 60_000,
    },
  },
};

export const DOCKER_MANIFEST: CliManifest = {
  bin: 'docker',
  description: 'Docker container CLI.',
  strict: true,
  subcommands: {
    ps: { description: 'List containers', mutating: false, argv: ['ps'], args: [], timeoutMs: 30_000 },
    images: { description: 'List images', mutating: false, argv: ['images'], args: [], timeoutMs: 30_000 },
    logs: {
      description: 'Fetch container logs',
      mutating: false,
      argv: ['logs', '--tail', '500'],
      args: [{ name: 'container', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    inspect: {
      description: 'Inspect a container or image',
      mutating: false,
      argv: ['inspect'],
      args: [{ name: 'target', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    stats: {
      description: 'Live resource usage stats (one shot)',
      mutating: false,
      argv: ['stats', '--no-stream'],
      args: [],
      timeoutMs: 30_000,
    },
    restart: {
      description: 'Restart a container',
      mutating: true,
      argv: ['restart'],
      args: [{ name: 'container', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    pull: {
      description: 'Pull an image',
      mutating: true,
      argv: ['pull'],
      args: [{ name: 'image', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

export const KUBECTL_MANIFEST: CliManifest = {
  bin: 'kubectl',
  description: 'Kubernetes CLI.',
  strict: true,
  subcommands: {
    get_pods: {
      description: 'List pods',
      mutating: false,
      argv: ['get', 'pods'],
      args: [{ name: 'namespace', flag: '-n', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    get_services: {
      description: 'List services',
      mutating: false,
      argv: ['get', 'services'],
      args: [{ name: 'namespace', flag: '-n', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    get_nodes: { description: 'List nodes', mutating: false, argv: ['get', 'nodes'], args: [], timeoutMs: 30_000 },
    describe_pod: {
      description: 'Describe a pod',
      mutating: false,
      argv: ['describe', 'pod'],
      args: [
        { name: 'pod', type: 'string', required: true } as never,
        { name: 'namespace', flag: '-n', type: 'string', required: false } as never,
      ],
      timeoutMs: 30_000,
    },
    logs: {
      description: 'Fetch pod logs',
      mutating: false,
      argv: ['logs', '--tail=500'],
      args: [
        { name: 'pod', type: 'string', required: true } as never,
        { name: 'namespace', flag: '-n', type: 'string', required: false } as never,
      ],
      timeoutMs: 60_000,
    },
    top_pod: {
      description: 'Show pod CPU/mem usage',
      mutating: false,
      argv: ['top', 'pod'],
      args: [{ name: 'namespace', flag: '-n', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    apply: {
      description: 'Apply a manifest file',
      mutating: true,
      argv: ['apply', '-f'],
      args: [{ name: 'file', type: 'string', required: true } as never],
      timeoutMs: 2 * 60_000,
    },
    delete_pod: {
      description: 'Delete a pod',
      mutating: true,
      argv: ['delete', 'pod'],
      args: [
        { name: 'pod', type: 'string', required: true } as never,
        { name: 'namespace', flag: '-n', type: 'string', required: false } as never,
      ],
      timeoutMs: 2 * 60_000,
    },
    rollout_restart: {
      description: 'Restart a deployment rollout',
      mutating: true,
      argv: ['rollout', 'restart'],
      args: [
        { name: 'target', type: 'string', required: true, description: 'e.g. deployment/foo' } as never,
        { name: 'namespace', flag: '-n', type: 'string', required: false } as never,
      ],
      timeoutMs: 15 * 60_000,
    },
  },
};

export const NPM_MANIFEST: CliManifest = {
  bin: 'npm',
  description: 'Node package manager.',
  strict: true,
  subcommands: {
    list: { description: 'List installed packages', mutating: false, argv: ['list', '--depth=0'], args: [], timeoutMs: 30_000 },
    outdated: { description: 'List outdated packages', mutating: false, argv: ['outdated'], args: [], timeoutMs: 30_000 },
    view: {
      description: 'View registry info for a package',
      mutating: false,
      argv: ['view'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    audit: { description: 'Audit installed packages', mutating: false, argv: ['audit'], args: [], timeoutMs: 60_000 },
    install: {
      description: 'Install a package',
      mutating: true,
      argv: ['install'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
    update: {
      description: 'Update a package',
      mutating: true,
      argv: ['update'],
      args: [{ name: 'package', type: 'string', required: false } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

// ─── Additional source control / dev ─────────────────────────────────

export const GH_MANIFEST: CliManifest = {
  bin: 'gh',
  description: 'GitHub CLI.',
  strict: true,
  subcommands: {
    pr_list: { description: 'List pull requests', mutating: false, argv: ['pr', 'list'], args: [], timeoutMs: 30_000 },
    pr_view: {
      description: 'View a pull request',
      mutating: false,
      argv: ['pr', 'view'],
      args: [{ name: 'pr', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    issue_list: { description: 'List issues', mutating: false, argv: ['issue', 'list'], args: [], timeoutMs: 30_000 },
    issue_view: {
      description: 'View an issue',
      mutating: false,
      argv: ['issue', 'view'],
      args: [{ name: 'issue', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    repo_view: { description: 'View the current repo', mutating: false, argv: ['repo', 'view'], args: [], timeoutMs: 30_000 },
    release_list: { description: 'List releases', mutating: false, argv: ['release', 'list'], args: [], timeoutMs: 30_000 },
    pr_create: {
      description: 'Create a pull request',
      mutating: true,
      argv: ['pr', 'create', '--title'],
      args: [
        { name: 'title', type: 'string', required: true } as never,
        { name: 'body', flag: '--body', type: 'string', required: false } as never,
      ],
      timeoutMs: 60_000,
    },
    issue_create: {
      description: 'Create an issue',
      mutating: true,
      argv: ['issue', 'create', '--title'],
      args: [
        { name: 'title', type: 'string', required: true } as never,
        { name: 'body', flag: '--body', type: 'string', required: false } as never,
      ],
      timeoutMs: 60_000,
    },
  },
};

export const GLAB_MANIFEST: CliManifest = {
  bin: 'glab',
  description: 'GitLab CLI.',
  strict: true,
  subcommands: {
    mr_list: { description: 'List merge requests', mutating: false, argv: ['mr', 'list'], args: [], timeoutMs: 30_000 },
    mr_view: {
      description: 'View a merge request',
      mutating: false,
      argv: ['mr', 'view'],
      args: [{ name: 'mr', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    issue_list: { description: 'List issues', mutating: false, argv: ['issue', 'list'], args: [], timeoutMs: 30_000 },
    mr_create: {
      description: 'Create a merge request',
      mutating: true,
      argv: ['mr', 'create', '--title'],
      args: [{ name: 'title', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
  },
};

export const SVN_MANIFEST: CliManifest = {
  bin: 'svn',
  description: 'Apache Subversion VCS.',
  strict: true,
  subcommands: {
    status: { description: 'Show working copy status', mutating: false, argv: ['status'], args: [], timeoutMs: 30_000 },
    info: { description: 'Show working copy info', mutating: false, argv: ['info'], args: [], timeoutMs: 30_000 },
    log: { description: 'Show commit log', mutating: false, argv: ['log', '-l', '20'], args: [], timeoutMs: 30_000 },
    diff: { description: 'Show changes', mutating: false, argv: ['diff'], args: [], timeoutMs: 30_000 },
    update: { description: 'Update working copy', mutating: true, argv: ['update'], args: [], timeoutMs: 5 * 60_000 },
    commit: {
      description: 'Commit changes',
      mutating: true,
      argv: ['commit', '-m'],
      args: [{ name: 'message', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
  },
};

export const HG_MANIFEST: CliManifest = {
  bin: 'hg',
  description: 'Mercurial VCS.',
  strict: true,
  subcommands: {
    status: { description: 'Show working dir status', mutating: false, argv: ['status'], args: [], timeoutMs: 30_000 },
    log: { description: 'Show commit log', mutating: false, argv: ['log', '-l', '20'], args: [], timeoutMs: 30_000 },
    diff: { description: 'Show changes', mutating: false, argv: ['diff'], args: [], timeoutMs: 30_000 },
    commit: {
      description: 'Commit changes',
      mutating: true,
      argv: ['commit', '-m'],
      args: [{ name: 'message', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    push: { description: 'Push commits', mutating: true, argv: ['push'], args: [], timeoutMs: 2 * 60_000 },
  },
};

// ─── Containers / orchestration ──────────────────────────────────────

export const PODMAN_MANIFEST: CliManifest = {
  bin: 'podman',
  description: 'Podman container CLI (Docker-compatible).',
  strict: true,
  subcommands: {
    ps: { description: 'List containers', mutating: false, argv: ['ps'], args: [], timeoutMs: 30_000 },
    images: { description: 'List images', mutating: false, argv: ['images'], args: [], timeoutMs: 30_000 },
    inspect: {
      description: 'Inspect a container or image',
      mutating: false,
      argv: ['inspect'],
      args: [{ name: 'target', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    logs: {
      description: 'Fetch container logs',
      mutating: false,
      argv: ['logs', '--tail', '500'],
      args: [{ name: 'container', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    pull: {
      description: 'Pull an image',
      mutating: true,
      argv: ['pull'],
      args: [{ name: 'image', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
    restart: {
      description: 'Restart a container',
      mutating: true,
      argv: ['restart'],
      args: [{ name: 'container', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
  },
};

export const HELM_MANIFEST: CliManifest = {
  bin: 'helm',
  description: 'Helm package manager for Kubernetes.',
  strict: true,
  subcommands: {
    list: { description: 'List releases', mutating: false, argv: ['list'], args: [], timeoutMs: 30_000 },
    status: {
      description: 'Show release status',
      mutating: false,
      argv: ['status'],
      args: [{ name: 'release', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    history: {
      description: 'Show release history',
      mutating: false,
      argv: ['history'],
      args: [{ name: 'release', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    install: {
      description: 'Install a chart',
      mutating: true,
      argv: ['install'],
      args: [
        { name: 'release', type: 'string', required: true } as never,
        { name: 'chart', type: 'string', required: true } as never,
      ],
      timeoutMs: 15 * 60_000,
    },
    upgrade: {
      description: 'Upgrade a release',
      mutating: true,
      argv: ['upgrade'],
      args: [
        { name: 'release', type: 'string', required: true } as never,
        { name: 'chart', type: 'string', required: true } as never,
      ],
      timeoutMs: 15 * 60_000,
    },
  },
};

export const KUSTOMIZE_MANIFEST: CliManifest = {
  bin: 'kustomize',
  description: 'Kustomize manifest customisation tool.',
  strict: true,
  subcommands: {
    build: {
      description: 'Build a kustomization',
      mutating: false,
      argv: ['build'],
      args: [{ name: 'path', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    version: { description: 'Show version', mutating: false, argv: ['version'], args: [], timeoutMs: 10_000 },
  },
};

export const K9S_MANIFEST: CliManifest = {
  bin: 'k9s',
  description: 'k9s TUI for Kubernetes (info-only wrap).',
  strict: true,
  subcommands: {
    info: { description: 'Show k9s info', mutating: false, argv: ['info'], args: [], timeoutMs: 10_000 },
    version: { description: 'Show k9s version', mutating: false, argv: ['version'], args: [], timeoutMs: 10_000 },
  },
};

// ─── Node / JS ───────────────────────────────────────────────────────

export const PNPM_MANIFEST: CliManifest = {
  bin: 'pnpm',
  description: 'pnpm package manager (workspace-aware).',
  strict: true,
  subcommands: {
    list: { description: 'List installed packages', mutating: false, argv: ['list', '--depth=0'], args: [], timeoutMs: 30_000 },
    outdated: { description: 'List outdated packages', mutating: false, argv: ['outdated'], args: [], timeoutMs: 60_000 },
    why: {
      description: 'Explain why a package is installed',
      mutating: false,
      argv: ['why'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    install: {
      description: 'Install a package',
      mutating: true,
      argv: ['install'],
      args: [{ name: 'package', type: 'string', required: false } as never],
      timeoutMs: 5 * 60_000,
    },
    add: {
      description: 'Add a package',
      mutating: true,
      argv: ['add'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

export const YARN_MANIFEST: CliManifest = {
  bin: 'yarn',
  description: 'Yarn package manager.',
  strict: true,
  subcommands: {
    list: { description: 'List installed packages', mutating: false, argv: ['list'], args: [], timeoutMs: 30_000 },
    info: {
      description: 'Show package info',
      mutating: false,
      argv: ['info'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    outdated: { description: 'List outdated packages', mutating: false, argv: ['outdated'], args: [], timeoutMs: 60_000 },
    install: { description: 'Install dependencies', mutating: true, argv: ['install'], args: [], timeoutMs: 5 * 60_000 },
    add: {
      description: 'Add a package',
      mutating: true,
      argv: ['add'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

export const BUN_MANIFEST: CliManifest = {
  bin: 'bun',
  description: 'Bun runtime and package manager.',
  strict: true,
  subcommands: {
    pm_ls: { description: 'List installed packages', mutating: false, argv: ['pm', 'ls'], args: [], timeoutMs: 30_000 },
    outdated: { description: 'List outdated packages', mutating: false, argv: ['outdated'], args: [], timeoutMs: 60_000 },
    install: { description: 'Install dependencies', mutating: true, argv: ['install'], args: [], timeoutMs: 5 * 60_000 },
    add: {
      description: 'Add a package',
      mutating: true,
      argv: ['add'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

// ─── Python / Rust ───────────────────────────────────────────────────

export const PIP_MANIFEST: CliManifest = {
  bin: 'pip',
  description: 'Python package installer.',
  strict: true,
  subcommands: {
    list: { description: 'List installed packages', mutating: false, argv: ['list'], args: [], timeoutMs: 30_000 },
    show: {
      description: 'Show package info',
      mutating: false,
      argv: ['show'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    freeze: { description: 'Output installed pkgs as requirements', mutating: false, argv: ['freeze'], args: [], timeoutMs: 30_000 },
    install: {
      description: 'Install a package',
      mutating: true,
      argv: ['install'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

export const POETRY_MANIFEST: CliManifest = {
  bin: 'poetry',
  description: 'Poetry Python dependency manager.',
  strict: true,
  subcommands: {
    show: { description: 'List installed packages', mutating: false, argv: ['show'], args: [], timeoutMs: 30_000 },
    check: { description: 'Check pyproject.toml', mutating: false, argv: ['check'], args: [], timeoutMs: 30_000 },
    install: { description: 'Install deps from lockfile', mutating: true, argv: ['install'], args: [], timeoutMs: 5 * 60_000 },
    add: {
      description: 'Add a dependency',
      mutating: true,
      argv: ['add'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

export const UV_MANIFEST: CliManifest = {
  bin: 'uv',
  description: 'uv — fast Python package manager.',
  strict: true,
  subcommands: {
    pip_list: { description: 'List installed packages', mutating: false, argv: ['pip', 'list'], args: [], timeoutMs: 30_000 },
    pip_freeze: { description: 'Output installed pkgs', mutating: false, argv: ['pip', 'freeze'], args: [], timeoutMs: 30_000 },
    pip_install: {
      description: 'Install a package',
      mutating: true,
      argv: ['pip', 'install'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
    sync: { description: 'Sync env to lockfile', mutating: true, argv: ['sync'], args: [], timeoutMs: 5 * 60_000 },
  },
};

export const CARGO_MANIFEST: CliManifest = {
  bin: 'cargo',
  description: 'Rust package manager.',
  strict: true,
  subcommands: {
    check: { description: 'Type-check the project', mutating: false, argv: ['check'], args: [], timeoutMs: 5 * 60_000 },
    tree: { description: 'Display dep tree', mutating: false, argv: ['tree'], args: [], timeoutMs: 60_000 },
    metadata: {
      description: 'Output metadata as JSON',
      mutating: false,
      argv: ['metadata', '--format-version=1'],
      args: [],
      timeoutMs: 60_000,
    },
    build: { description: 'Build the project', mutating: true, argv: ['build'], args: [], timeoutMs: 15 * 60_000 },
    test: { description: 'Run tests', mutating: true, argv: ['test'], args: [], timeoutMs: 15 * 60_000 },
    add: {
      description: 'Add a dependency',
      mutating: true,
      argv: ['add'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
  },
};

// ─── Cloud ───────────────────────────────────────────────────────────

export const AWS_MANIFEST: CliManifest = {
  bin: 'aws',
  description: 'AWS CLI v2.',
  strict: true,
  subcommands: {
    s3_ls: {
      description: 'List S3 objects',
      mutating: false,
      argv: ['s3', 'ls'],
      args: [{ name: 'path', type: 'string', required: false, description: 's3://bucket[/prefix]' } as never],
      timeoutMs: 60_000,
    },
    s3_cp: {
      description: 'Copy a file to/from S3',
      mutating: true,
      argv: ['s3', 'cp'],
      args: [
        { name: 'source', type: 'string', required: true } as never,
        { name: 'dest', type: 'string', required: true } as never,
      ],
      timeoutMs: 5 * 60_000,
    },
    ec2_describe_instances: {
      description: 'Describe EC2 instances',
      mutating: false,
      argv: ['ec2', 'describe-instances'],
      args: [],
      timeoutMs: 60_000,
    },
    iam_list_users: { description: 'List IAM users', mutating: false, argv: ['iam', 'list-users'], args: [], timeoutMs: 60_000 },
    sts_get_caller_identity: {
      description: 'Show current AWS identity',
      mutating: false,
      argv: ['sts', 'get-caller-identity'],
      args: [],
      timeoutMs: 30_000,
    },
    cloudwatch_get_metric_data: {
      description: 'Fetch CloudWatch metric data',
      mutating: false,
      argv: ['cloudwatch', 'get-metric-data'],
      args: [
        { name: 'metric-data-queries', flag: '--metric-data-queries', type: 'string', required: true } as never,
        { name: 'start-time', flag: '--start-time', type: 'string', required: true } as never,
        { name: 'end-time', flag: '--end-time', type: 'string', required: true } as never,
      ],
      timeoutMs: 60_000,
    },
  },
};

export const GCLOUD_MANIFEST: CliManifest = {
  bin: 'gcloud',
  description: 'Google Cloud SDK.',
  strict: true,
  subcommands: {
    auth_list: { description: 'List authenticated accounts', mutating: false, argv: ['auth', 'list'], args: [], timeoutMs: 30_000 },
    config_list: { description: 'List config properties', mutating: false, argv: ['config', 'list'], args: [], timeoutMs: 30_000 },
    projects_list: { description: 'List projects', mutating: false, argv: ['projects', 'list'], args: [], timeoutMs: 60_000 },
    compute_instances_list: {
      description: 'List Compute Engine instances',
      mutating: false,
      argv: ['compute', 'instances', 'list'],
      args: [],
      timeoutMs: 60_000,
    },
    storage_ls: {
      description: 'List GCS objects',
      mutating: false,
      argv: ['storage', 'ls'],
      args: [{ name: 'path', type: 'string', required: false } as never],
      timeoutMs: 60_000,
    },
  },
};

export const AZ_MANIFEST: CliManifest = {
  bin: 'az',
  description: 'Azure CLI.',
  strict: true,
  subcommands: {
    account_show: { description: 'Show current Azure account', mutating: false, argv: ['account', 'show'], args: [], timeoutMs: 30_000 },
    vm_list: { description: 'List virtual machines', mutating: false, argv: ['vm', 'list'], args: [], timeoutMs: 60_000 },
    group_list: { description: 'List resource groups', mutating: false, argv: ['group', 'list'], args: [], timeoutMs: 60_000 },
    storage_account_list: {
      description: 'List storage accounts',
      mutating: false,
      argv: ['storage', 'account', 'list'],
      args: [],
      timeoutMs: 60_000,
    },
  },
};

export const HEROKU_MANIFEST: CliManifest = {
  bin: 'heroku',
  description: 'Heroku CLI.',
  strict: true,
  subcommands: {
    apps: { description: 'List apps', mutating: false, argv: ['apps'], args: [], timeoutMs: 30_000 },
    ps: {
      description: 'List app dynos',
      mutating: false,
      argv: ['ps'],
      args: [{ name: 'app', flag: '--app', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    logs: {
      description: 'Show app logs',
      mutating: false,
      argv: ['logs', '--num=500'],
      args: [{ name: 'app', flag: '--app', type: 'string', required: false } as never],
      timeoutMs: 60_000,
    },
    restart: {
      description: 'Restart app dynos',
      mutating: true,
      argv: ['restart'],
      args: [{ name: 'app', flag: '--app', type: 'string', required: false } as never],
      timeoutMs: 2 * 60_000,
    },
  },
};

export const FLY_MANIFEST: CliManifest = {
  bin: 'fly',
  description: 'Fly.io CLI.',
  strict: true,
  subcommands: {
    apps_list: { description: 'List apps', mutating: false, argv: ['apps', 'list'], args: [], timeoutMs: 30_000 },
    status: {
      description: 'Show app status',
      mutating: false,
      argv: ['status'],
      args: [{ name: 'app', flag: '--app', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    logs: {
      description: 'Stream app logs',
      mutating: false,
      argv: ['logs'],
      args: [{ name: 'app', flag: '--app', type: 'string', required: false } as never],
      timeoutMs: 60_000,
    },
    deploy: { description: 'Deploy the app', mutating: true, argv: ['deploy'], args: [], timeoutMs: 15 * 60_000 },
  },
};

export const DOCTL_MANIFEST: CliManifest = {
  bin: 'doctl',
  description: 'DigitalOcean CLI.',
  strict: true,
  subcommands: {
    auth_list: { description: 'List auth contexts', mutating: false, argv: ['auth', 'list'], args: [], timeoutMs: 30_000 },
    compute_droplet_list: {
      description: 'List droplets',
      mutating: false,
      argv: ['compute', 'droplet', 'list'],
      args: [],
      timeoutMs: 60_000,
    },
    account_get: { description: 'Show account info', mutating: false, argv: ['account', 'get'], args: [], timeoutMs: 30_000 },
  },
};

export const SUPABASE_MANIFEST: CliManifest = {
  bin: 'supabase',
  description: 'Supabase CLI.',
  strict: true,
  subcommands: {
    projects_list: { description: 'List projects', mutating: false, argv: ['projects', 'list'], args: [], timeoutMs: 60_000 },
    status: { description: 'Show local stack status', mutating: false, argv: ['status'], args: [], timeoutMs: 30_000 },
    db_diff: { description: 'Show schema diff', mutating: false, argv: ['db', 'diff'], args: [], timeoutMs: 60_000 },
  },
};

// ─── Databases ───────────────────────────────────────────────────────

export const PSQL_MANIFEST: CliManifest = {
  bin: 'psql',
  description: 'PostgreSQL interactive terminal (one-shot SQL mode).',
  strict: true,
  subcommands: {
    // SELECT vs UPDATE can't be distinguished from a query string alone,
    // so `query` defaults to mutating. Use `query_readonly` (wraps the
    // statement in a READ ONLY tx) for the explicit safe path.
    query: {
      description: 'Run a SQL statement (assumes write-capable)',
      mutating: true,
      argv: ['-X', '-A', '-t'],
      args: [
        { name: 'host', flag: '-h', type: 'string', required: false } as never,
        { name: 'port', flag: '-p', type: 'integer', required: false } as never,
        { name: 'database', flag: '-d', type: 'string', required: true } as never,
        { name: 'query', flag: '-c', type: 'string', required: true } as never,
      ],
      timeoutMs: 60_000,
    },
    query_readonly: {
      description: 'Run a SELECT-only SQL statement wrapped in READ ONLY tx',
      mutating: false,
      argv: ['-X', '-A', '-t', '--single-transaction', '-c', 'BEGIN READ ONLY;', '-c'],
      args: [
        { name: 'host', flag: '-h', type: 'string', required: false } as never,
        { name: 'port', flag: '-p', type: 'integer', required: false } as never,
        { name: 'database', flag: '-d', type: 'string', required: true } as never,
        { name: 'query', type: 'string', required: true } as never,
      ],
      timeoutMs: 60_000,
    },
  },
};

export const MYSQL_MANIFEST: CliManifest = {
  bin: 'mysql',
  description: 'MySQL interactive client (one-shot mode).',
  strict: true,
  subcommands: {
    query: {
      description: 'Run a SQL statement (assumes write-capable)',
      mutating: true,
      argv: ['--batch', '--raw'],
      args: [
        { name: 'host', flag: '-h', type: 'string', required: false } as never,
        { name: 'port', flag: '-P', type: 'integer', required: false } as never,
        { name: 'database', type: 'string', required: true } as never,
        { name: 'query', flag: '-e', type: 'string', required: true } as never,
      ],
      timeoutMs: 60_000,
    },
  },
};

export const REDIS_CLI_MANIFEST: CliManifest = {
  bin: 'redis-cli',
  description: 'Redis command-line interface.',
  strict: true,
  subcommands: {
    info: { description: 'Show server info', mutating: false, argv: ['info'], args: [], timeoutMs: 30_000 },
    keys: {
      description: 'List keys matching pattern',
      mutating: false,
      argv: ['keys'],
      args: [{ name: 'pattern', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    get: {
      description: 'Get a key value',
      mutating: false,
      argv: ['get'],
      args: [{ name: 'key', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    lrange: {
      description: 'Get a range of list elements',
      mutating: false,
      argv: ['lrange'],
      args: [
        { name: 'key', type: 'string', required: true } as never,
        { name: 'start', type: 'integer', required: true } as never,
        { name: 'stop', type: 'integer', required: true } as never,
      ],
      timeoutMs: 30_000,
    },
    set: {
      description: 'Set a key value',
      mutating: true,
      argv: ['set'],
      args: [
        { name: 'key', type: 'string', required: true } as never,
        { name: 'value', type: 'string', required: true } as never,
      ],
      timeoutMs: 30_000,
    },
    del: {
      description: 'Delete a key',
      mutating: true,
      argv: ['del'],
      args: [{ name: 'key', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    flushdb: {
      description: 'Remove all keys from current DB',
      mutating: true,
      argv: ['flushdb'],
      args: [],
      timeoutMs: 60_000,
    },
  },
};

export const SQLITE3_MANIFEST: CliManifest = {
  bin: 'sqlite3',
  description: 'SQLite command-line shell (one-shot mode).',
  strict: true,
  subcommands: {
    query: {
      description: 'Run a SQL statement (assumes write-capable)',
      mutating: true,
      argv: [],
      args: [
        { name: 'database', type: 'string', required: true } as never,
        { name: 'query', type: 'string', required: true } as never,
      ],
      timeoutMs: 60_000,
    },
    tables: {
      description: 'List tables in the database',
      mutating: false,
      argv: [],
      args: [
        { name: 'database', type: 'string', required: true } as never,
        { name: 'cmd', type: 'string', required: false, description: 'Defaults to .tables' } as never,
      ],
      timeoutMs: 30_000,
    },
  },
};

export const MONGO_MANIFEST: CliManifest = {
  bin: 'mongo',
  description: 'MongoDB shell (legacy mongo binary).',
  strict: true,
  subcommands: {
    eval: {
      description: 'Evaluate a JS expression (assumes write-capable)',
      mutating: true,
      argv: ['--quiet', '--eval'],
      args: [
        { name: 'script', type: 'string', required: true } as never,
        { name: 'uri', type: 'string', required: false } as never,
      ],
      timeoutMs: 60_000,
    },
    version: { description: 'Show client version', mutating: false, argv: ['--version'], args: [], timeoutMs: 10_000 },
  },
};

// ─── Media ───────────────────────────────────────────────────────────

export const FFMPEG_MANIFEST: CliManifest = {
  bin: 'ffmpeg',
  description: 'ffmpeg media transcoder.',
  strict: true,
  subcommands: {
    transcode: {
      description: 'Transcode an input to an output (free-form args)',
      mutating: true,
      argv: ['-y', '-i'],
      args: [
        { name: 'input', type: 'string', required: true } as never,
        { name: 'args', type: 'string', required: false, repeating: true, description: 'Additional ffmpeg flags' } as never,
        { name: 'output', type: 'string', required: true } as never,
      ],
      timeoutMs: 15 * 60_000,
    },
    probe: {
      description: 'Show stream info (uses ffmpeg, not ffprobe)',
      mutating: false,
      argv: ['-hide_banner', '-i'],
      args: [{ name: 'input', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
  },
};

export const MAGICK_MANIFEST: CliManifest = {
  bin: 'magick',
  description: 'ImageMagick (v7+) image converter.',
  strict: true,
  subcommands: {
    identify: {
      description: 'Identify image format/dimensions',
      mutating: false,
      argv: ['identify'],
      args: [{ name: 'input', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    convert: {
      description: 'Convert an image',
      mutating: true,
      argv: [],
      args: [
        { name: 'input', type: 'string', required: true } as never,
        { name: 'args', type: 'string', required: false, repeating: true } as never,
        { name: 'output', type: 'string', required: true } as never,
      ],
      timeoutMs: 5 * 60_000,
    },
  },
};

// ─── Data (jq/yq/xmllint) ────────────────────────────────────────────

export const JQ_MANIFEST: CliManifest = {
  bin: 'jq',
  description: 'JSON query / filter.',
  strict: true,
  subcommands: {
    query: {
      description: 'Apply a jq expression to a file (use "-" for stdin)',
      mutating: false,
      argv: [],
      args: [
        { name: 'expression', type: 'string', required: true } as never,
        { name: 'input', type: 'string', required: true } as never,
      ],
      timeoutMs: 30_000,
    },
  },
};

export const YQ_MANIFEST: CliManifest = {
  bin: 'yq',
  description: 'YAML query / filter.',
  strict: true,
  subcommands: {
    query: {
      description: 'Apply a yq expression to a file (use "-" for stdin)',
      mutating: false,
      argv: [],
      args: [
        { name: 'expression', type: 'string', required: true } as never,
        { name: 'input', type: 'string', required: true } as never,
      ],
      timeoutMs: 30_000,
    },
  },
};

export const XMLLINT_MANIFEST: CliManifest = {
  bin: 'xmllint',
  description: 'XML query / validator.',
  strict: true,
  subcommands: {
    query: {
      description: 'Apply an XPath expression to a file (use "-" for stdin)',
      mutating: false,
      argv: ['--xpath'],
      args: [
        { name: 'expression', type: 'string', required: true } as never,
        { name: 'input', type: 'string', required: true } as never,
      ],
      timeoutMs: 30_000,
    },
    format: {
      description: 'Pretty-print an XML file',
      mutating: false,
      argv: ['--format'],
      args: [{ name: 'input', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
  },
};

// ─── HTTP ────────────────────────────────────────────────────────────

export const CURL_MANIFEST: CliManifest = {
  bin: 'curl',
  description: 'curl HTTP client — GET/HEAD only by default.',
  // POST/PUT/DELETE are deliberately NOT bundled — too dangerous to
  // ship by default. Operators can pin a hand-written manifest if they
  // need write verbs.
  strict: true,
  subcommands: {
    get: {
      description: 'HTTP GET',
      mutating: false,
      argv: ['-fsSL', '--max-time', '30'],
      args: [{ name: 'url', type: 'string', required: true } as never],
      timeoutMs: 45_000,
    },
    head: {
      description: 'HTTP HEAD (response headers only)',
      mutating: false,
      argv: ['-fsSLI', '--max-time', '30'],
      args: [{ name: 'url', type: 'string', required: true } as never],
      timeoutMs: 45_000,
    },
  },
};

export const HTTPIE_MANIFEST: CliManifest = {
  bin: 'http',
  description: 'HTTPie HTTP client — GET/HEAD only by default.',
  strict: true,
  subcommands: {
    get: {
      description: 'HTTP GET',
      mutating: false,
      argv: ['GET'],
      args: [{ name: 'url', type: 'string', required: true } as never],
      timeoutMs: 45_000,
    },
    head: {
      description: 'HTTP HEAD',
      mutating: false,
      argv: ['HEAD'],
      args: [{ name: 'url', type: 'string', required: true } as never],
      timeoutMs: 45_000,
    },
  },
};

// ─── File search ─────────────────────────────────────────────────────

export const RG_MANIFEST: CliManifest = {
  bin: 'rg',
  description: 'ripgrep — recursive content search.',
  strict: true,
  subcommands: {
    search: {
      description: 'Search file contents for a pattern',
      mutating: false,
      argv: [],
      args: [
        { name: 'caseInsensitive', flag: '-i', type: 'boolean', required: false } as never,
        { name: 'glob', flag: '-g', type: 'string', required: false } as never,
        { name: 'type', flag: '-t', type: 'string', required: false } as never,
        { name: 'pattern', type: 'string', required: true } as never,
        { name: 'path', type: 'string', required: false } as never,
      ],
      timeoutMs: 60_000,
    },
  },
};

export const FD_MANIFEST: CliManifest = {
  bin: 'fd',
  description: 'fd — fast file finder.',
  strict: true,
  subcommands: {
    find: {
      description: 'Find files matching a pattern',
      mutating: false,
      argv: [],
      args: [
        { name: 'pattern', type: 'string', required: true } as never,
        { name: 'path', type: 'string', required: false } as never,
      ],
      timeoutMs: 60_000,
    },
  },
};

export const BAT_MANIFEST: CliManifest = {
  bin: 'bat',
  description: 'bat — syntax-highlighting file viewer.',
  strict: true,
  subcommands: {
    show: {
      description: 'Show a file with syntax highlighting (plain output)',
      mutating: false,
      argv: ['--style=plain', '--color=never'],
      args: [{ name: 'path', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
  },
};

export const EZA_MANIFEST: CliManifest = {
  bin: 'eza',
  description: 'eza — modern ls replacement.',
  strict: true,
  subcommands: {
    list: {
      description: 'List directory contents',
      mutating: false,
      argv: ['-la'],
      args: [{ name: 'path', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
    tree: {
      description: 'Show directory tree',
      mutating: false,
      argv: ['--tree', '--level=3'],
      args: [{ name: 'path', type: 'string', required: false } as never],
      timeoutMs: 30_000,
    },
  },
};

// ─── IaC ─────────────────────────────────────────────────────────────

export const TERRAFORM_MANIFEST: CliManifest = {
  bin: 'terraform',
  description: 'Terraform infrastructure as code.',
  strict: true,
  subcommands: {
    plan: { description: 'Show execution plan', mutating: false, argv: ['plan'], args: [], timeoutMs: 5 * 60_000 },
    show: { description: 'Show current state or a plan', mutating: false, argv: ['show'], args: [], timeoutMs: 60_000 },
    state_list: { description: 'List resources in state', mutating: false, argv: ['state', 'list'], args: [], timeoutMs: 60_000 },
    state_show: {
      description: 'Show a resource from state',
      mutating: false,
      argv: ['state', 'show'],
      args: [{ name: 'resource', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    output: { description: 'Show output values', mutating: false, argv: ['output'], args: [], timeoutMs: 30_000 },
    apply: {
      description: 'Apply the plan (destructive — confirms via -auto-approve)',
      mutating: true,
      argv: ['apply', '-auto-approve'],
      args: [],
      timeoutMs: 15 * 60_000,
    },
    destroy: {
      description: 'Destroy managed infrastructure',
      mutating: true,
      argv: ['destroy', '-auto-approve'],
      args: [],
      timeoutMs: 15 * 60_000,
    },
  },
};

export const ANSIBLE_MANIFEST: CliManifest = {
  bin: 'ansible',
  description: 'Ansible ad-hoc command runner.',
  strict: true,
  subcommands: {
    ping: {
      description: 'Ping hosts',
      mutating: false,
      argv: ['-m', 'ping'],
      args: [{ name: 'hosts', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    setup: {
      description: 'Gather host facts',
      mutating: false,
      argv: ['-m', 'setup'],
      args: [{ name: 'hosts', type: 'string', required: true } as never],
      timeoutMs: 2 * 60_000,
    },
    run_module: {
      description: 'Run an ad-hoc module (write-capable)',
      mutating: true,
      argv: [],
      args: [
        { name: 'hosts', type: 'string', required: true } as never,
        { name: 'module', flag: '-m', type: 'string', required: true } as never,
        { name: 'args', flag: '-a', type: 'string', required: false } as never,
      ],
      timeoutMs: 15 * 60_000,
    },
  },
};

export const PACKER_MANIFEST: CliManifest = {
  bin: 'packer',
  description: 'Packer image builder.',
  strict: true,
  subcommands: {
    version: { description: 'Show version', mutating: false, argv: ['version'], args: [], timeoutMs: 10_000 },
    validate: {
      description: 'Validate a template',
      mutating: false,
      argv: ['validate'],
      args: [{ name: 'template', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
    build: {
      description: 'Build images from a template',
      mutating: true,
      argv: ['build'],
      args: [{ name: 'template', type: 'string', required: true } as never],
      timeoutMs: 15 * 60_000,
    },
  },
};

export const VAGRANT_MANIFEST: CliManifest = {
  bin: 'vagrant',
  description: 'Vagrant VM lifecycle.',
  strict: true,
  subcommands: {
    status: { description: 'Show VM status', mutating: false, argv: ['status'], args: [], timeoutMs: 30_000 },
    global_status: { description: 'Show all VMs', mutating: false, argv: ['global-status'], args: [], timeoutMs: 30_000 },
    up: { description: 'Start the VM', mutating: true, argv: ['up'], args: [], timeoutMs: 15 * 60_000 },
    halt: { description: 'Stop the VM', mutating: true, argv: ['halt'], args: [], timeoutMs: 5 * 60_000 },
  },
};

// ─── Android (Termux + Shizuku) ──────────────────────────────────────

/**
 * Android Activity Manager — `am`. Available on every Android device
 * but restricted: a plain Termux shell can only launch its own
 * activities. The interesting use-cases (launching arbitrary apps,
 * force-stopping background apps) require the elevated `shell` uid via
 * Shizuku — operators using these via Shizuku call `shizuku_run`
 * directly. This manifest covers the non-elevated path.
 */
export const AM_MANIFEST: CliManifest = {
  bin: 'am',
  description: 'Android Activity Manager (am).',
  strict: true,
  subcommands: {
    start: {
      description: 'Start an activity by component name (package/.Activity)',
      mutating: true,
      argv: ['start', '-n'],
      args: [{ name: 'component', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    force_stop: {
      description: 'Force-stop a running package (destructive)',
      mutating: true,
      argv: ['force-stop'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
  },
};

/**
 * Android Package Manager — `pm`. Read-only operations only here
 * (package listing, path-of-apk, dump). Install/uninstall would need
 * the elevated `shell` uid and go through `shizuku_run` instead.
 */
export const PM_MANIFEST: CliManifest = {
  bin: 'pm',
  description: 'Android Package Manager (pm) — read-only ops.',
  strict: true,
  subcommands: {
    list_packages: {
      description: 'List installed packages',
      mutating: false,
      argv: ['list', 'packages'],
      args: [],
      timeoutMs: 30_000,
    },
    path: {
      description: 'Show the APK path for a package',
      mutating: false,
      argv: ['path'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    dump: {
      description: 'Dump package manager state for a package',
      mutating: false,
      argv: ['dump'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
  },
};

/**
 * Termux `pkg` — wraps Debian's `apt` under the hood. Read-only listing
 * + search are pair-gated, install / upgrade / uninstall are mutating.
 */
export const TERMUX_PKG_MANIFEST: CliManifest = {
  bin: 'pkg',
  description: 'Termux package manager (pkg / apt).',
  strict: true,
  subcommands: {
    list_installed: {
      description: 'List installed packages',
      mutating: false,
      argv: ['list-installed'],
      args: [],
      timeoutMs: 30_000,
    },
    search: {
      description: 'Search the package index',
      mutating: false,
      argv: ['search'],
      args: [{ name: 'query', type: 'string', required: true } as never],
      timeoutMs: 30_000,
    },
    install: {
      description: 'Install a package',
      mutating: true,
      // -y is critical here: pkg is interactive by default ("Y/n?") and
      // would hang the tool dispatch on the prompt.
      argv: ['install', '-y'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 5 * 60_000,
    },
    upgrade: {
      description: 'Upgrade all packages',
      mutating: true,
      argv: ['upgrade', '-y'],
      args: [],
      timeoutMs: 15 * 60_000,
    },
    uninstall: {
      description: 'Uninstall a package',
      mutating: true,
      argv: ['uninstall', '-y'],
      args: [{ name: 'package', type: 'string', required: true } as never],
      timeoutMs: 60_000,
    },
  },
};

/**
 * Termux:API battery — `termux-battery-status`. Single read-only call,
 * emits JSON. Lives alongside the desktop `battery` tool which already
 * routes through this binary on Android; the manifest gives the agent
 * a direct CLI surface too (one-line scripts can shell out to it
 * without going through `desktop.battery`).
 */
export const TERMUX_BATTERY_MANIFEST: CliManifest = {
  bin: 'termux-battery-status',
  description: 'Termux:API battery status — read-only.',
  strict: true,
  subcommands: {
    status: {
      description: 'Read battery percent, status, health, temperature, plugged',
      mutating: false,
      argv: [],
      args: [],
      timeoutMs: 10_000,
    },
  },
};

/**
 * Android service control — `svc`. Toggles WiFi/Bluetooth/data radios
 * and (destructively) reboots the device. The binary itself requires
 * root or the system uid; on a non-rooted device it MUST be invoked via
 * Shizuku's `rish` shell (i.e. through the `shizuku_run` tool, or by a
 * wrapping shell that's already been elevated). The wrapper does NOT
 * enforce that — see the description.
 */
export const SVC_MANIFEST: CliManifest = {
  bin: 'svc',
  description:
    'Android service control (svc) — toggles WiFi/Bluetooth/data, reboot. ' +
    'Must be invoked via Shizuku\'s `rish` shell — use the `shizuku_run` tool to invoke from ' +
    'agent code, or grant your invoking shell elevated permissions (root or shell-uid).',
  strict: true,
  subcommands: {
    wifi_enable: {
      description: 'Enable WiFi radio',
      mutating: true,
      argv: ['wifi', 'enable'],
      args: [],
      timeoutMs: 30_000,
    },
    wifi_disable: {
      description:
        'Disable WiFi radio — WARNING: severs ADB-over-WiFi sessions, including Shizuku\'s',
      mutating: true,
      argv: ['wifi', 'disable'],
      args: [],
      timeoutMs: 30_000,
    },
    bluetooth_enable: {
      description: 'Enable Bluetooth radio',
      mutating: true,
      argv: ['bluetooth', 'enable'],
      args: [],
      timeoutMs: 30_000,
    },
    bluetooth_disable: {
      description: 'Disable Bluetooth radio',
      mutating: true,
      argv: ['bluetooth', 'disable'],
      args: [],
      timeoutMs: 30_000,
    },
    data_enable: {
      description: 'Enable mobile data',
      mutating: true,
      argv: ['data', 'enable'],
      args: [],
      timeoutMs: 30_000,
    },
    data_disable: {
      description: 'Disable mobile data',
      mutating: true,
      argv: ['data', 'disable'],
      args: [],
      timeoutMs: 30_000,
    },
    power_reboot: {
      // DESTRUCTIVE — reboots the device immediately. Any unsaved state
      // in foreground apps is lost; long-running agent sessions die.
      // Kept in the manifest because operators need an automated way to
      // reboot a paired device that's gone wedged, but the description
      // calls out the cost so the agent and operator both see it before
      // calling.
      description: 'Reboot the device immediately (DESTRUCTIVE — kills all running processes)',
      mutating: true,
      argv: ['power', 'reboot'],
      args: [],
      timeoutMs: 60_000,
    },
  },
};

/**
 * Android input injection — `input`. Synthesises key events, taps,
 * swipes, and text input. Same elevation story as `svc`: needs root or
 * shell-uid in the general case, so must be invoked via Shizuku's `rish`
 * (use the `shizuku_run` tool from agent code).
 */
export const INPUT_MANIFEST: CliManifest = {
  bin: 'input',
  description:
    'Android input injection (input) — key events, taps, swipes, text input. ' +
    'Must be invoked via Shizuku\'s `rish` shell — use the `shizuku_run` tool to invoke from ' +
    'agent code, or grant your invoking shell elevated permissions (root or shell-uid).',
  strict: true,
  subcommands: {
    keyevent: {
      description:
        'Inject a key event — e.g. KEYCODE_HOME, KEYCODE_BACK, KEYCODE_POWER, KEYCODE_VOLUME_UP',
      mutating: true,
      argv: ['keyevent'],
      args: [{ name: 'key', type: 'string', required: true } as never],
      timeoutMs: 10_000,
    },
    tap: {
      description: 'Inject a tap at (x, y) screen pixel coords',
      mutating: true,
      argv: ['tap'],
      args: [
        { name: 'x', type: 'integer', required: true } as never,
        { name: 'y', type: 'integer', required: true } as never,
      ],
      timeoutMs: 10_000,
    },
    swipe: {
      description:
        'Inject a swipe from (x1, y1) to (x2, y2) over `duration` ms (positional order matters)',
      mutating: true,
      argv: ['swipe'],
      args: [
        { name: 'x1', type: 'integer', required: true } as never,
        { name: 'y1', type: 'integer', required: true } as never,
        { name: 'x2', type: 'integer', required: true } as never,
        { name: 'y2', type: 'integer', required: true } as never,
        { name: 'duration', type: 'integer', required: true, description: 'ms' } as never,
      ],
      timeoutMs: 10_000,
    },
    text: {
      // `input text` injects literal characters into the focused field.
      // Treat as mutating — it writes into whatever app holds focus.
      description: 'Type a literal string into the currently focused text field',
      mutating: true,
      argv: ['text'],
      args: [{ name: 'string', type: 'string', required: true } as never],
      timeoutMs: 10_000,
    },
  },
};

// ─── Registry ────────────────────────────────────────────────────────

/**
 * All bundled manifests in alphabetical order by bin name (excepting
 * the original four, which stay at the top for diff continuity).
 */
export const BUNDLED_MANIFESTS: CliManifest[] = [
  // Original four — kept up top for diff continuity.
  GIT_MANIFEST,
  DOCKER_MANIFEST,
  KUBECTL_MANIFEST,
  NPM_MANIFEST,
  // Remaining 40+ in alphabetical order.
  AM_MANIFEST,
  ANSIBLE_MANIFEST,
  AWS_MANIFEST,
  AZ_MANIFEST,
  BAT_MANIFEST,
  BUN_MANIFEST,
  CARGO_MANIFEST,
  CURL_MANIFEST,
  DOCTL_MANIFEST,
  EZA_MANIFEST,
  FD_MANIFEST,
  FFMPEG_MANIFEST,
  FLY_MANIFEST,
  GCLOUD_MANIFEST,
  GH_MANIFEST,
  GLAB_MANIFEST,
  HELM_MANIFEST,
  HEROKU_MANIFEST,
  HG_MANIFEST,
  HTTPIE_MANIFEST,
  // `input` (Android input injection) alphabetises between httpie and jq.
  INPUT_MANIFEST,
  JQ_MANIFEST,
  K9S_MANIFEST,
  KUSTOMIZE_MANIFEST,
  MAGICK_MANIFEST,
  MONGO_MANIFEST,
  MYSQL_MANIFEST,
  PACKER_MANIFEST,
  PIP_MANIFEST,
  // `pkg` is Termux's package manager (alphabetises between PIP and PNPM).
  TERMUX_PKG_MANIFEST,
  PM_MANIFEST,
  PNPM_MANIFEST,
  PODMAN_MANIFEST,
  POETRY_MANIFEST,
  PSQL_MANIFEST,
  REDIS_CLI_MANIFEST,
  RG_MANIFEST,
  SQLITE3_MANIFEST,
  SUPABASE_MANIFEST,
  // `svc` (Android service control) alphabetises between supabase and svn.
  SVC_MANIFEST,
  SVN_MANIFEST,
  TERRAFORM_MANIFEST,
  // `termux-battery-status` from Termux:API. Alphabetises between
  // terraform and uv (the leading `t` short-circuits before the
  // 'erm…' tail; `te-` < `u-`).
  TERMUX_BATTERY_MANIFEST,
  UV_MANIFEST,
  VAGRANT_MANIFEST,
  XMLLINT_MANIFEST,
  YARN_MANIFEST,
];
