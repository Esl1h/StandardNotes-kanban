# Governance

StandardNotes Kanban is a small project with a single maintainer. This file
says how decisions are made, who does what, and what the project can and
cannot promise.

## Decision making

The maintainer, [Esl1h](https://github.com/Esl1h), makes all final decisions
on scope, design, releases and security. Larger decisions are written down as
[architecture decision records](docs/adr/README.md), which are never rewritten
once accepted; a later record supersedes an earlier one.

Disputes, for example over a rejected pull request, are settled in the open on
the issue or pull request: the contributor states the case, the maintainer
decides and gives the reason. Conduct problems follow the
[Code of Conduct](CODE_OF_CONDUCT.md). The project is AGPL-3.0-or-later, so
anyone who disagrees with the direction can fork it.

## How contributions are accepted

1. Open an issue or a pull request, following [CONTRIBUTING.md](CONTRIBUTING.md).
2. CI must pass: typecheck, lint, format check, unit tests, build and the
   end to end suite.
3. The maintainer reviews the change and merges it with a merge commit. `main`
   accepts only pull requests with signed commits and passing CI, including
   the maintainer's own ([ADR 0006](docs/adr/0006-merge-commits-signed-history-verifiable-releases.md)).

There is no second reviewer. The OpenSSF Scorecard Code-Review check stays low
for that reason, as [SECURITY.md](SECURITY.md) explains.

## Roles and responsibilities

Maintainer (Esl1h, the only person in this role):

- triages issues and decides which pull requests are merged
- keeps CI, dependencies and the GitHub settings in order
- answers vulnerability reports, as set out in [SECURITY.md](SECURITY.md)
- cuts releases, following [Releases](README.md#releases) in the README
- enforces the Code of Conduct

Contributor (anyone who opens an issue or a pull request):

- follows [CONTRIBUTING.md](CONTRIBUTING.md) and the Code of Conduct
- adds tests with the change, as the test policy there requires
- licenses the contribution under AGPL-3.0-or-later

Security reporter (anyone who reports a vulnerability):

- reports privately through GitHub's private vulnerability reporting, not in a
  public issue
- gives the affected version and, if possible, a note that triggers the problem
- allows time for a fix before disclosing, and is credited in the release
  notes unless they ask for anonymity

The roles are held by the people named here: the maintainer is listed in
[`.github/CODEOWNERS`](.github/CODEOWNERS), and everyone else is a contributor
or reporter when they act as one.

## Releases and support

Releases are cut by the maintainer by pushing a version tag; the `Release`
workflow builds, tests and publishes them (see
[Releases](README.md#releases) and [ARCHITECTURE.md](ARCHITECTURE.md)). Each
release is immutable and verifiable ([Verifying a
release](README.md#verifying-a-release)).

Only the [latest release](https://github.com/Esl1h/StandardNotes-kanban/releases/latest)
is supported and receives fixes; older versions are not maintained. The
upgrade path is to install the new version: the app finds updates from the
`latest_url` in `ext.json`, and a manual install of the new URL or
`extension.zip` replaces the old one. Notes are plain Markdown text and keep
working across versions; the README's [Note format](README.md#note-format)
section lists format details, including how notes from the first JSON-based
release are converted.

## Continuity

Honest status: the project does not yet meet the OpenSSF criterion
`access_continuity`. Only the maintainer has write access to the repository,
the release workflow settings, the signing identity (the repository's GitHub
Actions identity) and the `esli.cafe` domain that serves the hosted build. If
the maintainer became unable to continue, nobody else could create or close
issues, merge changes or publish a release within a week. The bus factor is 1.

What softens this today, without solving it: the code is AGPL-3.0-or-later and
can be forked; releases are built by a workflow from a tag, so a successor
with access could publish them; and the extension is self-hostable (README,
[Self-hosting](README.md#self-hosting)). No second person has been named yet;
this file will change when one is.
