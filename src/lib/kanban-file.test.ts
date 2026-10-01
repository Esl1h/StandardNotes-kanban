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
  ]);
  expect(boardData.lanes.map((l) => l.cards.length)).toEqual([4, 3, 2, 2, 8]);
  expect(boardData.lanes.every((l) => l.id)).toBe(true);
  expect(boardData.lanes.every((l) => l.cards.every((c) => c.id))).toBe(true);

  const converted = convertStateToMarkdown({
    parsingErrors: [],
    boardData,
  });
  expect(converted).toBe(file);
});
