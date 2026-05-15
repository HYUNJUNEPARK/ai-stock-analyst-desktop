# Codex Working Rules

## Purpose

This repository is an Electron desktop app that lets the user:

1. choose an AI model (`gpt` or `claude`)
2. install the matching CLI locally
3. authenticate with API key or CLI login
4. submit a one-shot prompt
5. read the streamed response

Codex should use this file as the default project rulebook when making changes.

## Source Of Truth

- `src/` is the implementation source of truth.
- `docs/` and `CLAUDE.md` describe the intended product and architecture and should be kept aligned when behavior changes.
- If docs and code disagree, prefer the current code for safe edits, and either update the docs or note the mismatch in the final response.

## Current Project Shape

```text
src/
├── main/                    # Electron main process: IPC, CLI install/run, file I/O
├── preload/                 # contextBridge bridge and window API typings
└── renderer/src/
    ├── assets/              # design tokens and shared CSS
    ├── components/          # reusable renderer UI pieces
    ├── context/             # AppContext global state
    ├── pages/               # route-level screens and state-specific subviews
    └── App.tsx              # route table
```

## Architecture Rules

- Preserve the Electron 3-layer boundary:
  - `renderer` for UI/state only
  - `preload` for the safe browser-facing bridge
  - `main` for Node/Electron APIs, `child_process`, `fs`, OS access
- Never use Node.js APIs directly in renderer code.
- When adding or changing IPC:
  - update `src/main/index.ts`
  - update `src/preload/index.ts`
  - update `src/preload/index.d.ts`
- Keep `contextIsolation: true` and `nodeIntegration: false`.
- Use `ipcMain.handle`/`ipcRenderer.invoke` for request-response flows.
- Use event channels only for streaming or push-style updates such as install logs and prompt output.

## Product Flow

Keep the main route flow consistent unless the task explicitly changes product behavior:

`/` → `/download` → `/auth` → `/prompt` → `/response`

If a page depends on prior state, guard direct access and redirect safely.

## UI And Styling Rules

- Follow the iOS-like design system already defined in:
  - `src/renderer/src/assets/base.css`
  - `src/renderer/src/assets/main.css`
  - `docs/design/design-prompts/00-design-system.md`
- Reuse CSS variables such as `--accent`, `--bg-primary`, `--text-*`, `--space-*`.
- Prefer shared classes/components over repeating large inline style objects.
- When touching existing inline-styled screens, avoid broad restyling unless the task requires it.
- Keep visuals restrained:
  - one primary accent color
  - light card surfaces
  - subtle shadows
  - short transitions
- Maintain desktop-first clarity within the current fixed-window app layout.

## Code Quality Rules

- Use TypeScript strictly and prefer explicit narrow types over `any`.
- Keep components focused:
  - page component for orchestration
  - child component for visual state blocks
  - utility/helper extraction when logic repeats
- Avoid oversized files by extracting:
  - repeated renderer UI into `components/`
  - route-specific subviews under that page folder
  - reusable domain logic into small helpers near the owning layer
- Prefer early returns and small functions over deeply nested conditionals.
- Remove dead code and stale comments when editing nearby code.
- Comments should explain non-obvious intent, not restate the code.

## State Management Rules

- Use the existing `AppContext` for small cross-route app state.
- Do not introduce a new state library unless the user asks or the current approach clearly fails.
- Keep ephemeral UI state local to the component that owns it.
- Avoid duplicating the same state in context and local component state.

## Security Rules

- Never log API keys, tokens, or full credential payloads.
- Validate user-provided values before passing them to CLI processes.
- Use `spawn` with explicit argument arrays, not shell-interpolated command strings.
- Keep file writes scoped to app-owned locations such as `app.getPath('userData')`.
- Treat stderr carefully: do not surface sensitive process output without need.

## CLI And Process Rules

- CLI installation should remain per-user and non-global in behavior.
- Prefer platform-aware executable resolution (`.cmd` on Windows).
- Stream long-running progress back to the renderer instead of blocking.
- Handle `close` and `error` events for every spawned process.
- Show actionable failure messages that include context such as exit code when useful.

## Testing And Verification

- After meaningful code changes, run the smallest relevant checks first.
- Preferred commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build` when packaging-sensitive code changed
- If you cannot run a needed check, say so explicitly.

## Naming And File Conventions

- Use PascalCase for React components and page/state components.
- Use clear, descriptive names for IPC channels and bridge methods.
- Keep route pages in `pages/` and route-specific split components in subfolders when complexity grows.
- Keep shared visual primitives in `components/`, not mixed into unrelated pages.

## Documentation Maintenance

- When changing architecture, flow, IPC, or design conventions, update the relevant docs in `docs/` or `CLAUDE.md`.
- The repository currently contains naming drift between `ai-stock-analytics` and `AI CLI Launcher`.
- Do not rename the product or repository casually; if a task touches branding, make the naming consistent across code and docs.

## Change Strategy For Codex

- Start by reading the directly affected layer and any adjacent bridge points.
- Make the smallest coherent change that fully solves the request.
- Preserve existing behavior unless the task requires a product change.
- If you find a structural issue while working, fix it only when:
  - it is in the edited path, and
  - it materially improves correctness, safety, or maintainability
- In final responses, mention any remaining doc drift, technical debt, or skipped verification.
