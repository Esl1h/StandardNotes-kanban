import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { shortId } from './ids';

/**
 * Pure board operations. Each function returns a new board object and
 * leaves the input untouched, so React state updates stay predictable
 * and every operation can be unit tested without a DOM.
 */

const laneById = (board: KanbanBoard, laneId: string) =>
  board.lanes.find((lane) => lane.id === laneId);

export const addLane = (board: KanbanBoard, title: string): KanbanBoard => ({
  lanes: [...board.lanes, { id: shortId(), title, cards: [] }],
});

export const renameLane = (
  board: KanbanBoard,
  laneId: string,
  title: string
): KanbanBoard => ({
  lanes: board.lanes.map((lane) =>
    lane.id === laneId ? { ...lane, title } : lane
  ),
});

export const removeLane = (board: KanbanBoard, laneId: string): KanbanBoard => ({
  lanes: board.lanes.filter((lane) => lane.id !== laneId),
});

export const addCardToLane = (
  board: KanbanBoard,
  laneId: string,
  title: string
): KanbanBoard => ({
  lanes: board.lanes.map((lane) =>
    lane.id === laneId
      ? { ...lane, cards: [...lane.cards, { id: shortId(), title, laneId }] }
      : lane
  ),
});

export const updateCard = (
  board: KanbanBoard,
  laneId: string,
  cardId: string,
  patch: Partial<KanbanCard>
): KanbanBoard => ({
  lanes: board.lanes.map((lane) =>
    lane.id !== laneId
      ? lane
      : {
          ...lane,
          cards: lane.cards.map((card) =>
            card.id === cardId ? { ...card, ...patch } : card
          ),
        }
  ),
});

export const removeCard = (
  board: KanbanBoard,
  laneId: string,
  cardId: string
): KanbanBoard => ({
  lanes: board.lanes.map((lane) =>
    lane.id !== laneId
      ? lane
      : { ...lane, cards: lane.cards.filter((card) => card.id !== cardId) }
  )
});

export const moveLane = (
  board: KanbanBoard,
  from: number,
  to: number
): KanbanBoard => {
  const lanes = [...board.lanes];
  const [moved] = lanes.splice(from, 1);
  lanes.splice(to, 0, moved);
  return { lanes };
};

export const moveCard = (
  board: KanbanBoard,
  sourceLaneId: string,
  sourceIndex: number,
  destLaneId: string,
  destIndex: number
): KanbanBoard => {
  const source = laneById(board, sourceLaneId);
  const dest = laneById(board, destLaneId);
  if (!source || !dest) {
    return board;
  }
  const card = source.cards[sourceIndex];
  if (!card) {
    return board;
  }
  const rest = board.lanes.map((lane) => {
    if (lane.id === sourceLaneId) {
      return { ...lane, cards: lane.cards.filter((_, i) => i !== sourceIndex) };
    }
    return lane;
  });
  return {
    lanes: rest.map((lane) => {
      if (lane.id !== destLaneId) {
        return lane;
      }
      const cards = [...lane.cards];
      cards.splice(destIndex, 0, { ...card, laneId: destLaneId });
      return { ...lane, cards };
    }),
  };
};
