import React, { useEffect, useState } from 'react';
import { KanbanBoard } from '../../types/kanban';

// How long the undo toast stays up before it goes away.
const UNDO_TOAST_MS = 6000;

/**
 * The "removed, Undo" toast of the board and the matrix. Phones have no
 * Ctrl+Z, so a destructive tap has to offer its own way back.
 *
 * `announce` is called with the board the action produced; the toast is only
 * valid while that is still the current board, since Undo reverts the latest
 * change and would otherwise revert a different edit.
 */
export const useUndoToast = (data: KanbanBoard, onUndo?: () => void) => {
  const [last, setLast] = useState<{
    message: string;
    board: KanbanBoard;
  } | null>(null);

  useEffect(() => {
    if (!last) {
      return;
    }
    const timer = setTimeout(() => setLast(null), UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [last]);

  const toast =
    onUndo && last?.board === data ? (
      <div className="kbn-toast" role="status">
        <span>{last.message}</span>
        <button
          type="button"
          className="kbn-btn kbn-btn-primary"
          onClick={() => {
            setLast(null);
            onUndo();
          }}
        >
          Undo
        </button>
      </div>
    ) : null;

  return {
    announce: (message: string, board: KanbanBoard) =>
      setLast({ message, board }),
    toast,
  };
};
