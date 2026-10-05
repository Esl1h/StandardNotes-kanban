import {
  cardMatchesQuery,
  filterToken,
  hasFilter,
  isFiltering,
  laneMatches,
  toggleFilter,
} from './filter';
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

// A fixed "today" (a Wednesday) so the due filters do not depend on the clock.
const today = new Date('2026-10-07T12:00:00');
const dueCard = (due?: string, label = ''): KanbanCard => ({
  id: 'c',
  title: 'Task',
  label,
  due,
});

describe('qualifiers', () => {
  test('label: matches a whole label name, not a part of a title', () => {
    expect(cardMatchesQuery(card, 'label:red')).toBe(true);
    expect(cardMatchesQuery(card, 'label:BLUE')).toBe(true);
    expect(cardMatchesQuery(card, 'label:re')).toBe(false);
    expect(
      cardMatchesQuery(
        { ...card, label: undefined, title: 'red car' },
        'label:red'
      )
    ).toBe(false);
  });

  test('a quoted label can hold spaces', () => {
    const spaced = { ...card, label: 'high priority, red' };

    expect(cardMatchesQuery(spaced, 'label:"high priority"')).toBe(true);
    expect(cardMatchesQuery(spaced, 'label:"high"')).toBe(false);
  });

  test('several values of one qualifier match any of them', () => {
    expect(cardMatchesQuery(card, 'label:green label:blue')).toBe(true);
    expect(cardMatchesQuery(card, 'label:green label:pink')).toBe(false);
  });

  test('different qualifiers and free text must all match', () => {
    expect(cardMatchesQuery(card, 'passport label:red')).toBe(true);
    expect(cardMatchesQuery(card, 'taxes label:red')).toBe(false);
    expect(
      cardMatchesQuery(dueCard('2026-10-06', 'red'), 'label:red due:today', {
        today,
      })
    ).toBe(false);
  });

  test('due: classifies the date against today', () => {
    const at = (due: string, filter: string) =>
      cardMatchesQuery(dueCard(due), filter, { today });

    expect(at('2026-10-06', 'due:overdue')).toBe(true);
    expect(at('2026-10-07', 'due:overdue')).toBe(false);
    expect(at('2026-10-07', 'due:today')).toBe(true);
    expect(at('2026-10-08', 'due:today')).toBe(false);
    // This week is today and the next seven days.
    expect(at('2026-10-07', 'due:week')).toBe(true);
    expect(at('2026-10-14', 'due:week')).toBe(true);
    expect(at('2026-10-15', 'due:week')).toBe(false);
    expect(at('2026-10-06', 'due:week')).toBe(false);
  });

  test('a card without a usable due date never matches a due filter', () => {
    expect(cardMatchesQuery(dueCard(undefined), 'due:overdue', { today })).toBe(
      false
    );
    expect(cardMatchesQuery(dueCard('someday'), 'due:week', { today })).toBe(
      false
    );
  });

  test('an unknown or empty value is ignored while it is being typed', () => {
    expect(cardMatchesQuery(card, 'due:')).toBe(true);
    expect(cardMatchesQuery(card, 'due:soonish')).toBe(true);
    expect(cardMatchesQuery(card, 'label:')).toBe(true);
    expect(isFiltering('due:soonish')).toBe(false);
    expect(isFiltering('label:')).toBe(false);
    expect(isFiltering('label:red')).toBe(true);
  });

  test('the lane title only helps the free text, never a qualifier', () => {
    expect(cardMatchesQuery(card, 'doing', { laneTitle: 'Doing' })).toBe(true);
    expect(
      cardMatchesQuery(card, 'doing label:green', { laneTitle: 'Doing' })
    ).toBe(false);
    expect(
      cardMatchesQuery(card, 'doing label:red', { laneTitle: 'Doing' })
    ).toBe(true);
  });
});

describe('laneMatches', () => {
  const lane = { id: 'l', title: 'Doing', cards: [card] };
  const empty = { id: 'e', title: 'Doing', cards: [] };

  test('a lane whose title matches stays even when it has no cards', () => {
    expect(laneMatches(empty, 'doing')).toBe(true);
  });

  test('a qualifier hides a lane that has no matching card', () => {
    expect(laneMatches(lane, 'doing label:green')).toBe(false);
    expect(laneMatches(empty, 'doing label:red')).toBe(false);
    expect(laneMatches(lane, 'label:red')).toBe(true);
  });
});

describe('toggleFilter and hasFilter', () => {
  test('adds a qualifier to the query and removes it again', () => {
    const added = toggleFilter('passport', 'label', 'red');

    expect(added).toBe('passport label:red');
    expect(hasFilter(added, 'label', 'red')).toBe(true);
    expect(toggleFilter(added, 'label', 'red')).toBe('passport');
  });

  test('keeps the other qualifiers and compares names without case', () => {
    const query = 'label:Red due:overdue';

    expect(hasFilter(query, 'label', 'red')).toBe(true);
    expect(toggleFilter(query, 'label', 'red')).toBe('due:overdue');
    expect(toggleFilter(query, 'due', 'overdue')).toBe('label:Red');
  });

  test('quotes a name that has spaces', () => {
    const query = toggleFilter('', 'label', 'high priority');

    expect(query).toBe('label:"high priority"');
    expect(hasFilter(query, 'label', 'high priority')).toBe(true);
    expect(toggleFilter(query, 'label', 'high priority')).toBe('');
  });

  test('filterToken is a query on its own', () => {
    expect(filterToken('label', 'red')).toBe('label:red');
    expect(filterToken('label', 'high priority')).toBe('label:"high priority"');
  });
});
