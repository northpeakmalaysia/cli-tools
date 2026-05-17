/**
 * Local ambient types for `@swarmai/shared`.
 *
 * Re-exports the `zod` namespace as `z` — that's the only symbol
 * cli-tools imports from `@swarmai/shared`. At runtime the host's
 * `@swarmai/shared` package (declared as a peerDependency) supplies
 * the real export; these stubs only satisfy the standalone TypeScript
 * build.
 */

declare module '@swarmai/shared' {
  export { z } from 'zod';
}
