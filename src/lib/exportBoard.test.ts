import { KanbanBoard } from '../../types/kanban';
import { DEFAULT_QUADRANT_NAMES } from './quadrants';
import { toCsv, toJson } from './exportBoard';

const board = (): KanbanBoard => ({
  lanes: [
    {
      id: 'l1',
      title: 'To do',
      cards: [
        {
          id: 'c1',
          title: 'Renew passport',
          description: 'Bring documents\nand photos',
          label: 'red, urgent',
          due: '2026-10-15',
          quadrant: 'do',
          checklist: [
            { done: true, text: 'photos' },
            { done: false, text: 'form' },
            { done: true, text: 'fee' },
          ],
          comments: ['called the office'],
        },
        { id: 'c2', title: 'Buy milk' },
      ],
    },
    {
      id: 'l2',
      title: 'Archive',
      done: true,
      cards: [{ id: 'c3', title: 'Old chore', quadrant: 'eliminate' }],
    },
  ],
});

describe('toJson', () => {
  test('holds every lane, card and field of the board', () => {
    const parsed = JSON.parse(toJson(board()));

    expect(parsed.lanes.map((l: { title: string }) => l.title)).toEqual([
      'To do',
      'Archive',
    ]);
    expect(parsed.lanes[1].done).toBe(true);
    expect(parsed.lanes[0].done).toBe(false);
    expect(parsed.lanes[0].cards[0]).toEqual({
      title: 'Renew passport',
      description: 'Bring documents\nand photos',
      label: 'red, urgent',
      due: '2026-10-15',
      quadrant: 'do',
      checklist: [
        { done: true, text: 'photos' },
        { done: false, text: 'form' },
        { done: true, text: 'fee' },
      ],
      comments: ['called the office'],
    });
  });

  test('leaves out the ids and the fields a card does not have', () => {
    const parsed = JSON.parse(toJson(board()));

    expect(parsed.lanes[0].id).toBeUndefined();
    expect(parsed.lanes[0].cards[1]).toEqual({ title: 'Buy milk' });
  });

  test('is indented for reading', () => {
    expect(toJson(board())).toContain('\n  "lanes": [\n');
  });
});

describe('toCsv', () => {
  const rows = (csv: string) => csv.trimEnd().split('\n');

  test('has a header and a row per card, done lane included', () => {
    const lines = rows(toCsv(board(), DEFAULT_QUADRANT_NAMES));

    expect(lines[0]).toBe('lane,card,label,due,quadrant,checklist');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe(
      'To do,Renew passport,"red, urgent",2026-10-15,Do,2/3'
    );
    expect(lines[2]).toBe('To do,Buy milk,,,,');
    expect(lines[3]).toBe('Archive,Old chore,,,Eliminate,');
  });

  test('writes the quadrant by its current name', () => {
    const csv = toCsv(board(), { ...DEFAULT_QUADRANT_NAMES, do: 'Now' });

    expect(rows(csv)[1]).toContain(',Now,');
  });

  test('quotes commas, quotes and line breaks', () => {
    const csv = toCsv(
      {
        lanes: [
          {
            title: 'A, B',
            cards: [{ title: 'say "hi"\nthere' }],
          },
        ],
      },
      DEFAULT_QUADRANT_NAMES
    );

    expect(csv).toBe(
      'lane,card,label,due,quadrant,checklist\n"A, B","say ""hi""\nthere",,,,\n'
    );
  });

  test('keeps a spreadsheet from running a title as a formula', () => {
    const csv = toCsv(
      {
        lanes: [
          {
            title: 'L',
            cards: [
              { title: '=SUM(A1)' },
              { title: '+1' },
              { title: '@cmd' },
              { title: '-5' },
            ],
          },
        ],
      },
      DEFAULT_QUADRANT_NAMES
    );

    expect(rows(csv).slice(1)).toEqual([
      "L,'=SUM(A1),,,,",
      "L,'+1,,,,",
      "L,'@cmd,,,,",
      "L,'-5,,,,",
    ]);
  });

  test('an empty board is just the header', () => {
    expect(toCsv({ lanes: [] }, DEFAULT_QUADRANT_NAMES)).toBe(
      'lane,card,label,due,quadrant,checklist\n'
    );
  });
});
