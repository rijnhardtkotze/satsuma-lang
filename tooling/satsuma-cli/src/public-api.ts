/**
 * public-api.ts — Public programmatic entry point for satsuma-cli
 *
 * Exports the stable surface that toolchain authors can use to drive
 * workspace loading without shelling out to the `satsuma` binary. All
 * names here are covered by a contract test (public-api.test.ts) and
 * represent the API shape documented in SATSUMA-CLI.md §"Programmatic Usage".
 *
 * Entry point (after adding satsuma-cli as a dependency):
 *
 *   import { loadWorkspace } from "satsuma-cli/workspace"
 *
 * The package is private (not published to npm). Consumers in the same
 * monorepo add it as a file dependency:
 *
 *   "satsuma-cli": "file:../satsuma-cli"
 *
 * External consumers can clone the repo and use npm link or a local
 * file reference. See SATSUMA-CLI.md for the full usage guide.
 *
 * Error handling: loadWorkspace throws {@link CommandError} on resolution
 * or read failures. Re-export the error class and exit constants here so
 * callers can identify and discriminate failures without a deep import.
 */

export { loadWorkspace } from "./load-workspace.js";
export type { LoadedWorkspace, LoadWorkspaceOptions } from "./load-workspace.js";
export { CommandError, EXIT_OK, EXIT_NOT_FOUND, EXIT_PARSE_ERROR } from "./command-runner.js";
