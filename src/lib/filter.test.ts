import { cardMatchesQuery, isFiltering } from './filter';
import { KanbanCard } from '../../types/kanban';

const card: KanbanCard = {
  id: 'card-1',
  title: 'Renew passport',
  description: 'Bring documents',
  label: 'red, blue',
};

test('matches against title, description and labels', () => {
  expect(cardMatchesQuery(card, 'renew')).toBe(true);
  expect(cardMatchesQuery(card, 'documents')).toBe(true);
  expect(cardMatchesQuery(card, 'BLUE')).toBe(true);
  expect(cardMatchesQuery(card, 'taxes')).toBe(false);
});

test('blank queries match everything', () => {
  expect(cardMatchesQuery(card, '')).toBe(true);
  expect(cardMatchesQuery(card, '   ')).toBe(true);
});

test('isFiltering detects active searches', () => {
  expect(isFiltering('')).toBe(false);
  expect(isFiltering('  ')).toBe(false);
  expect(isFiltering('renew')).toBe(true);
});
