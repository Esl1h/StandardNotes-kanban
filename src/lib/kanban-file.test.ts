import fs from 'fs/promises';
import { parseMarkdown } from './parseMarkdown';
import { convertStateToMarkdown } from './convertStateToMarkdown';

test('examples/Kanban.txt parses cleanly and round-trips', async () => {
  const file = await fs.readFile('./examples/Kanban.txt', 'utf8');
  const { boardData, parsingErrors } = parseMarkdown(file);

  expect(parsingErrors.filter((e) => e.message)).toEqual([]);
  expect(boardData.lanes.map((l) => l.title)).toEqual([
    'BACKLOG',
    'TO DO',
    'IN PROGRESS',
    'REVIEW',
    'DONE',
    'ARCHIVE',
  ]);
  expect(boardData.lanes.map((l) => l.cards.length)).toEqual([
    4, 3, 2, 2, 8, 2,
  ]);
  // Only the archive is the done lane: hidden from the board, counted in the
  // toolbar.
  expect(boardData.lanes.map((l) => !!l.done)).toEqual([
    false,
    false,
    false,
    false,
    false,
    true,
  ]);
  const quadrants = boardData.lanes
    .flatMap((l) => l.cards)
    .filter((c) => c.quadrant)
    .map((c) => `${c.title}: ${c.quadrant}`);
  expect(quadrants).toEqual([
    'replace demo.png: schedule',
    'reinstall desktop extension: do',
  ]);
  expect(boardData.lanes.every((l) => l.id)).toBe(true);
  expect(boardData.lanes.every((l) => l.cards.every((c) => c.id))).toBe(true);

  const converted = convertStateToMarkdown({
    parsingErrors: [],
    boardData,
  });
  expect(converted).toBe(file);
});
