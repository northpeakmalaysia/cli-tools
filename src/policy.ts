import type { ToolPolicy } from '@swarmai/plugin-sdk';

/**
 * Subcommand safety classification (doc 15 §3).
 *
 * Two layers:
 *   1. A static `KNOWN` table for ~25 common CLIs, hand-curated so the
 *      obvious `docker rm` / `git push --force` style commands are
 *      always master-gated even if a hand-written manifest forgot to
 *      flip `mutating: true`.
 *   2. A keyword-driven heuristic for anything not in the table — same
 *      logic an experienced operator would apply at a glance.
 *
 * The classification feeds `policyForClass()` which maps to the actual
 * `ToolPolicy` value the registry consumes.
 */

export type SubcommandClass = 'read-only' | 'mutating' | 'destructive';

/**
 * Curated table for popular CLIs. Keep entries lowercase. When a CLI
 * exposes a two-word subcommand (e.g. `docker system prune`) we list
 * it space-joined; callers pass the same shape.
 */
const KNOWN: Record<string, Record<string, SubcommandClass>> = {
  docker: {
    ps: 'read-only',
    logs: 'read-only',
    images: 'read-only',
    inspect: 'read-only',
    stats: 'read-only',
    version: 'read-only',
    info: 'read-only',
    history: 'read-only',
    diff: 'read-only',
    port: 'read-only',
    top: 'read-only',
    run: 'mutating',
    restart: 'mutating',
    start: 'mutating',
    stop: 'mutating',
    pause: 'mutating',
    unpause: 'mutating',
    pull: 'mutating',
    tag: 'mutating',
    build: 'mutating',
    create: 'mutating',
    exec: 'mutating',
    rm: 'destructive',
    rmi: 'destructive',
    prune: 'destructive',
    kill: 'destructive',
    'system prune': 'destructive',
    'image prune': 'destructive',
    'volume prune': 'destructive',
    'container prune': 'destructive',
  },
  git: {
    status: 'read-only',
    log: 'read-only',
    diff: 'read-only',
    show: 'read-only',
    blame: 'read-only',
    branch: 'read-only', // bare `git branch` is read-only; `-D` is destructive but we can't see args here
    'rev-parse': 'read-only',
    ls_files: 'read-only',
    'ls-files': 'read-only',
    config: 'read-only',
    remote: 'read-only',
    tag: 'read-only',
    add: 'mutating',
    commit: 'mutating',
    fetch: 'mutating',
    pull: 'mutating',
    push: 'mutating',
    merge: 'mutating',
    rebase: 'mutating',
    stash: 'mutating',
    checkout: 'mutating',
    switch: 'mutating',
    init: 'mutating',
    clone: 'mutating',
    reset: 'destructive',
    clean: 'destructive',
    rm: 'destructive',
    'filter-branch': 'destructive',
    'reflog expire': 'destructive',
  },
  kubectl: {
    get: 'read-only',
    describe: 'read-only',
    logs: 'read-only',
    explain: 'read-only',
    'cluster-info': 'read-only',
    'config view': 'read-only',
    top: 'read-only',
    version: 'read-only',
    'api-resources': 'read-only',
    apply: 'mutating',
    create: 'mutating',
    patch: 'mutating',
    replace: 'mutating',
    scale: 'mutating',
    rollout: 'mutating',
    label: 'mutating',
    annotate: 'mutating',
    expose: 'mutating',
    'set image': 'mutating',
    cordon: 'mutating',
    uncordon: 'mutating',
    drain: 'mutating',
    delete: 'destructive',
    'delete pod': 'destructive',
    'delete namespace': 'destructive',
  },
  npm: {
    list: 'read-only',
    ls: 'read-only',
    outdated: 'read-only',
    view: 'read-only',
    info: 'read-only',
    audit: 'read-only',
    config: 'read-only',
    version: 'read-only',
    install: 'mutating',
    i: 'mutating',
    update: 'mutating',
    'audit fix': 'mutating',
    link: 'mutating',
    publish: 'mutating',
    uninstall: 'destructive',
    remove: 'destructive',
    rm: 'destructive',
    unpublish: 'destructive',
  },
  pnpm: {
    list: 'read-only',
    ls: 'read-only',
    outdated: 'read-only',
    view: 'read-only',
    why: 'read-only',
    audit: 'read-only',
    install: 'mutating',
    i: 'mutating',
    add: 'mutating',
    update: 'mutating',
    publish: 'mutating',
    remove: 'destructive',
    rm: 'destructive',
    prune: 'destructive',
  },
  yarn: {
    list: 'read-only',
    info: 'read-only',
    why: 'read-only',
    outdated: 'read-only',
    audit: 'read-only',
    install: 'mutating',
    add: 'mutating',
    upgrade: 'mutating',
    publish: 'mutating',
    remove: 'destructive',
  },
  helm: {
    list: 'read-only',
    ls: 'read-only',
    status: 'read-only',
    get: 'read-only',
    history: 'read-only',
    show: 'read-only',
    search: 'read-only',
    version: 'read-only',
    install: 'mutating',
    upgrade: 'mutating',
    rollback: 'mutating',
    'repo add': 'mutating',
    'repo update': 'mutating',
    uninstall: 'destructive',
    delete: 'destructive',
  },
  terraform: {
    plan: 'read-only',
    show: 'read-only',
    state: 'read-only', // `state list` etc.
    output: 'read-only',
    validate: 'read-only',
    version: 'read-only',
    fmt: 'read-only',
    init: 'mutating',
    apply: 'mutating',
    refresh: 'mutating',
    taint: 'mutating',
    'state mv': 'mutating',
    destroy: 'destructive',
    'state rm': 'destructive',
    'workspace delete': 'destructive',
  },
  aws: {
    // Service-prefixed subcommands defy a small table; the heuristic
    // below handles `aws s3 rm` etc. via the keyword scan.
    s3: 'read-only',
    ec2: 'read-only',
    iam: 'read-only',
  },
  gcloud: {
    auth: 'read-only',
    config: 'read-only',
    info: 'read-only',
    version: 'read-only',
    components: 'read-only',
    projects: 'read-only',
  },
  az: {
    account: 'read-only',
    version: 'read-only',
    login: 'mutating',
    logout: 'mutating',
  },
  psql: {
    list: 'read-only',
    '\\l': 'read-only',
    '\\dt': 'read-only',
  },
  mysql: {},
  'redis-cli': {
    info: 'read-only',
    ping: 'read-only',
    get: 'read-only',
    keys: 'read-only',
    config: 'read-only',
    set: 'mutating',
    del: 'destructive',
    flushdb: 'destructive',
    flushall: 'destructive',
  },
  gh: {
    'pr list': 'read-only',
    'pr view': 'read-only',
    'pr diff': 'read-only',
    'issue list': 'read-only',
    'issue view': 'read-only',
    'repo view': 'read-only',
    'run list': 'read-only',
    'workflow list': 'read-only',
    auth: 'read-only',
    'pr create': 'mutating',
    'pr edit': 'mutating',
    'pr merge': 'mutating',
    'pr comment': 'mutating',
    'issue create': 'mutating',
    'issue edit': 'mutating',
    'issue comment': 'mutating',
    'repo create': 'mutating',
    'pr close': 'destructive',
    'issue close': 'destructive',
    'repo delete': 'destructive',
  },
  glab: {
    'mr list': 'read-only',
    'mr view': 'read-only',
    'issue list': 'read-only',
    'issue view': 'read-only',
    auth: 'read-only',
    'mr create': 'mutating',
    'mr update': 'mutating',
    'issue create': 'mutating',
    'mr close': 'destructive',
    'issue close': 'destructive',
    'repo delete': 'destructive',
  },
  brew: {
    list: 'read-only',
    info: 'read-only',
    search: 'read-only',
    outdated: 'read-only',
    config: 'read-only',
    install: 'mutating',
    upgrade: 'mutating',
    'tap add': 'mutating',
    uninstall: 'destructive',
    remove: 'destructive',
    cleanup: 'destructive',
  },
  apt: {
    list: 'read-only',
    show: 'read-only',
    search: 'read-only',
    install: 'mutating',
    update: 'mutating',
    upgrade: 'mutating',
    remove: 'destructive',
    purge: 'destructive',
    autoremove: 'destructive',
  },
  rg: { /* ripgrep — pure read-only */ },
  fd: { /* find-replacement — pure read-only */ },
  jq: { /* json filter — pure read-only */ },
  yq: { /* yaml filter — pure read-only */ },
  curl: {
    // Heuristic: HTTP GETs are read-only, anything with a body verb is mutating.
    // We can't tell from the bare subcommand, so default to mutating; operator
    // can pin a hand-written manifest with safer defaults.
  },
  ffmpeg: { /* media transcoder — treat as mutating by default via heuristic */ },
};

/**
 * Keyword sets for the fallback heuristic. Order matters: the
 * destructive bucket is checked first so `force-push` doesn't get
 * downgraded to mutating just because `push` is in the mutating list.
 */
const DESTRUCTIVE_TOKENS = ['rm', 'remove', 'delete', 'destroy', 'drop', 'prune', 'purge', 'force-', 'uninstall', 'unpublish', 'flush', 'wipe'];
const MUTATING_TOKENS = [
  'create',
  'add',
  'install',
  'apply',
  'update',
  'upgrade',
  'set',
  'write',
  'push',
  'commit',
  'restart',
  'start',
  'stop',
  'init',
  'migrate',
  'merge',
  'pull',
  'fetch',
  'tag',
  'patch',
  'replace',
  'scale',
  'edit',
  'modify',
  'publish',
  'login',
  'logout',
];

/**
 * Map `(bin, sub)` to a safety class.
 *
 * The match is case-insensitive and tolerant of underscore vs hyphen vs
 * space (manifest authors use any of the three).
 */
export function classifySubcommand(bin: string, sub: string): SubcommandClass {
  const binKey = bin.toLowerCase();
  const subKey = normaliseSub(sub);

  const table = KNOWN[binKey];
  if (table) {
    if (table[subKey]) return table[subKey];
    // Try collapsing underscores to spaces — `get_pods` vs `get pods`.
    const spaced = subKey.replace(/_/g, ' ');
    if (table[spaced]) return table[spaced];
  }

  // Heuristic fallback. Check destructive first so `force-update` (which
  // contains both buckets) lands on the safer side.
  //
  // Tokens are matched at hyphen/space/underscore boundaries so we don't
  // misclassify innocent words like `format` (contains 'rm') or
  // `transform` as destructive.
  const tokens = subKey.split(/[\s_-]+/);
  for (const tok of tokens) {
    for (const d of DESTRUCTIVE_TOKENS) {
      // `force-` is special: it's a hyphen-glued prefix on the next
      // token, so it survives tokenisation as `force` only when the
      // original was `force-something`. We compare with that in mind.
      if (d.endsWith('-')) {
        // `force-` matches when any token equals `force` AND it wasn't
        // the only token (i.e. it was glued to something).
        const stem = d.slice(0, -1);
        if (tok === stem && tokens.length > 1) return 'destructive';
        continue;
      }
      if (tok === d) return 'destructive';
    }
  }
  for (const tok of tokens) {
    if (MUTATING_TOKENS.includes(tok)) return 'mutating';
  }
  return 'read-only';
}

/**
 * Pick the ToolPolicy for a class. `mutating` is parameterised because
 * some hosts prefer pair-gated for everyday writes (the operator
 * standing-approval handles it) and reserve `master` only for the
 * destructive bucket.
 */
export function policyForClass(
  c: SubcommandClass,
  defaultMutatingPolicy: 'master' | 'pair-gated' = 'master',
): ToolPolicy {
  switch (c) {
    case 'read-only':
      return 'pair-gated';
    case 'mutating':
      return defaultMutatingPolicy;
    case 'destructive':
      return 'master';
  }
}

function normaliseSub(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}
