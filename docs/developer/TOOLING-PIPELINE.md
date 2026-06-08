# Satsuma Tooling Pipeline: Parser to Diagnostics

This document summarizes how Satsuma tooling processes `.stm` files from parser setup through extraction, indexing, editor features, and semantic diagnostics.

## 1. Parser Initialization

Satsuma uses the shared parser singleton in `@satsuma/core` so CLI and LSP consumers do not duplicate WASM bootstrap logic.

- `initParser()` initializes the Tree-sitter parser and language once.
- Consumers parse source through the initialized parser instance.
- Consumers can pass a `locateFile` resolver when environment-specific WASM runtime resolution is required.

```ts
import { getParser, initParser } from "@satsuma/core";

await initParser(wasmPath, {
  locateFile: (name) => resolveTreeSitterRuntime(name),
});

const tree = getParser().parse(sourceText);
```

## 2. Core Extraction

After parsing, `@satsuma/core` performs deterministic CST extraction.

- Extractors produce typed records for schemas, mappings, arrows, metrics, fragments, imports, and metadata.
- Nested fields are handled recursively.
- Core remains pure computation (no filesystem, network, or process spawning).

```ts
import {
  extractArrows,
  extractFragments,
  extractImports,
  extractMappings,
  extractMetrics,
  extractSchemas,
} from "@satsuma/core";

const root = tree.rootNode;

const extracted = {
  schemas: extractSchemas(root),
  mappings: extractMappings(root),
  arrows: extractArrows(root),
  metrics: extractMetrics(root),
  fragments: extractFragments(root),
  imports: extractImports(root),
};
```

## 3. CLI Workspace Indexing

The CLI resolves entry-point imports, parses reachable files, and builds an `ExtractedWorkspace`.

- `workspace.ts` resolves import-reachable `.stm` files.
- `index-builder.ts` assembles multi-file extraction output.
- CLI commands query this index for graph, lineage, validation, and reporting operations.

```ts
import { loadWorkspace } from "./load-workspace";

const { files, index } = await loadWorkspace(pathArg);
// index: ExtractedWorkspace
// - schemas, mappings, arrows, metrics, fragments, nlRefData, warnings, notes
```

## 4. LSP and Editor Features

The LSP server uses parser and index services to power editor workflows.

- `server.ts` manages LSP lifecycle and request routing.
- `workspace-index.ts` in `satsuma-lsp` is an LSP-facing wrapper that delegates shared indexing operations to `@satsuma/viz-backend`; this powers definitions, references, and completion lookups.
- Feature handlers map core results into LSP protocol types.

```ts
import { createWorkspaceIndex, indexFile } from "@satsuma/viz-backend";

const workspaceIndex = createWorkspaceIndex();
indexFile(workspaceIndex, uri, tree);

// Feature modules consume indexed + extracted data:
// - hover
// - definition / references
// - completion
// - semantic tokens
// - formatting
```

## 5. Semantic Validation and Diagnostics

Satsuma diagnostics combine parse-level and semantic feedback.

- Parse diagnostics come from CST error and missing nodes.
- Semantic diagnostics come from `@satsuma/core` validation (`collectSemanticDiagnostics`) using a semantic index shape built from workspace extraction/index data.
- In editor workflows, diagnostics are merged so users receive actionable feedback while editing.

```ts
import { collectParseErrors, collectSemanticDiagnostics } from "@satsuma/core";

const parseDiagnostics = collectParseErrors(tree);
const semanticDiagnostics = collectSemanticDiagnostics(semanticIndex);

const diagnostics = [...parseDiagnostics, ...semanticDiagnostics];
```
