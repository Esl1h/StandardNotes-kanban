# Security Policy

## Supported versions

Only the [latest release](https://github.com/Esl1h/StandardNotes-kanban/releases/latest)
receives security fixes.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting (Security tab > Report a
vulnerability) instead of opening a public issue. Please include the
affected version and, if possible, a note whose markdown triggers the
problem.

## Responding to reports

- Reports are acknowledged within 7 days
- A fix, or an explanation of why none is needed, follows within 60 days
- Fixes ship as a normal release from `main`, following [Releases](README.md#releases) in the README; the fix is in the changelog and the release notes, which are written from the commit subjects
- Reporters are credited in the release notes unless they ask for anonymity
- Only the latest release is supported, so the fix lands there and users upgrade to it ([GOVERNANCE.md](GOVERNANCE.md))
- No vulnerability report has been received or resolved in the last 12 months; `CHANGELOG.md` lists no security fix. This is the maintainer's own record, so it is not independently checkable

## Security requirements

What users can expect:

- The editor makes no network requests of its own and has no telemetry. After its files load, nothing leaves the app
- Note content is treated as untrusted input: it is parsed, never executed, and shown as escaped text
- The board lives only in the note, so Standard Notes encrypts it with the rest of the account. The plugin stores no passwords, tokens or keys. Its only other storage is per-note view settings (board or matrix, collapsed lanes), kept in the app's component data and in the browser's `localStorage` as a fallback
- Releases can be checked against their checksum and build provenance (README, [Verifying a release](README.md#verifying-a-release))

What users cannot expect:

- Protection against a compromised Standard Notes app, device or account. The plugin trusts the host that embeds it
- Confidentiality of the board from anyone who can read the note, such as the account owner's other devices
- Fixes for older versions, or for vulnerabilities in Standard Notes itself or in the browser

Out of scope for reports: the points above, findings that need an already compromised host, and denial of service by a note the user wrote with enough text to be slow.

## Dependency monitoring

- Dependabot checks npm weekly and GitHub Actions monthly (`.github/dependabot.yml`) and opens pull requests for updates and advisories
- CI runs `npm audit --audit-level=critical` on every push and pull request (`.github/workflows/ci.yml`). It is advisory: it shows findings in the log without failing the build, and Dependabot raises the fix
- On a finding, the maintainer merges the Dependabot pull request once CI is green, or records why the advisory cannot be exploited here. The OpenSSF Scorecard also flags known vulnerabilities and runs weekly
- `scripts/check-lockfile.mjs` fails CI when `package-lock.json` has a git dependency other than the two pinned commits of [ADR 0002](docs/adr/0002-pin-standard-notes-git-dependencies.md)

## Supply chain

- Every change reaches `main` through a pull request with signed commits and passing CI; force pushes and deletions are blocked, and release tags cannot be moved or deleted
- Workflow actions are pinned to commit hashes and run with read-only tokens unless a job needs more
- Releases are immutable and carry `SHA256SUMS` and a build provenance attestation; the README explains how to verify them
- The [OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/Esl1h/StandardNotes-kanban) checks these practices weekly. Its Code-Review and Branch-Protection checks stay low by design: this is a single-maintainer project, so pull requests are not reviewed by a second person

## Scope

- The editor runs entirely client side and does not send data anywhere;
  the board lives inside your Standard Notes note, encrypted with the rest
  of your account
- The hosted build is static content served from GitHub Pages
- Vulnerabilities in Standard Notes itself belong to
  [Standard Notes security](https://standardnotes.com/help/2/has-standard-notes-completed-a-third-party-security-audit)

## Assurance case

This section argues that the security requirements above are met. It points
to the code, tests and configuration that back each claim. It describes what
exists; it does not promise more.

### Threat model

Assets:

- the content of the user's notes, in particular the board text
- the integrity of that text: a bug must not erase or overwrite a note
- the user's Standard Notes session, which the plugin must not be able to
  abuse
- the integrity of the plugin's code as served and installed

Attackers:

- someone who can put text in a note: another editor or device, a shared or
  imported note, or a hand-crafted note meant to trigger a bug
- someone who tampers with the hosted files, the release or a dependency
- a malicious or buggy dependency

Entry points:

- the note text streamed from the host (`src/lib/noteBridge.ts`), the main
  untrusted input
- legacy JSON in a note (`parseText` in `src/components/Editor.tsx`)
- text the user types into the board, which is written back to the note
- the build, the release workflow and the hosted static files

### Trust boundaries

The three boundaries are described in [ARCHITECTURE.md](ARCHITECTURE.md): host
to plugin over `postMessage`, note content as untrusted input, and static
hosting. Data crosses from the host into the plugin at `NoteBridge`, and from
the note text into the board state at `parseMarkdown`; code crosses from the
network into the page only through files from the plugin's own origin.

### Secure design principles

- Least privilege: the plugin sees only the note it is shown and its own
  preferences through the relay, and runs in the host's iframe. The CSP
  allows scripts and connections only from its own origin (`vite.config.ts`,
  [ADR 0005](docs/adr/0005-content-security-policy.md)). CI workflows
  default to `permissions: {}` or read-only, and a job gets more only when it
  must (`.github/workflows/*.yml`).
- Fail-safe defaults: `object-src 'none'`, `base-uri 'none'` and
  `form-action 'none'` in the CSP. An unreadable line is kept and reported,
  not guessed at (`src/lib/parseMarkdown.ts`). If rendering throws, the
  `ErrorBoundary` shows the raw text so nothing is lost. A bad legacy JSON
  shape falls back to the Markdown parser (`isLegacyLanes` in
  `src/components/Editor.tsx`, tested in `src/components/Editor.test.tsx`).
- Complete mediation: all traffic with the host goes through `NoteBridge`,
  which checks that an update belongs to the note being shown before it is a
  save target (tested in `src/lib/noteBridge.test.ts`). `main` takes changes
  only through pull requests that pass CI, with no bypass
  ([ADR 0006](docs/adr/0006-merge-commits-signed-history-verifiable-releases.md)).
- Economy of mechanism: no backend, no accounts, no network code, and a short
  list of runtime dependencies (`package.json`).
- Open design: the code is AGPL-3.0-or-later and public, the decisions are in
  `docs/adr/`, and nothing depends on secret design.
- Psychological acceptability: security does not change how the board is used.
  There are no prompts, and a note stays readable Markdown.
- Separation of privilege: partly applied. The release workflow needs a green
  CI run on the same commit before it publishes (`release.yml`), and signing
  is done by the workflow's identity, not by a person's key. A second person
  reviewing changes is not part of the design: there is one maintainer.
- Pinned and immutable: workflow actions are pinned to commit hashes, the two
  git dependencies to commit hashes checked by `scripts/check-lockfile.mjs`,
  and releases are immutable with `SHA256SUMS` and a provenance attestation
  (`.github/workflows/release.yml`).

### Common weaknesses

- Cross-site scripting through note content: the code renders note text with
  React, which escapes it, and does not use `innerHTML`, `dangerouslySetInnerHTML`,
  `eval` or `new Function` (a search of `src/` finds none). Even if a script
  got into the page, the CSP blocks inline and remote scripts, and an e2e test
  fails on any violation (`e2e/csp.spec.js`). CSV export writes cells that
  start with `=`, `+`, `-` or `@` as text (`src/lib/exportBoard.ts`, tested in
  `src/lib/exportBoard.test.ts`).
- Prototype pollution: label colors and names are looked up with
  `Object.hasOwn`, and a color must be a palette name (`paletteColor` in
  `src/lib/labels.ts`, `parseLabelColors` in `src/lib/labelColors.ts`). Tests
  use `constructor`, `toString` and `__proto__` as names and values
  (`src/lib/labels.test.ts`, `src/lib/labelColors.test.ts`). The note text is
  not passed to `Object.assign` or merged into existing objects.
- Unbounded work and regular expressions: the parser makes one pass over the
  lines and matches each against a fixed, anchored pattern with no nested
  quantifiers (`src/lib/parseMarkdown.ts`, `src/lib/ids.ts`). Remembered state
  is capped: the echo guard keeps at most 500 saves for ten seconds
  (`src/lib/echoGuard.ts`), the view and collapsed-lane settings 200 notes
  (`src/lib/viewPreference.ts`, `src/lib/collapsedPreference.ts`). Limits: no
  test measures parser time on very large notes, and a few patterns with a
  leading `\s*` can take quadratic time on a line made of thousands of spaces;
  the input is the user's own note, so the effect is a slow board, not a
  breach. A property-based test feeds random text through parse and convert
  (`src/lib/roundTrip.test.ts`).
- Supply chain: dependencies come from the lockfile with `npm ci`; Dependabot
  and `npm audit` watch them (see above); the git dependencies are pinned and
  checked before install, and `release.yml` installs with `--ignore-scripts`;
  actions are pinned to hashes; CodeQL code scanning (GitHub's default setup,
  linked from the README badge) and the Scorecard
  (`.github/workflows/scorecard.yml`) run on the repository. Residual risk: a single
  maintainer account, and trust in the Standard Notes git dependencies.
