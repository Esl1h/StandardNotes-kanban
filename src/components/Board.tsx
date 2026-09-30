import React, { useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { IconPlus, IconX } from '@tabler/icons-react';
import { KanbanBoard, KanbanCard, KanbanLane } from '../../types/kanban';
import {
  addCardToLane,
  addLane,
  moveCard,
  moveLane,
  removeCard,
  removeLane,
  renameLane,
} from '../lib/boardOps';

interface BoardProps {
  data: KanbanBoard;
  onDataChange: (board: KanbanBoard) => void;
  onCardClick: (laneId: string, cardId: string) => void;
}

/**
 * Card title editing inside the add forms commits on Enter or the Add
 * button and cancels on Escape or Cancel, matching Trello's behaviour.
 */
const useForm = (onCommit: (value: string) => void) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const close = () => {
    setOpen(false);
    setValue('');
  };
  const commit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onCommit(trimmed);
    }
    close();
  };
  return {
    open,
    value,
    openForm: () => setOpen(true),
    close,
    commit,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commit();
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        close();
      }
    },
  };
};

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

const AddCard = ({
  laneId,
  onAdd,
}: {
  laneId: string;
  onAdd: (title: string) => void;
}) => {
  const form = useForm((title) => onAdd(title));
  if (!form.open) {
    return (
      <button type="button" className="kbn-add-card" onClick={form.openForm}>
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
        value={form.value}
        onChange={form.onChange}
        onKeyDown={form.onKeyDown}
        aria-label={`New card title in lane ${laneId}`}
      />
      <div className="kbn-form-actions">
        <button type="button" className="kbn-btn kbn-btn-primary" onClick={form.commit}>
          Add card
        </button>
        <button type="button" className="kbn-btn kbn-btn-ghost" onClick={form.close}>
          Cancel
        </button>
      </div>
    </div>
  );
};

const AddLane = ({ onAdd }: { onAdd: (title: string) => void }) => {
  const form = useForm((title) => onAdd(title));
  if (!form.open) {
    return (
      <button type="button" className="kbn-add-lane" onClick={form.openForm}>
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
        value={form.value}
        onChange={form.onChange}
        onKeyDown={form.onKeyDown}
        aria-label="New lane title"
      />
      <div className="kbn-form-actions">
        <button type="button" className="kbn-btn kbn-btn-primary" onClick={form.commit}>
          Add lane
        </button>
        <button type="button" className="kbn-btn kbn-btn-ghost" onClick={form.close}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export const Board = ({ data, onDataChange, onCardClick }: BoardProps) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    if (result.type === 'LANE') {
      if (result.source.index === result.destination.index) {
        return;
      }
      onDataChange(moveLane(data, result.source.index, result.destination.index));
      return;
    }
    const sourceLaneId = result.source.droppableId;
    const destLaneId = result.destination.droppableId;
    if (sourceLaneId === destLaneId && result.source.index === result.destination.index) {
      return;
    }
    onDataChange(
      moveCard(data, sourceLaneId, result.source.index, destLaneId, result.destination.index)
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="LANE" direction="horizontal">
        {(boardProvided) => (
          <div
            className="kbn-board"
            ref={boardProvided.innerRef}
            {...boardProvided.droppableProps}
          >
            {data.lanes.map((lane, laneIndex) => (
              <Draggable
                draggableId={`lane-${lane.id}`}
                index={laneIndex}
                key={lane.id}
              >
                {(laneProvided) => (
                  <div
                    className="kbn-lane"
                    ref={laneProvided.innerRef}
                    {...laneProvided.draggableProps}
                  >
                    <div
                      className="kbn-lane-header"
                      {...laneProvided.dragHandleProps}
                    >
                      <LaneTitle
                        lane={lane}
                        onRename={(title) => onDataChange(renameLane(data, lane.id!, title))}
                      />
                      <span className="kbn-lane-count">{lane.cards.length}</span>
                      <button
                        type="button"
                        className="kbn-icon-btn"
                        aria-label={`Delete lane ${lane.title}`}
                        onClick={() => onDataChange(removeLane(data, lane.id!))}
                      >
                        <IconX size={14} stroke={1.5} />
                      </button>
                    </div>
                    <Droppable droppableId={lane.id!} type="CARD">
                      {(cardsProvided, cardsSnapshot) => (
                        <div
                          className={`kbn-cards${
                            cardsSnapshot.isDraggingOver ? ' kbn-dragging-over' : ''
                          }`}
                          ref={cardsProvided.innerRef}
                          {...cardsProvided.droppableProps}
                        >
                          {lane.cards.map((card: KanbanCard, cardIndex) => (
                            <Draggable
                              draggableId={card.id!}
                              index={cardIndex}
                              key={card.id}
                            >
                              {(cardProvided, cardSnapshot) => (
                                <div
                                  className={`kbn-card${
                                    cardSnapshot.isDragging ? ' kbn-card-dragging' : ''
                                  }`}
                                  ref={cardProvided.innerRef}
                                  {...cardProvided.draggableProps}
                                  {...cardProvided.dragHandleProps}
                                  onClick={() => onCardClick(lane.id!, card.id!)}
                                >
                                  <div className="kbn-card-row">
                                    <span className="kbn-card-title">{card.title}</span>
                                    {card.label && (
                                      <span className="kbn-card-chip">{card.label}</span>
                                    )}
                                  </div>
                                  {card.description && (
                                    <div className="kbn-card-description">
                                      {card.description}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    className="kbn-icon-btn kbn-card-delete"
                                    aria-label={`Delete card ${card.title}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDataChange(removeCard(data, lane.id!, card.id!));
                                    }}
                                  >
                                    <IconX size={14} stroke={1.5} />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {cardsProvided.placeholder}
                        </div>
                      )}
                    </Droppable>
                    <AddCard
                      laneId={lane.id!}
                      onAdd={(title) => onDataChange(addCardToLane(data, lane.id!, title))}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {boardProvided.placeholder}
            <AddLane onAdd={(title) => onDataChange(addLane(data, title))} />
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
