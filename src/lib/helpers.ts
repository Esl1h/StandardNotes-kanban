import { v4 as uuid } from 'uuid';
import { KanbanBoard, KanbanCard } from '../../types/kanban';

export const infuseBoardData = (boardData: KanbanBoard): KanbanBoard => {
  return {
    ...boardData,
    lanes: boardData.lanes.map((lane) => {
      const laneId = uuid();
      return {
        ...lane,
        id: laneId,
        cards: lane.cards.map((card: KanbanCard) => ({
          ...card,
          laneId,
          id: uuid(),
        })),
      };
    }),
  };
};
