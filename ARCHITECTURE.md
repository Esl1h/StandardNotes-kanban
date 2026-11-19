# Architecture

StandardNotes Kanban is a static single-page React app that Standard Notes
loads in an iframe as a note editor. It keeps no server and no state of its
own: the board is the Markdown text of the note. Decisions behind the design
are in [docs/adr](docs/adr/README.md); the rules about security are in
[SECURITY.md](SECURITY.md).

## Components and data flow

```
Standard Notes app (host)
   | postMessage, through @standardnotes/component-relay
   v
src/lib/noteBridge.ts    NoteBridge: streams the note in, saves it out
   | note text                              ^ Markdown text
   v                                        |
src/components/Editor.tsx   Editor: holds the state, owns undo history
   |  parseMarkdown (src/lib/parseMarkdown.ts)      ^ convertStateToMarkdown
   v                                                | (src/lib/convertStateToMarkdown.ts)
src/components/EditorInternal.tsx   Board, Matrix, filter bar, card modal
```

- **noteBridge** (`src/lib/noteBridge.ts`): wraps `@standardnotes/component-relay`.
  It subscribes to the open note, hands its text to the editor and saves the
  editor's text back (coalesced, 350 ms). It also reads and writes per
  component preferences through the relay. It remembers which note the editor
  shows, so a metadata-only update of another note is never taken as the save
  target and one note's board is never written into another.
- **Echo guard** (`src/lib/echoGuard.ts`): the app streams a save back after a
  delay. The guard remembers the saves of the open note made in the last ten
  seconds (at most 500) and drops a stale echo of an earlier save, so it does
  not overwrite text typed afterwards. Any other text, such as a remote edit
  or another note, passes through.
- **Editor** (`src/components/Editor.tsx`): a class component that creates the
  `NoteBridge`, parses incoming text, keeps the undo history, and writes every
  board change back as Markdown. It shows a loading state until the note
  arrives and an error message after five seconds without it. Notes from the
  first release (raw JSON) are detected and converted.
- **Parser and converter** (`src/lib/parseMarkdown.ts`,
  `src/lib/convertStateToMarkdown.ts`): the parser is tolerant, the converter
  strict. A line the parser does not understand is not dropped: it is kept as
  an extra line under its lane or card, reported in a banner, and written back
  in place. The format is described in the README's
  [Note format](README.md#note-format). A property-based round-trip test
  (`src/lib/roundTrip.test.ts`) checks that parsing and converting text a
  second time changes nothing.
- **EditorInternal** (`src/components/EditorInternal.tsx`): renders the
  board or the Eisenhower matrix with search, filters, export and the card
  modal, and calls back into the editor for every change. Pure board
  operations live in `src/lib/boardOps.ts`.
- **ErrorBoundary** (`src/components/ErrorBoundary.tsx`): if rendering throws,
  it shows the raw note text in an editable textarea that still saves, so a
  crash never locks the note.

Per-device view settings (board or matrix, collapsed lanes) are kept in the
app's component data and in `localStorage` as a fallback
(`src/lib/viewPreference.ts`, `src/lib/collapsedPreference.ts`).

## Build and release pipeline

- `npm run build` runs Vite (`vite.config.ts`) and writes static files to
  `build/`, with a Content Security Policy meta tag added to the built pages
  ([ADR 0005](docs/adr/0005-content-security-policy.md)) and a
  `THIRD_PARTY_LICENSES.md`. `npm run check:build` fails on files nothing
  references.
- CI (`.github/workflows/ci.yml`) runs on every push and pull request to
  `main`: lockfile check, typecheck, lint, format check, unit tests, build,
  an advisory `npm audit`, and the Playwright end to end suite against a fake
  Standard Notes host (`e2e/snHost.js`).
- A pushed `v*` tag starts `.github/workflows/release.yml`. It requires a green
  CI run for the same commit, rebuilds, writes `extension.zip` and `SHA256SUMS`,
  attaches a build provenance attestation, creates an immutable GitHub release
  and publishes `build/` to the `gh-pages` branch, served by GitHub Pages. The
  app updates by comparing the version in `ext.json` at `latest_url`.

## Trust boundaries

1. **Host to plugin.** The app embeds the plugin in an iframe and talks to it
   through `postMessage`, relayed by `@standardnotes/component-relay`. The
   plugin trusts the host to deliver the note and applies no authority beyond
   reading and saving the one note it is shown plus its own preferences.
2. **Note content.** The text of the note is untrusted input: it can be written
   by another editor, another device or by hand. It is parsed by anchored
   patterns, never evaluated, and rendered through React, which escapes text.
   The code does not use `innerHTML`, `dangerouslySetInnerHTML`, `eval`
   or `new Function`.
3. **Static hosting.** The code is served as static files from GitHub Pages
   (or a self-hosted copy), and the CSP limits scripts and connections to the
   plugin's own origin. The plugin makes no network request of its own.

## Key properties

- No backend, accounts or telemetry; the board is only in the note, so it is
  encrypted by Standard Notes with the rest of the account.
- Lossless: unknown lines survive a load and save cycle.
- Bounded memory in the echo guard and the saved view preferences.
- Verifiable releases: immutable, with checksums and a provenance attestation
  ([Verifying a release](README.md#verifying-a-release)).
