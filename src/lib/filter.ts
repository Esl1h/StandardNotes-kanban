import { KanbanCard } from '../../types/kanban';

/**
 * Card search: matches title, description and labels. Lane titles are
 * matched separately so a lane with a matching name keeps all of its
 * cards visible.
 */
export const cardMatchesQuery = (card: KanbanCard, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    card.title.toLowerCase().includes(q) ||
    (card.description || '').toLowerCase().includes(q) ||
    (card.label || '').toLowerCase().includes(q)
  );
};

export const isFiltering = (query: string): boolean => query.trim().length > 0;
