import { v4 as uuid } from 'uuid';
import { KanbanBoard, KanbanCard, KanbanLane } from '../../types/kanban';

export const infuseBoardData = (boardData: KanbanBoard): KanbanBoard => {
  return {
    ...boardData,
    lanes: boardData.lanes.map((lane: KanbanLane) => {
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

const titleCaseWord = (text: string): string =>
  text.replace(/\w/, (firstLetter) => firstLetter.toUpperCase());

export const titleCase = (text: string): string =>
  text
    .split(' ')
    .map((word) => titleCaseWord(word.toLowerCase()))
    .join(' ');
