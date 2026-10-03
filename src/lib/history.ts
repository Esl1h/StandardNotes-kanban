import { KanbanBoard } from '../../types/kanban';

/**
 * Undo/redo stacks of whole boards. Board operations are pure, so a
 * snapshot is just a reference and costs nothing to keep.
 */
export interface History {
  past: KanbanBoard[];
  future: KanbanBoard[];
}

export const HISTORY_LIMIT = 50;

export const emptyHistory: History = { past: [], future: [] };

/** Call with the board as it was before a user edit. */
export const recordChange = (
  history: History,
  before: KanbanBoard
): History => ({
  past: [...history.past, before].slice(-HISTORY_LIMIT),
  future: [],
});

export interface HistoryStep {
  board: KanbanBoard;
  history: History;
}

export const undoStep = (
  history: History,
  current: KanbanBoard
): HistoryStep | null => {
  if (history.past.length === 0) {
    return null;
  }
  return {
    board: history.past[history.past.length - 1],
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future],
    },
  };
};

export const redoStep = (
  history: History,
  current: KanbanBoard
): HistoryStep | null => {
  if (history.future.length === 0) {
    return null;
  }
  return {
    board: history.future[0],
    history: {
      past: [...history.past, current],
      future: history.future.slice(1),
    },
  };
};
