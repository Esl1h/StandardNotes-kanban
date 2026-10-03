import { KanbanBoard } from '../../types/kanban';
import {
  emptyHistory,
  HISTORY_LIMIT,
  recordChange,
  redoStep,
  undoStep,
} from './history';

const board = (title: string): KanbanBoard => ({
  lanes: [{ id: 'l1', title, cards: [] }],
});

test('undo restores the previous board and keeps the current one for redo', () => {
  const history = recordChange(emptyHistory, board('a'));

  const result = undoStep(history, board('b'))!;

  expect(result.board).toEqual(board('a'));
  expect(result.history.past).toEqual([]);
  expect(result.history.future).toEqual([board('b')]);
});

test('redo reapplies an undone board', () => {
  const undone = undoStep(recordChange(emptyHistory, board('a')), board('b'))!;

  const result = redoStep(undone.history, undone.board)!;

  expect(result.board).toEqual(board('b'));
  expect(result.history.past).toEqual([board('a')]);
  expect(result.history.future).toEqual([]);
});

test('undo and redo do nothing when there is nothing to step to', () => {
  expect(undoStep(emptyHistory, board('a'))).toBeNull();
  expect(redoStep(emptyHistory, board('a'))).toBeNull();
});

test('a new change drops the redo branch', () => {
  const undone = undoStep(recordChange(emptyHistory, board('a')), board('b'))!;

  const history = recordChange(undone.history, undone.board);

  expect(history.future).toEqual([]);
});

test('keeps only the most recent changes', () => {
  let history = emptyHistory;
  for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
    history = recordChange(history, board(String(i)));
  }

  expect(history.past).toHaveLength(HISTORY_LIMIT);
  expect(history.past[0]).toEqual(board('10'));
  expect(history.past[HISTORY_LIMIT - 1]).toEqual(
    board(String(HISTORY_LIMIT + 9))
  );
});

test('stepping never mutates the previous history', () => {
  const history = recordChange(emptyHistory, board('a'));
  const snapshot = JSON.stringify(history);

  undoStep(history, board('b'));

  expect(JSON.stringify(history)).toBe(snapshot);
});
