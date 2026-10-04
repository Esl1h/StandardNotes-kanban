import fs from 'node:fs';

/** The example board of the repository, as the note text. */
export const BOARD = fs.readFileSync('examples/Kanban.txt', 'utf8');

/** Lanes shown on the board: the done lane stays hidden behind its button. */
export const VISIBLE_LANES = BOARD.split('\n').filter(
  (line) => line.startsWith('# ') && !line.includes('[done]')
).length;
