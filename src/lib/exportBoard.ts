import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { QuadrantNames } from './quadrants';

/**
 * The whole board as JSON: every lane, the done one included, and every
 * field a card has. Ids are left out, since they only exist to make the
 * board draggable.
 */
export const toJson = (board: KanbanBoard): string => {
  const card = (c: KanbanCard) => ({
    title: c.title,
    ...(c.description && { description: c.description }),
    ...(c.label && { label: c.label }),
    ...(c.due && { due: c.due }),
    ...(c.quadrant && { quadrant: c.quadrant }),
    ...(c.checklist?.length && {
      checklist: c.checklist.map(({ done, text }) => ({ done, text })),
    }),
    ...(c.comments?.length && { comments: c.comments }),
  });
  return JSON.stringify(
    {
      lanes: board.lanes.map((lane) => ({
        title: lane.title,
        done: !!lane.done,
        cards: lane.cards.map(card),
      })),
    },
    null,
    2
  );
};

// A cell a spreadsheet would run as a formula is written as text instead.
const FORMULA_START = /^[=+\-@]/;

const cell = (value: string): string => {
  const text = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** One row per card: lane, card, label, due, quadrant and checklist x/y. */
export const toCsv = (
  board: KanbanBoard,
  quadrantNames: QuadrantNames
): string => {
  const rows = board.lanes.flatMap((lane) =>
    lane.cards.map((card) => {
      const checklist = card.checklist ?? [];
      return [
        lane.title,
        card.title,
        card.label ?? '',
        card.due ?? '',
        card.quadrant ? quadrantNames[card.quadrant] : '',
        checklist.length > 0
          ? `${checklist.filter((item) => item.done).length}/${checklist.length}`
          : '',
      ]
        .map(cell)
        .join(',');
    })
  );
  return `${['lane,card,label,due,quadrant,checklist', ...rows].join('\n')}\n`;
};
