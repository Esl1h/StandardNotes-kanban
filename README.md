# Kanban Editor for Standard Notes

[![CI](https://github.com/Esl1h/sn-kanban/actions/workflows/ci.yml/badge.svg)](https://github.com/Esl1h/sn-kanban/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Esl1h/sn-kanban)](https://github.com/Esl1h/sn-kanban/releases/latest)
[![License](https://img.shields.io/github/license/Esl1h/sn-kanban)](LICENSE)

A Kanban board editor for [Standard Notes](https://standardnotes.org), a
free, open-source, end-to-end encrypted notes app. Your board is stored as
plain Markdown inside the note, so it stays readable, exportable and
portable.

![Kanban Editor screenshot](public/demo.png)

This is a maintained fork of
[corvec/sn-kanban-editor](https://github.com/corvec/sn-kanban-editor), which
is no longer actively developed. This fork fixes data-preservation bugs,
removes unused dependencies, and keeps the extension installable from its
own hosted endpoint.

## Features

1. Manage lanes and cards with titles, descriptions, labels and comments
2. Drag and drop cards between lanes (and reorder them inside a lane)
3. Edit card descriptions and comments in a card modal
4. Your board lives in the note as Markdown; read or tweak it with any
   other editor without breaking the board
5. Works with the Standard Notes web and desktop apps

## Installation

1. Run the Standard Notes web or desktop app.
2. Click the **Preferences** (gear) icon.
3. Select **Plugins** in the Preferences menu.
4. Scroll to the bottom and paste this URL into the
   **Install Custom Plugin** box:

   ```
   https://esli.cafe/sn-kanban/ext.json
   ```

5. Confirm the installation.
6. Create a new note, open the **Editor** menu and pick **Kanban Editor**.
7. Add a lane, add some cards, and have fun!

Note: this editor has a different extension identifier than the original,
so it can be installed alongside (or instead of) the upstream version.

## Note format

The board is saved in the note body as Markdown. One `#` heading per lane,
one `*` bullet per card, indented `*` bullets for card fields:

```
# To Do
* Write the report
  * Description: Q4 numbers, then review with the team
  * Label: work
  * Comments:
    * First draft looks good
* Call the bank
  * Label: errands

# Done
* Pay rent
```

Notes saved by the very first release of this editor (raw JSON) are
detected and converted to Markdown automatically the first time they are
edited. Lines the parser cannot understand are kept as-is in the note and
reported in a banner at the top of the board.

## Privacy

Everything is stored inside your Standard Notes note, so it is encrypted
with the rest of your data. The editor itself does not send anything
anywhere.

## Development and running locally

**Prerequisites:**

1. (Optional) Fork this repo on GitHub.
2. [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
   this repo or your fork.
3. Run `cd sn-kanban` and then `npm install` to install all dependencies.

### Testing in the browser (standalone)

1. Run:

```
npm start
```

2. Your browser may open automatically. If not, open
   `http://localhost:3001/`. The standalone editor runs without a Standard
   Notes context, so saving is disabled but the UI is fully usable.
3. When you're done, press `Ctrl/Cmd + C` in the console to stop the app.

### Testing inside your local Standard Notes app

1. Run `npm run build` to build the app, then:

```
npm run server
```

2. In Standard Notes, follow the Installation steps above but paste:

```
http://localhost:3000/ext.dev.json
```

The dev extension uses a separate identifier (`Kanban Editor (Dev)`) so it
does not clash with the hosted one.

3. When you're done, press `Ctrl + C` to shut down the server.

If you run into issues, please refer to the
[Standard Notes instructions for local plugin setup](https://standardnotes.com/help/plugins/local-setup).

### Deployment

The extension is hosted on GitHub Pages from the `gh-pages` branch, served
at `https://esli.cafe/sn-kanban/`. Releases are automated by the
`Release` workflow:

1. Bump the version in `package.json`, `public/ext.json` and
   `public/ext.dev.json` (the `download_url` points at the release
   asset).
2. Commit, then push a tag:

```
git tag v0.7.0 && git push origin v0.7.0
```

The workflow builds, runs the checks, attaches `extension.zip` to the
GitHub release (that zip is what the desktop app installs) and
publishes the hosted build to Pages.

## Project status and roadmap

This fork focuses on correctness and maintainability first:

- Fixed: legacy JSON notes no longer lose their data on first edit
- Fixed: one malformed line no longer breaks parsing of the whole board
- Fixed: card modal app element wiring; descriptions are editable in the
  modal
- Removed: unused dependencies; the board polish continues
- Planned: replace the abandoned `react-trello` dependency with a
  maintained drag-and-drop implementation, migrate off Create React App,
  and follow the app theme via the current `sn-stylekit`

## Credits and license

- Original editor by [corvec](https://github.com/corvec), forked from
  [StandardNotes/editor-template-cra-typescript](https://github.com/standardnotes/editor-template-cra-typescript)
- Board UI based on
  [react-trello](https://github.com/rcdexta/react-trello)
- Licensed under [AGPL-3.0](LICENSE) or later
