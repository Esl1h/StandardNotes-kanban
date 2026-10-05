import { KanbanCard, KanbanLane } from '../../types/kanban';
import { daysUntil, labelChips } from './labels';

/**
 * Card search: free text matches title, description and labels, and the
 * qualifiers `label:name` (a whole label, quoted when it has spaces) and
 * `due:overdue|today|week` narrow it down. Several values of one qualifier
 * match any of them; free text and the different qualifiers must all match.
 * The filter buttons of the toolbar are shortcuts that write the same
 * qualifiers into the search box.
 */

export type FilterKey = 'label' | 'due';
export const DUE_FILTERS = ['overdue', 'today', 'week'] as const;
export type DueFilter = (typeof DUE_FILTERS)[number];

export interface FilterOptions {
  /** The lane the card is in: its title can match the free text too. */
  laneTitle?: string;
  /** What "today" is, for the due filters; the clock when omitted. */
  today?: Date;
}

interface ParsedQuery {
  text: string;
  labels: string[];
  due: DueFilter[];
}

// `key:value`, the value being a quoted phrase or a run of non spaces.
const QUALIFIER = /(^|\s)(label|due):("([^"]*)"|\S*)/gi;

const isDueFilter = (value: string): value is DueFilter =>
  (DUE_FILTERS as readonly string[]).includes(value);

// An empty or unknown value is dropped: it is still being typed.
const parseQuery = (query: string): ParsedQuery => {
  const labels: string[] = [];
  const due: DueFilter[] = [];
  const text = query
    .replace(
      QUALIFIER,
      (_match, _lead, key: string, raw: string, quoted?: string) => {
        const value = (quoted ?? raw).trim().toLowerCase();
        if (key.toLowerCase() === 'label') {
          if (value) {
            labels.push(value);
          }
        } else if (isDueFilter(value)) {
          due.push(value);
        }
        return ' ';
      }
    )
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return { text, labels, due };
};

const matchesDue = (filter: DueFilter, days: number): boolean => {
  if (filter === 'overdue') {
    return days < 0;
  }
  if (filter === 'today') {
    return days === 0;
  }
  // This week: today and the next seven days.
  return days >= 0 && days <= 7;
};

export const cardMatchesQuery = (
  card: KanbanCard,
  query: string,
  options: FilterOptions = {}
): boolean => {
  const { text, labels, due } = parseQuery(query);
  if (labels.length > 0) {
    const names = labelChips(card.label).map((chip) => chip.name.toLowerCase());
    if (!labels.some((label) => names.includes(label))) {
      return false;
    }
  }
  if (due.length > 0) {
    const days = daysUntil(card.due, options.today);
    if (days === null || !due.some((filter) => matchesDue(filter, days))) {
      return false;
    }
  }
  if (!text) {
    return true;
  }
  return (
    card.title.toLowerCase().includes(text) ||
    (card.description || '').toLowerCase().includes(text) ||
    (card.label || '').toLowerCase().includes(text) ||
    (options.laneTitle ?? '').toLowerCase().includes(text)
  );
};

/**
 * Whether a lane stays on the board while filtering. A lane whose title
 * matches the free text stays even when empty, unless a qualifier is set:
 * then only the lanes with a matching card stay.
 */
export const laneMatches = (
  lane: KanbanLane,
  query: string,
  options: Pick<FilterOptions, 'today'> = {}
): boolean => {
  const { text, labels, due } = parseQuery(query);
  if (!text && labels.length === 0 && due.length === 0) {
    return true;
  }
  if (
    labels.length === 0 &&
    due.length === 0 &&
    lane.title.toLowerCase().includes(text)
  ) {
    return true;
  }
  return lane.cards.some((card) =>
    cardMatchesQuery(card, query, { ...options, laneTitle: lane.title })
  );
};

export const isFiltering = (query: string): boolean => {
  const { text, labels, due } = parseQuery(query);
  return text.length > 0 || labels.length > 0 || due.length > 0;
};

/** A query made of one qualifier, as a clickable chip puts in the box. */
export const filterToken = (key: FilterKey, value: string): string =>
  `${key}:${/\s/.test(value) ? `"${value}"` : value}`;

const sameQualifier = (
  key: FilterKey,
  value: string,
  matchedKey: string,
  raw: string,
  quoted?: string
): boolean =>
  matchedKey.toLowerCase() === key &&
  (quoted ?? raw).trim().toLowerCase() === value.trim().toLowerCase();

export const hasFilter = (
  query: string,
  key: FilterKey,
  value: string
): boolean => {
  let found = false;
  query.replace(
    QUALIFIER,
    (match, _lead, k: string, raw: string, quoted?: string) => {
      found = found || sameQualifier(key, value, k, raw, quoted);
      return match;
    }
  );
  return found;
};

/** Adds the qualifier to the query, or takes it out when it is there. */
export const toggleFilter = (
  query: string,
  key: FilterKey,
  value: string
): string => {
  if (!hasFilter(query, key, value)) {
    return `${query.trim()} ${filterToken(key, value)}`.trim();
  }
  return query
    .replace(
      QUALIFIER,
      (match, lead: string, k: string, raw: string, quoted?: string) =>
        sameQualifier(key, value, k, raw, quoted) ? lead : match
    )
    .replace(/\s{2,}/g, ' ')
    .trim();
};
