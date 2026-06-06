---
id: sl-lwex
status: done
deps: []
links: []
created: 2026-06-06T00:00:00Z
type: feature
priority: 3
assignee: rijnhardtkotze
tags: [cli, satsuma-cli, public-api, docs]
---
# Expose loadWorkspace as a supported public programmatic API

`SATSUMA-CLI.md` documents a "Programmatic Usage (Node.js)" path for toolchain
authors that want to consume the CLI's extraction logic (`loadWorkspace`)
without shelling out to the `satsuma` binary. Today that surface is internal:

- `tooling/satsuma-cli/package.json` is `private: true` with no `main`,
  `module`, `types`, or `exports` field — it declares only the `satsuma` bin.
- `loadWorkspace` is exported from `src/load-workspace.ts` but is not
  re-exported from any package entry point (`src/index.ts` is the CLI
  dispatcher).

The docs were corrected (PR #1, commit bdab486) to describe the real, internal
path honestly (build-from-source + `npm link` + deep import of the built
module). This ticket tracks turning that into a *supported* public API so the
deep-import caveat can be removed.

This is a CLI (consumer) package concern, but per the CLAUDE.md "Core vs
Consumer" guidance, assess whether the stable programmatic surface should live
in `satsuma-core` instead — the LSP and viz backend already depend on core, and
a shared loader may belong there rather than in the CLI package.

## Acceptance Criteria

- Decide and document where the public loader lives (satsuma-cli vs
  satsuma-core) and record the rationale.
- Add an `exports` map (and `types`) exposing `loadWorkspace`,
  `LoadedWorkspace`, and `LoadWorkspaceOptions` from a stable entry point.
- Resolve the `private: true` question: either publish the package or document
  the intended consumption model for an unpublished package.
- Update `SATSUMA-CLI.md` to import from the public entry point and drop the
  internal-surface caveat once the API is stable.
- Add a test that imports the public entry point and asserts the
  `{ files, index }` shape (schemas as a `Map`) to lock the contract.

## Notes

**2026-06-06T00:00:00Z**

Cause: `loadWorkspace` was exported from `src/load-workspace.ts` but the
package had no `exports` field, so external consumers could only reach it
via a deep import of the compiled artifact — a fragile, unsupported path.

Fix: Added `src/public-api.ts` as a thin re-export barrel for
`loadWorkspace`, `LoadedWorkspace`, `LoadWorkspaceOptions`, `CommandError`,
and the exit-code constants. Registered it as the `satsuma-cli/workspace`
entry point in the `exports` map. Documented the consumption model
(file-dependency, not npm) in `SATSUMA-CLI.md §"Programmatic Usage"`. Added
`test/public-api.test.ts` as a contract test locking the `{ files, index }`
shape. Decision to keep the loader in `satsuma-cli` (not `satsuma-core`)
recorded: `loadWorkspace` throws `CommandError`, a CLI-specific concept not
appropriate for the shared core library.
