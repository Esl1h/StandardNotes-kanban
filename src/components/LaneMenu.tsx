import React, { useEffect, useRef, useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import { KanbanLane } from '../../types/kanban';

interface LaneMenuProps {
  lane: KanbanLane;
  /** The done lanes its cards can be completed into, the main one first. */
  doneLanes: KanbanLane[];
  onToggleDone: () => void;
  onCompleteAll: (doneLaneId: string) => void;
  onClearCards: () => void;
  onDelete: () => void;
}

/** The lane actions, behind a kebab button in the lane header. */
export const LaneMenu = ({
  lane,
  doneLanes,
  onToggleDone,
  onCompleteAll,
  onClearCards,
  onDelete,
}: LaneMenuProps) => {
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

  const hasCards = lane.cards.length > 0;
  const items: Array<[string, () => void]> = [
    [lane.done ? 'Unmark as done' : 'Mark as done', onToggleDone],
  ];
  if (hasCards && !lane.done) {
    // With several done lanes, the menu asks which one.
    doneLanes.forEach((doneLane) =>
      items.push([
        doneLanes.length === 1 ? 'Complete all cards' : `Complete all cards in ${doneLane.title}`,
        () => onCompleteAll(doneLane.id!),
      ])
    );
  }
  if (hasCards) {
    items.push(['Delete all cards', onClearCards]);
  }
  items.push(['Delete lane', onDelete]);

  return (
    <div className="kbn-lane-menu" ref={rootRef}>
      <button
        type="button"
        className="kbn-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Lane actions ${lane.title}`}
        title="Lane actions"
        onClick={() => setOpen(!open)}
      >
        <IconDotsVertical size={14} stroke={1.5} />
      </button>
      {open && (
        <div className="kbn-menu" role="menu">
          {items.map(([name, action]) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className="kbn-btn kbn-btn-ghost"
              onClick={() => {
                setOpen(false);
                action();
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
