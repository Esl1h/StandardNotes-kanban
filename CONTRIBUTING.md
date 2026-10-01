# Contributing to StandardNotes Kanban

Thanks for helping out. This is a small, focused editor: a Kanban board for
Standard Notes that stores the board as portable Markdown inside the note.

## Development setup

```
git clone https://github.com/Esl1h/StandardNotes-kanban.git
cd StandardNotes-kanban
npm install
npm start
```

`npm start` runs the standalone editor at `http://localhost:3001` (no
Standard Notes context, saving disabled).

To test inside your Standard Notes app:

```
npm run build
npm run server
```

Then install `http://localhost:3000/ext.dev.json` via Preferences > Plugins
(dev extension, separate identifier).

## Before opening a PR

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`

All four must pass. CI runs the same steps.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/): one
logical change per commit, subject in the imperative mood, body explaining
the what and why when needed.

## Releases

Maintainers: bump the version in `package.json`, `public/ext.json` and
`public/ext.dev.json`, commit, then push a `vX.Y.Z` tag. The release
workflow builds, runs the tests, attaches `extension.zip` (the package the
desktop app installs) and publishes the hosted build to GitHub Pages.

## License

By contributing you agree that your contributions are licensed under
AGPL-3.0-or-later, like the rest of the project.
