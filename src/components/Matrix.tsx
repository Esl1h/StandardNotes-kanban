import React, { useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { CardBody } from './Board';
import {
  KanbanBoard,
  KanbanCard,
  KanbanLane,
  Quadrant,
} from '../../types/kanban';
import { completeCard, removeCard, setCardQuadrant } from '../lib/boardOps';
import { cardMatchesQuery, isFiltering } from '../lib/filter';
import { QUADRANTS, QuadrantNames, toQuadrant } from '../lib/quadrants';
import { useUndoToast } from './useUndoToast';

interface MatrixProps {
  data: KanbanBoard;
  filter?: string;
  showDone: boolean;
  quadrantNames: QuadrantNames;
  onDataChange: (board: KanbanBoard) => void;
  /** Reverts the latest change; offered in a toast after a removal. */
  onUndo?: () => void;
  onCardClick: (laneId: string, cardId: string) => void;
  onSearchRequest?: (query: string) => void;
  onRenameQuadrant: (quadrant: Quadrant, name: string) => void;
}

const UNCLASSIFIED = 'unclassified';

const HINTS: Record<Quadrant, string> = {
  do: 'Urgent, important',
  schedule: 'Not urgent, important',
  delegate: 'Urgent, not important',
  eliminate: 'Not urgent, not important',
};

interface Entry {
  card: KanbanCard;
  lane: KanbanLane;
}

const QuadrantTitle = ({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const commit = () => {
    // "|" separates the names in the note, so it cannot be part of one.
    const trimmed = value.replace(/\|/g, '/').trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    } else {
      setValue(name);
    }
    setEditing(false);
  };
  if (!editing) {
    return (
      <button
        type="button"
        className="kbn-quadrant-title"
        aria-label={`Rename quadrant ${name}`}
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
      >
        {name}
      </button>
    );
  }
  return (
    <input
      className="kbn-lane-title-input"
      aria-label="Quadrant name"
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
        }
        if (e.key === 'Escape') {
          setValue(name);
          setEditing(false);
        }
      }}
    />
  );
};

/**
 * Eisenhower view of the same cards: lanes still hold the workflow, the
 * matrix only reads and writes each card's quadrant. Cards keep lane
 * order inside a quadrant; there is no separate manual order.
 */
export const Matrix = ({
  data,
  filter = '',
  showDone,
  quadrantNames,
  onDataChange,
  onUndo,
  onCardClick,
  onSearchRequest,
  onRenameQuadrant,
}: MatrixProps) => {
  const { announce, toast } = useUndoToast(data, onUndo);
  // Sections folded away, which only takes effect on narrow screens, where
  // the stacked list gets long. The cards stay mounted for drag and drop.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const isCollapsed = (id: string) => collapsed.has(id);
  const collapseToggle = (id: string, name: string) => (
    <button
      type="button"
      className="kbn-icon-btn kbn-section-toggle"
      aria-expanded={!isCollapsed(id)}
      aria-label={`${isCollapsed(id) ? 'Expand' : 'Collapse'} ${name}`}
      onClick={() =>
        setCollapsed((previous) => {
          const next = new Set(previous);
          if (!next.delete(id)) {
            next.add(id);
          }
          return next;
        })
      }
    >
      {isCollapsed(id) ? (
        <IconChevronRight size={14} stroke={1.5} />
      ) : (
        <IconChevronDown size={14} stroke={1.5} />
      )}
    </button>
  );
  const sectionClass = (base: string, id: string) =>
    isCollapsed(id) ? `${base} kbn-section-collapsed` : base;
  const filtering = isFiltering(filter);
  const query = filter.trim().toLowerCase();
  const hasDoneLane = data.lanes.some((lane) => lane.done);

  const groups: Record<string, Entry[]> = { [UNCLASSIFIED]: [] };
  QUADRANTS.forEach((q) => (groups[q] = []));
  data.lanes.forEach((lane) => {
    if (lane.done && !showDone) {
      return;
    }
    lane.cards.forEach((card) => {
      if (filtering && !cardMatchesQuery(card, query)) {
        return;
      }
      groups[card.quadrant ?? UNCLASSIFIED].push({ card, lane });
    });
  });

  const handleDragEnd = (result: DropResult) => {
    const destination = result.destination?.droppableId;
    if (!destination || destination === result.source.droppableId) {
      return;
    }
    onDataChange(
      setCardQuadrant(data, result.draggableId, toQuadrant(destination))
    );
  };

  const renderCards = (entries: Entry[]) =>
    entries.map(({ card, lane }, index) => (
      <Draggable draggableId={card.id!} index={index} key={card.id}>
        {(provided, snapshot) => (
          <CardBody
            card={card}
            laneId={lane.id!}
            laneTitle={lane.title}
            finished={lane.done}
            onCardClick={onCardClick}
            onSearchRequest={onSearchRequest}
            onRemove={() => {
              const board = removeCard(data, lane.id!, card.id!);
              onDataChange(board);
              announce(`Card "${card.title}" removed`, board);
            }}
            onComplete={
              hasDoneLane && !lane.done
                ? () => {
                    const board = completeCard(data, lane.id!, card.id!);
                    onDataChange(board);
                    announce(`Card "${card.title}" completed`, board);
                  }
                : undefined
            }
            provided={provided}
            snapshot={snapshot}
          />
        )}
      </Draggable>
    ));

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kbn-matrix">
        <section
          className={sectionClass('kbn-unclassified', UNCLASSIFIED)}
          aria-label="Unclassified"
        >
          <h2 className="kbn-quadrant-heading">
            {collapseToggle(UNCLASSIFIED, 'Unclassified')}
            Unclassified
            <span className="kbn-lane-count">
              {groups[UNCLASSIFIED].length}
            </span>
          </h2>
          <Droppable droppableId={UNCLASSIFIED}>
            {(provided, snapshot) => (
              <div
                className={`kbn-cards${
                  snapshot.isDraggingOver ? ' kbn-dragging-over' : ''
                }`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {renderCards(groups[UNCLASSIFIED])}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </section>
        <div className="kbn-quadrants">
          {QUADRANTS.map((q) => (
            <section
              key={q}
              className={sectionClass(`kbn-quadrant kbn-quadrant-${q}`, q)}
              aria-label={quadrantNames[q]}
            >
              <div className="kbn-quadrant-heading">
                {collapseToggle(q, quadrantNames[q])}
                <QuadrantTitle
                  name={quadrantNames[q]}
                  onRename={(name) => onRenameQuadrant(q, name)}
                />
                <span className="kbn-lane-count">{groups[q].length}</span>
                <span className="kbn-quadrant-hint">{HINTS[q]}</span>
              </div>
              <Droppable droppableId={q}>
                {(provided, snapshot) => (
                  <div
                    className={`kbn-cards${
                      snapshot.isDraggingOver ? ' kbn-dragging-over' : ''
                    }`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {renderCards(groups[q])}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          ))}
        </div>
      </div>
      {toast}
    </DragDropContext>
  );
};
