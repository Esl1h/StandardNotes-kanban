import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import type {
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult,
} from '@hello-pangea/dnd';
import {
  IconChevronDown,
  IconChevronRight,
  IconCircleCheck,
  IconPlus,
  IconX,
} from '@tabler/icons-react';
import { KanbanBoard, KanbanCard, KanbanLane } from '../../types/kanban';
import {
  addCardToLane,
  addLane,
  moveCard,
  moveLane,
  removeCard,
  removeLane,
  renameLane,
  setDoneLane,
} from '../lib/boardOps';
import { chipStyle, dueBadge, labelChips } from '../lib/labels';
import { cardMatchesQuery, isFiltering } from '../lib/filter';

interface BoardProps {
  data: KanbanBoard;
  filter?: string;
  onDataChange: (board: KanbanBoard) => void;
  onCardClick: (laneId: string, cardId: string) => void;
  onSearchRequest?: (query: string) => void;
  onUndo?: () => void;
  /** Show the done lane, which is hidden by default. */
  showDone?: boolean;
}

// How long the "lane removed" toast stays up before it goes away.
const UNDO_TOAST_MS = 6000;

/**
 * Add forms commit on Enter or the Add button and cancel on Escape or
 * Cancel, matching Trello's behaviour.
 */
const LaneTitle = ({
  lane,
  onRename,
}: {
  lane: KanbanLane;
  onRename: (title: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(lane.title);
  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== lane.title) {
      onRename(trimmed);
    } else {
      setValue(lane.title);
    }
    setEditing(false);
  };
  if (!editing) {
    return (
      <button
        type="button"
        className="kbn-lane-title"
        onClick={() => setEditing(true)}
        title="Rename lane"
      >
        {lane.title}
      </button>
    );
  }
  return (
    <input
      className="kbn-lane-title-input"
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
        }
        if (e.key === 'Escape') {
          setValue(lane.title);
          setEditing(false);
        }
      }}
    />
  );
};

interface AddCardProps {
  laneId: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (title: string) => void;
}

const AddCard = ({ laneId, open, onOpen, onClose, onAdd }: AddCardProps) => {
  const [value, setValue] = useState('');
  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setValue('');
    onClose();
  };
  if (!open) {
    return (
      <button type="button" className="kbn-add-card" onClick={onOpen}>
        <IconPlus size={14} stroke={1.5} /> Add card
      </button>
    );
  }
  return (
    <div className="kbn-add-form">
      <input
        autoFocus
        className="kbn-input"
        placeholder="Card title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            e.preventDefault();
          }
          if (e.key === 'Escape') {
            setValue('');
            onClose();
          }
        }}
        aria-label={`New card title in lane ${laneId}`}
      />
      <div className="kbn-form-actions">
        <button
          type="button"
          className="kbn-btn kbn-btn-primary"
          onClick={commit}
        >
          Add card
        </button>
        <button
          type="button"
          className="kbn-btn kbn-btn-ghost"
          onClick={() => {
            setValue('');
            onClose();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

interface AddLaneProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (title: string) => void;
}

const AddLane = ({ open, onOpen, onClose, onAdd }: AddLaneProps) => {
  const [value, setValue] = useState('');
  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
    }
    setValue('');
    onClose();
  };
  if (!open) {
    return (
      <button type="button" className="kbn-add-lane" onClick={onOpen}>
        <IconPlus size={14} stroke={1.5} /> Add lane
      </button>
    );
  }
  return (
    <div className="kbn-lane kbn-add-lane-form">
      <input
        autoFocus
        className="kbn-input"
        placeholder="Lane title"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            e.preventDefault();
          }
          if (e.key === 'Escape') {
            setValue('');
            onClose();
          }
        }}
        aria-label="New lane title"
      />
      <div className="kbn-form-actions">
        <button
          type="button"
          className="kbn-btn kbn-btn-primary"
          onClick={commit}
        >
          Add lane
        </button>
        <button
          type="button"
          className="kbn-btn kbn-btn-ghost"
          onClick={() => {
            setValue('');
            onClose();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

interface CardBodyProps {
  card: KanbanCard;
  laneId: string;
  onCardClick: (laneId: string, cardId: string) => void;
  onSearchRequest?: (query: string) => void;
  onRemove: () => void;
  focused?: boolean;
  provided?: DraggableProvided;
  snapshot?: DraggableStateSnapshot;
  /** Shown as a chip where cards from several lanes mix (the matrix). */
  laneTitle?: string;
  /** Offers a button that moves the card to the done lane. */
  onComplete?: () => void;
  finished?: boolean;
}

export const CardBody = ({
  card,
  laneId,
  onCardClick,
  onSearchRequest,
  onRemove,
  focused,
  provided,
  snapshot,
  laneTitle,
  onComplete,
  finished,
}: CardBodyProps) => {
  const badge = dueBadge(card.due);
  const checklist = card.checklist || [];
  const checklistDone = checklist.filter((item) => item.done).length;
  return (
    <div
      className={`kbn-card${snapshot?.isDragging ? ' kbn-card-dragging' : ''}${
        focused ? ' kbn-card-focused' : ''
      }${finished ? ' kbn-card-finished' : ''}`}
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      onClick={() => onCardClick(laneId, card.id!)}
    >
      <div className="kbn-card-row">
        <span className="kbn-card-title">{card.title}</span>
        {laneTitle && <span className="kbn-card-lane">{laneTitle}</span>}
      </div>
      {labelChips(card.label).length > 0 && (
        <div className="kbn-card-chips">
          {labelChips(card.label).map((chip) => (
            <button
              key={chip.name}
              type="button"
              className="kbn-card-chip"
              style={chipStyle(chip.color)}
              title={`Filter by ${chip.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onSearchRequest?.(chip.name);
              }}
            >
              {chip.name}
            </button>
          ))}
        </div>
      )}
      {card.description && (
        <div className="kbn-card-description">{card.description}</div>
      )}
      {checklist.length > 0 && (
        <div className="kbn-checklist">
          <div className="kbn-checklist-bar" role="presentation">
            <div
              className="kbn-checklist-bar-fill"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
            />
          </div>
          <span className="kbn-checklist-count">
            {checklistDone}/{checklist.length}
          </span>
        </div>
      )}
      {badge && (
        <div className={`kbn-due ${badge.className}`}>{badge.text}</div>
      )}
      {onComplete && (
        <button
          type="button"
          className="kbn-icon-btn kbn-card-complete"
          aria-label={`Complete card ${card.title}`}
          title="Move to the done lane"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <IconCircleCheck size={14} stroke={1.5} />
        </button>
      )}
      <button
        type="button"
        className="kbn-icon-btn kbn-card-delete"
        aria-label={`Delete card ${card.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <IconX size={14} stroke={1.5} />
      </button>
    </div>
  );
};

export const Board = ({
  data,
  filter = '',
  onDataChange,
  onCardClick,
  onSearchRequest,
  onUndo,
  showDone = false,
}: BoardProps) => {
  const filtering = isFiltering(filter);
  const isHidden = (lane: KanbanLane) => !!lane.done && !showDone;
  const query = filter.trim().toLowerCase();
  const [openCardFormLaneId, setOpenCardFormLaneId] = useState<string | null>(
    null
  );
  const [addLaneOpen, setAddLaneOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  // The board right after a lane removal; the undo toast is only valid
  // while it is still the current board.
  const [removedLane, setRemovedLane] = useState<{
    title: string;
    board: KanbanBoard;
  } | null>(null);
  const [collapsedLaneIds, setCollapsedLaneIds] = useState<ReadonlySet<string>>(
    new Set()
  );
  // Last clicked card; Alt+Left/Right moves it between lanes.
  const [focusedCard, setFocusedCard] = useState<{
    laneId: string;
    cardId: string;
  } | null>(null);

  const handleCardClick = (laneId: string, cardId: string) => {
    setFocusedCard({ laneId, cardId });
    onCardClick(laneId, cardId);
  };

  const moveFocusedCard = (direction: -1 | 1) => {
    if (filtering || !focusedCard) {
      return;
    }
    const fromLaneIndex = data.lanes.findIndex(
      (l) => l.id === focusedCard.laneId
    );
    const fromIndex =
      data.lanes[fromLaneIndex]?.cards.findIndex(
        (c) => c.id === focusedCard.cardId
      ) ?? -1;
    if (fromIndex < 0) {
      return;
    }
    // Skip collapsed lanes so the card lands somewhere visible.
    let toLaneIndex = fromLaneIndex + direction;
    while (
      data.lanes[toLaneIndex] &&
      (collapsedLaneIds.has(data.lanes[toLaneIndex].id!) ||
        isHidden(data.lanes[toLaneIndex]))
    ) {
      toLaneIndex += direction;
    }
    const toLane = data.lanes[toLaneIndex];
    if (!toLane) {
      return;
    }
    onDataChange(
      moveCard(
        data,
        focusedCard.laneId,
        fromIndex,
        toLane.id!,
        Math.min(fromIndex, toLane.cards.length)
      )
    );
    // Follow the card, or the next press would look for it in the lane it
    // just left.
    setFocusedCard({ laneId: toLane.id!, cardId: focusedCard.cardId });
  };

  const toggleCollapse = (laneId: string) => {
    setCollapsedLaneIds((prev) => {
      const next = new Set(prev);
      if (next.has(laneId)) {
        next.delete(laneId);
      } else {
        next.add(laneId);
      }
      return next;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    setDragging(false);
    if (filtering || !result.destination) {
      return;
    }
    if (result.type === 'LANE') {
      if (result.source.index === result.destination.index) {
        return;
      }
      // Indexes are positions among the rendered lanes, which leave the
      // hidden done lane out.
      const toDataIndex = (index: number) =>
        data.lanes.findIndex((lane) => lane.id === lanesToRender[index].id);
      onDataChange(
        moveLane(
          data,
          toDataIndex(result.source.index),
          toDataIndex(result.destination.index)
        )
      );
      return;
    }
    const sourceLaneId = result.source.droppableId;
    const destLaneId = result.destination.droppableId;
    if (
      sourceLaneId === destLaneId &&
      result.source.index === result.destination.index
    ) {
      return;
    }
    onDataChange(
      moveCard(
        data,
        sourceLaneId,
        result.source.index,
        destLaneId,
        result.destination.index
      )
    );
  };

  // "N" opens the add-card form on the first expanded lane, or the
  // add-lane form when the board has no expanded lanes. Ignored while
  // typing or while the card modal is open.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (document.body.classList.contains('ReactModal__Body--open')) {
        return;
      }
      e.preventDefault();
      const firstExpanded = data.lanes.find(
        (lane) => !collapsedLaneIds.has(lane.id!) && !(lane.done && !showDone)
      );
      if (firstExpanded?.id) {
        setAddLaneOpen(false);
        setOpenCardFormLaneId(firstExpanded.id);
      } else {
        setOpenCardFormLaneId(null);
        setAddLaneOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [data, collapsedLaneIds, showDone]);

  // Alt+Left/Right moves the focused (last clicked) card to the adjacent
  // lane. Ignored while typing, while filtering or while the modal is
  // open.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) {
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (document.body.classList.contains('ReactModal__Body--open')) {
        return;
      }
      e.preventDefault();
      moveFocusedCard(e.key === 'ArrowLeft' ? -1 : 1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // moveFocusedCard is recreated on each render of the same deps
    // listed here, so it is safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, collapsedLaneIds, filtering, focusedCard, showDone]);

  React.useEffect(() => {
    if (!removedLane) {
      return;
    }
    const timer = setTimeout(() => setRemovedLane(null), UNDO_TOAST_MS);
    return () => clearTimeout(timer);
  }, [removedLane]);

  let lanesToRender = data.lanes.filter((lane) => !isHidden(lane));
  if (filtering) {
    lanesToRender = lanesToRender.filter(
      (lane) =>
        lane.title.toLowerCase().includes(query) ||
        lane.cards.some((card) => cardMatchesQuery(card, query))
    );
  }

  return (
    <DragDropContext
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <Droppable
        droppableId="board"
        type="LANE"
        direction="horizontal"
        isDropDisabled={filtering}
      >
        {(boardProvided) => (
          <div
            className={`kbn-board${dragging ? ' kbn-board-dragging' : ''}`}
            ref={boardProvided.innerRef}
            {...boardProvided.droppableProps}
          >
            {lanesToRender.map((lane, laneIndex) => {
              // While filtering, lanes with matches render their cards
              // even if collapsed, so chip clicks reveal results.
              const collapsed = !filtering && collapsedLaneIds.has(lane.id!);
              const titleMatches = lane.title.toLowerCase().includes(query);
              const visibleCards = filtering
                ? titleMatches
                  ? lane.cards
                  : lane.cards.filter((card) => cardMatchesQuery(card, query))
                : lane.cards;
              return (
                <Draggable
                  draggableId={`lane-${lane.id}`}
                  index={laneIndex}
                  key={lane.id}
                  isDragDisabled={filtering}
                >
                  {(laneProvided) => (
                    <div
                      className={`kbn-lane${
                        collapsed ? ' kbn-lane-collapsed' : ''
                      }${lane.done ? ' kbn-lane-done' : ''}`}
                      ref={laneProvided.innerRef}
                      {...laneProvided.draggableProps}
                    >
                      <div
                        className="kbn-lane-header"
                        {...laneProvided.dragHandleProps}
                      >
                        <button
                          type="button"
                          className="kbn-icon-btn"
                          aria-label={
                            collapsed
                              ? `Expand lane ${lane.title}`
                              : `Collapse lane ${lane.title}`
                          }
                          onClick={() => toggleCollapse(lane.id!)}
                        >
                          {collapsed ? (
                            <IconChevronRight size={14} stroke={1.5} />
                          ) : (
                            <IconChevronDown size={14} stroke={1.5} />
                          )}
                        </button>
                        <LaneTitle
                          lane={lane}
                          onRename={(title) =>
                            onDataChange(renameLane(data, lane.id!, title))
                          }
                        />
                        <span className="kbn-lane-count">
                          {lane.cards.length}
                        </span>
                        <button
                          type="button"
                          className={`kbn-icon-btn${
                            lane.done ? ' kbn-done-toggle-on' : ''
                          }`}
                          aria-label={
                            lane.done
                              ? `Unmark done lane ${lane.title}`
                              : `Mark lane ${lane.title} as done`
                          }
                          title={
                            lane.done
                              ? 'Done lane: its cards count as finished'
                              : 'Mark as the done lane'
                          }
                          onClick={() =>
                            onDataChange(
                              setDoneLane(data, lane.done ? null : lane.id!)
                            )
                          }
                        >
                          <IconCircleCheck size={14} stroke={1.5} />
                        </button>
                        <button
                          type="button"
                          className="kbn-icon-btn"
                          aria-label={`Delete lane ${lane.title}`}
                          onClick={() => {
                            const board = removeLane(data, lane.id!);
                            onDataChange(board);
                            setRemovedLane({ title: lane.title, board });
                          }}
                        >
                          <IconX size={14} stroke={1.5} />
                        </button>
                      </div>
                      {!collapsed && (
                        <>
                          <Droppable
                            droppableId={lane.id!}
                            type="CARD"
                            isDropDisabled={filtering}
                          >
                            {(cardsProvided, cardsSnapshot) => (
                              <div
                                className={`kbn-cards${
                                  cardsSnapshot.isDraggingOver
                                    ? ' kbn-dragging-over'
                                    : ''
                                }`}
                                ref={cardsProvided.innerRef}
                                {...cardsProvided.droppableProps}
                              >
                                {visibleCards.map(
                                  (card: KanbanCard, cardIndex) =>
                                    filtering ? (
                                      <CardBody
                                        key={card.id}
                                        card={card}
                                        laneId={lane.id!}
                                        onCardClick={handleCardClick}
                                        onSearchRequest={onSearchRequest}
                                        focused={
                                          focusedCard?.cardId === card.id
                                        }
                                        onRemove={() =>
                                          onDataChange(
                                            removeCard(data, lane.id!, card.id!)
                                          )
                                        }
                                      />
                                    ) : (
                                      <Draggable
                                        draggableId={card.id!}
                                        index={cardIndex}
                                        key={card.id}
                                      >
                                        {(cardProvided, cardSnapshot) => (
                                          <CardBody
                                            card={card}
                                            laneId={lane.id!}
                                            onCardClick={handleCardClick}
                                            onSearchRequest={onSearchRequest}
                                            focused={
                                              focusedCard?.cardId === card.id
                                            }
                                            onRemove={() =>
                                              onDataChange(
                                                removeCard(
                                                  data,
                                                  lane.id!,
                                                  card.id!
                                                )
                                              )
                                            }
                                            provided={cardProvided}
                                            snapshot={cardSnapshot}
                                          />
                                        )}
                                      </Draggable>
                                    )
                                )}
                                {cardsProvided.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <AddCard
                            laneId={lane.id!}
                            open={openCardFormLaneId === lane.id}
                            onOpen={() => setOpenCardFormLaneId(lane.id!)}
                            onClose={() => setOpenCardFormLaneId(null)}
                            onAdd={(title) => {
                              onDataChange(
                                addCardToLane(data, lane.id!, title)
                              );
                              setOpenCardFormLaneId(null);
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}
                </Draggable>
              );
            })}
            {boardProvided.placeholder}
            <AddLane
              open={addLaneOpen}
              onOpen={() => setAddLaneOpen(true)}
              onClose={() => setAddLaneOpen(false)}
              onAdd={(title) => {
                onDataChange(addLane(data, title));
                setAddLaneOpen(false);
              }}
            />
          </div>
        )}
      </Droppable>
      {onUndo && removedLane?.board === data && (
        <div className="kbn-toast" role="status">
          <span>Lane "{removedLane.title}" removed</span>
          <button
            type="button"
            className="kbn-btn kbn-btn-primary"
            onClick={() => {
              setRemovedLane(null);
              onUndo();
            }}
          >
            Undo
          </button>
        </div>
      )}
    </DragDropContext>
  );
};
