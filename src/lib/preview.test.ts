import fs from 'fs/promises';
import { PREVIEW_LIMIT, boardPreview } from './preview';

test('summarizes a board by its lanes, within the limit', async () => {
  const file = await fs.readFile('./examples/Kanban.txt', 'utf8');
  const preview = boardPreview(file);

  expect(preview.startsWith('BACKLOG (')).toBe(true);
  expect(preview.length).toBeLessThanOrEqual(PREVIEW_LIMIT);
});

test('counts the cards of an empty lane as zero', () => {
  expect(boardPreview('# New')).toBe('New (0)');
});

test('is a single space for an empty note, never an empty string', () => {
  expect(boardPreview('')).toBe(' ');
});
