import React, { useEffect, useRef, useState } from 'react';
import { KanbanBoard } from '../../types/kanban';
import { toCsv, toJson } from '../lib/exportBoard';
import { QuadrantNames } from '../lib/quadrants';

interface ExportMenuProps {
  board: KanbanBoard;
  quadrantNames: QuadrantNames;
}

const copy = (text: string) => {
  // Not every host lets the plugin write to the clipboard.
  void Promise.resolve(navigator.clipboard?.writeText(text)).catch(() => {});
};

const download = (text: string, fileName: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Takes the whole board out of the note as JSON or CSV, copied or saved as
 * a file. It always exports everything, whatever the search is showing.
 */
export const ExportMenu = ({ board, quadrantNames }: ExportMenuProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  const items: Array<[string, () => void]> = [
    ['Copy JSON', () => copy(toJson(board))],
    ['Copy CSV', () => copy(toCsv(board, quadrantNames))],
    [
      'Download JSON',
      () => download(toJson(board), 'kanban-board.json', 'application/json'),
    ],
    [
      'Download CSV',
      () =>
        download(toCsv(board, quadrantNames), 'kanban-board.csv', 'text/csv'),
    ],
  ];

  return (
    <div className="kbn-export" ref={rootRef}>
      <button
        type="button"
        className="kbn-btn kbn-btn-ghost kbn-toolbar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Export
      </button>
      {open && (
        <div className="kbn-export-menu" role="menu">
          {items.map(([name, action]) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className="kbn-btn kbn-btn-ghost"
              onClick={() => {
                action();
                setOpen(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
