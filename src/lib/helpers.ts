import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { shortId } from './ids';

/**
 * Guarantees every lane and card has an id that is unique across the
 * board. Existing ids (parsed from "[id:xxx]" markers) are preserved;
 * missing or colliding ones are replaced with fresh short ids.
 */
export const infuseBoardData = (boardData: KanbanBoard): KanbanBoard => {
  const used = new Set<string>();

  const freshId = (): string => {
    let id = shortId();
    while (used.has(id)) {
      id = shortId();
    }
    used.add(id);
    return id;
  };

  return {
    lanes: boardData.lanes.map((lane) => {
      const laneId = lane.id && !used.has(lane.id) ? lane.id : freshId();
      used.add(laneId);
      const cards: KanbanCard[] = lane.cards.map((card) => {
        const cardId = card.id && !used.has(card.id) ? card.id : freshId();
        used.add(cardId);
        return { ...card, id: cardId, laneId };
      });
      return { ...lane, id: laneId, cards };
    }),
  };
};
