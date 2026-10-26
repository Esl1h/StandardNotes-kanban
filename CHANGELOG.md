# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.11.0] - 2026-10-26

### Added

- Set a Content Security Policy on the page

### Fixed

- Pin ext.json download_url to its release
- **sync:** Bound the echo guard by time, not count
- **sync:** Detect a note switch from its text

### Documentation

- Adopt the Contributor Covenant
- Record the shared decisions as ADRs
- Align the README with the other plugins

## [1.10.0] - 2026-10-25

### Added

- Fold the label filters into a tag button
- Allow several done lanes
- Move lane actions into a kebab menu

### Fixed

- Open the card when its title is tapped
- Show the done lane menu above its cards

## [1.9.1] - 2026-10-16

### Fixed

- **export:** Neutralize formulas after separators
- **editor:** Reject malformed legacy JSON boards
- **labels:** Ignore names inherited by objects

## [1.9.0] - 2026-10-16

### Added

- **ui:** Show Export as a download icon
- **ui:** Fold the due filters into a calendar

## [1.8.1] - 2026-10-13

### Fixed

- **board:** Strike the finished card title again

## [1.8.0] - 2026-10-13

### Added

- **ui:** Tighten the card modal
- **board:** Rename inline, add cards in series

## [1.7.0] - 2026-10-13

### Added

- **labels:** Pick a color per label

## [1.6.1] - 2026-10-13

### Fixed

- **card:** Allow renaming a card
- **board:** Gray out and strike done cards

## [1.6.0] - 2026-10-05

### Added

- **lanes:** Remember the collapsed lanes
- **matrix:** Fold the sections on a phone
- **filter:** Filter by label and due date
- **export:** Export the board as JSON or CSV
- **done:** Clear the finished cards with Undo

### Fixed

- **labels:** Meet WCAG AA on the label chips

### Documentation

- **readme:** Document filters, export and more

## [1.5.0] - 2026-10-04

### Added

- **bridge:** Expose the component data
- **editor:** Make the crash fallback editable
- **toast:** Offer undo after removing a card

### Fixed

- **deps:** Drop the brace-expansion override
- **scripts:** Drop the unsupported --cors flag
- **view:** Keep the view in the component data
- **parser:** Keep a leading blank description line

### Documentation

- **editor:** Correct the id regeneration comment
- **example:** Show quadrants and the done lane
- **readme:** Document undo and move to

## [1.4.1] - 2026-10-04

### Added

- **preview:** Add a lane summary note preview
- **sync:** Add a guard for stale save echoes

### Fixed

- **save:** Store a short note preview
- **sync:** Ignore stale echoes of our own saves

### Documentation

- Refresh screenshots for board and matrix
- **readme:** Document done lane and matrix view

## [1.4.0] - 2026-10-03

### Added

- **markdown:** Add a Quadrant card field
- **markdown:** Add a done lane marker
- **markdown:** Store renamed quadrant names
- **board:** Mark a lane as the done lane
- **matrix:** Add an Eisenhower matrix view

## [1.3.1] - 2026-10-03

### Fixed

- **mobile:** Request the note with a valid origin

### Documentation

- Credit component-relay instead of editor-kit

## [1.3.0] - 2026-10-03

### Added

- **editor:** Add undo and redo
- **board:** Offer undo after removing a lane
- **editor:** Show note loading and render errors
- **modal:** Add a Move to lane select
- **modal:** Add a save and close button

### Fixed

- **markdown:** Keep unparsed lines in place
- **markdown:** Tolerate common list variations
- **board:** Make Alt+Arrow move cards repeatedly
- **board:** Keep collapsed lanes narrow
- **layout:** Adapt the board to phone screens
- **markdown:** Collapse line breaks in fields

### Changed

- **ids:** Drop the uuid dependency
- **modal:** Type the card modal props

## [1.2.3] - 2026-10-03

### Fixed

- Render synchronously so the relay listener exists before iframe load

## [1.2.2] - 2026-10-01

### Fixed

- Raise modal font size and align header badges

## [1.2.1] - 2026-10-01

### Fixed

- Point ext.json download_url at the latest release asset

### Changed

- Drop the empty EditorConfig from the editor state

## [1.2.0] - 2026-10-01

### Added

- Add card movement shortcuts and print-friendly board

### Documentation

- Replace README demo screenshot with the current board

## [1.1.0] - 2026-10-01

### Added

- Add checklists to cards

## [1.0.2] - 2026-10-01

### Added

- Make label chips clickable and improve card typography

### Documentation

- Point Standard Notes link to standardnotes.com

## [1.0.1] - 2026-10-01

- Maintenance release

## [1.0.0] - 2026-10-01

- Maintenance release

## [0.9.0] - 2026-10-01

### Added

- Persist short ids in the markdown
- Add search, collapsible lanes and keyboard shortcuts

## [0.8.0] - 2026-10-01

### Added

- Add colored labels, due dates and multiline descriptions

## [0.7.0] - 2026-10-01

### Added

- Replace react-trello with a custom dnd board

### Security

- Add release automation, issue templates and project docs

## [0.6.2] - 2026-09-30

### Fixed

- Point desktop download_url at a zip of the built extension

## [0.6.1] - 2026-09-30

### Fixed

- Point extension endpoints at the canonical Pages domain

### Documentation

- Use canonical Pages domain in deployment section

## [0.6.0] - 2026-09-30

### Added

- Editor template with cra typescript

### Fixed

- Overflow-y:auto not working for textarea
- Link to Yarn installation
- Link to repository in README.md
- Sn item in public/package.json
- Preserve legacy JSON notes by wrapping lanes under boardData
- Keep parsing notes after malformed lines instead of failing
- Wire modal app element and let cards be edited from the modal

### Changed

- Load boards with ids and drop dead editor code

### Documentation

- Rewrite README for the fork
