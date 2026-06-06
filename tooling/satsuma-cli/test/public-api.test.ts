/**
 * public-api.test.ts — Contract test for the satsuma-cli/workspace entry point
 *
 * Locks the shape of the stable programmatic surface so regressions are
 * caught before they reach consumers. The assertions here are the minimum
 * claims SATSUMA-CLI.md §"Programmatic Usage" makes:
 *
 *   • `loadWorkspace(path)` resolves to `{ files, index }` where
 *     `index.schemas` is a `Map` and `files` is an array of parsed files.
 *   • Resolution failures throw `CommandError` with the `EXIT_PARSE_ERROR`
 *     code, allowing callers to distinguish "bad input" from crashes.
 *
 * Both the runtime contract (values) and the error type (catch-ability)
 * are tested here because consumers need both to be stable.
 */

import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Import via the public-api module — this is what `satsuma-cli/workspace`
// resolves to after the exports map in package.json is applied.
import { loadWorkspace, CommandError, EXIT_PARSE_ERROR } from "#src/public-api.js";
import { initParser } from "#src/parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES = resolve(__dirname, "../../../examples");
const WASM_PATH = resolve(__dirname, "../dist/tree-sitter-satsuma.wasm");

before(async () => {
  // The WASM parser must be initialised before any loadWorkspace call.
  await initParser(WASM_PATH);
});

describe("satsuma-cli/workspace public API contract", () => {
  it("loadWorkspace returns { files, index } with index.schemas as a Map", async () => {
    // The canonical contract: callers receive files (raw CST access) and
    // index (extracted workspace). index.schemas being a Map is the
    // primary invariant every consumer tool depends on.
    const entry = resolve(EXAMPLES, "lib/common.stm");
    const result = await loadWorkspace(entry);

    assert.ok("files" in result, "result must have a files property");
    assert.ok("index" in result, "result must have an index property");
    assert.ok(Array.isArray(result.files), "files must be an array");
    assert.ok(result.index.schemas instanceof Map, "index.schemas must be a Map");
    assert.ok(result.files.length >= 1, "at least the entry file must be parsed");
    assert.ok(result.index.schemas.size > 0, "common.stm defines schemas — index must be populated");
  });

  it("CommandError is thrown for an unresolvable path and carries EXIT_PARSE_ERROR", async () => {
    // Callers must be able to catch CommandError (re-exported here) and
    // check err.code against EXIT_PARSE_ERROR to discriminate resolution
    // failures from parse-error failures and other errors.
    const bogus = "/does/not/exist.stm";
    await assert.rejects(
      () => loadWorkspace(bogus),
      (err: unknown) =>
        err instanceof CommandError &&
        err.code === EXIT_PARSE_ERROR &&
        err.message.includes(bogus),
    );
  });
});
