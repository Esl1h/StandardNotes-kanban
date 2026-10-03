import { KanbanBoard } from '../../types/kanban';
import { parseMarkdown } from './parseMarkdown';
import { convertStateToMarkdown } from './convertStateToMarkdown';

test('reports the error and keeps parsing when a card appears before any lane', () => {
  const input = `* Stray card
# Lane 1
* Card 1`;
  const { boardData, parsingErrors } = parseMarkdown(input);

  expect(
    parsingErrors.some((e) => /before adding lanes/i.test(e.message))
  ).toBe(true);
  // The lane after the bad line must still be parsed out.
  expect(boardData.lanes).toHaveLength(1);
  expect(boardData.lanes[0].cards[0].title).toBe('Card 1');
});

test('reports the error and keeps parsing when a field appears before any card', () => {
  const input = `# Lane 1
  * Description: orphan field
* Card 1
  * Description: desc`;
  const { boardData, parsingErrors } = parseMarkdown(input);

  expect(
    parsingErrors.some((e) => /before adding a card/i.test(e.message))
  ).toBe(true);
  expect(boardData.lanes).toHaveLength(1);
  expect(boardData.lanes[0].cards[0].description).toBe('desc');
});

test('converts simple markdown file', () => {
  const input = `# Lane 1
* Card 1
  * Description: desc
  * Label: label`;
  const expectedResult: KanbanBoard = {
    lanes: [
      {
        title: 'Lane 1',
        cards: [{ title: 'Card 1', description: 'desc', label: 'label' }],
      },
    ],
  };
  const { boardData } = parseMarkdown(input);
  expect(boardData).toEqual(expectedResult);
});

test('parses due dates', () => {
  const input = `# Lane 1
* Card 1
  * Due: 2026-09-30`;
  const { boardData } = parseMarkdown(input);

  expect(boardData.lanes[0].cards[0].due).toBe('2026-09-30');
});

test('parses blockquoted lines as a multiline description', () => {
  const input = `# Lane 1
* Card 1
  * Description: first line
    > second line
    > third line`;
  const { boardData } = parseMarkdown(input);

  expect(boardData.lanes[0].cards[0].description).toBe(
    'first line\nsecond line\nthird line'
  );
});
test('reports the error and keeps parsing when a card appears before any lane', () => {
  const input = `* Stray card
# Lane 1
* Card 1`;
  const { boardData, parsingErrors } = parseMarkdown(input);

  expect(
    parsingErrors.some((e) => /before adding lanes/i.test(e.message))
  ).toBe(true);
  // The lane after the bad line must still be parsed out.
  expect(boardData.lanes).toHaveLength(1);
  expect(boardData.lanes[0].cards[0].title).toBe('Card 1');
});

test('reports the error and keeps parsing when a field appears before any card', () => {
  const input = `# Lane 1
  * Description: orphan field
* Card 1
  * Description: desc`;
  const { boardData, parsingErrors } = parseMarkdown(input);

  expect(
    parsingErrors.some((e) => /before adding a card/i.test(e.message))
  ).toBe(true);
  expect(boardData.lanes).toHaveLength(1);
  expect(boardData.lanes[0].cards[0].description).toBe('desc');
});

test('converts markdown with cards with comments', () => {
  const input = `# Lane 1
* Card 1
  * Description: desc
  * Label: label
  * Comments:
    * Comment 1
    * Comment 2
    * Comment 3
* Card 2
  * Description: desc 2
  * Label: label 2
  * Comments:
    * Comment 4
    * Comment 5

# Lane 2
* Card 3
  * Description: desc 3
  * Label: label 3
  * Comments:
    * Comment 6`;
  const expectedResult: KanbanBoard = {
    lanes: [
      {
        title: 'Lane 1',
        cards: [
          {
            title: 'Card 1',
            description: 'desc',
            label: 'label',
            comments: ['Comment 1', 'Comment 2', 'Comment 3'],
          },
          {
            title: 'Card 2',
            description: 'desc 2',
            label: 'label 2',
            comments: ['Comment 4', 'Comment 5'],
          },
        ],
      },
      {
        title: 'Lane 2',
        cards: [
          {
            title: 'Card 3',
            description: 'desc 3',
            label: 'label 3',
            comments: ['Comment 6'],
          },
        ],
      },
    ],
  };
  const { boardData } = parseMarkdown(input);
  expect(boardData).toEqual(expectedResult);
});

test('parses checklist items with done marks', () => {
  const input = `# Lane
* Card
  * Checklist:
    [x] finished item
    [ ] pending item
    [X] uppercase mark
  * Comments:
    * not part of the checklist`;
  const expectedResult: KanbanBoard = {
    lanes: [
      {
        title: 'Lane',
        cards: [
          {
            title: 'Card',
            checklist: [
              { done: true, text: 'finished item' },
              { done: false, text: 'pending item' },
              { done: true, text: 'uppercase mark' },
            ],
            comments: ['not part of the checklist'],
          },
        ],
      },
    ],
  };
  const { boardData, parsingErrors } = parseMarkdown(input);
  expect(boardData).toEqual(expectedResult);
  expect(parsingErrors.filter((e) => e.message)).toEqual([]);
});

describe('tolerant input', () => {
  const unreadable = (markdown: string) =>
    parseMarkdown(markdown).parsingErrors.filter((e) => e.message);

  test('reads tab-indented fields', () => {
    const input =
      '# Lane\n* Card\n\t* Description: desc\n\t* Due: 2026-01-01\n\t* Label: red';
    const { boardData } = parseMarkdown(input);

    expect(unreadable(input)).toEqual([]);
    expect(boardData.lanes[0].cards[0]).toMatchObject({
      description: 'desc',
      due: '2026-01-01',
      label: 'red',
    });
  });

  test('keeps tabs inside field values', () => {
    const { boardData } = parseMarkdown(
      '# Lane\n* Card\n  * Description: a\tb'
    );

    expect(boardData.lanes[0].cards[0].description).toBe('a\tb');
  });

  test('reads - and + as card bullets', () => {
    const input = '# Lane\n- first\n+ second\n  - Label: red';
    const { boardData } = parseMarkdown(input);

    expect(unreadable(input)).toEqual([]);
    expect(boardData.lanes[0].cards.map((c) => c.title)).toEqual([
      'first',
      'second',
    ]);
    expect(boardData.lanes[0].cards[1].label).toBe('red');
  });

  test('reads a field without a value', () => {
    const input = '# Lane\n* Card\n  * Description:\n  * Due:\n  * Label:';
    const { boardData } = parseMarkdown(input);

    expect(unreadable(input)).toEqual([]);
    expect(boardData.lanes[0].cards[0].extraLines).toBeUndefined();
  });

  test('reads ## as a lane', () => {
    const input = '## Lane\n* Card';
    const { boardData } = parseMarkdown(input);

    expect(unreadable(input)).toEqual([]);
    expect(boardData.lanes.map((l) => l.title)).toEqual(['Lane']);
  });

  test('reads fields indented with four spaces', () => {
    const input = `# Lane
* Card
    * Description: first
        > second
    * Due: 2026-01-01
    * Comments:
        * Due: tomorrow
    * Label: red`;
    const { boardData } = parseMarkdown(input);

    expect(unreadable(input)).toEqual([]);
    expect(boardData.lanes[0].cards[0]).toMatchObject({
      description: 'first\nsecond',
      due: '2026-01-01',
      label: 'red',
      comments: ['Due: tomorrow'],
    });
  });

  test('a comment that looks like a field stays a comment', () => {
    const input = `# Lane
* Card
\t* Comments:
\t\t* Due: tomorrow
\t\t* Label: not a label
\t* Due: 2026-01-01`;
    const { boardData } = parseMarkdown(input);

    expect(boardData.lanes[0].cards[0]).toMatchObject({
      comments: ['Due: tomorrow', 'Label: not a label'],
      due: '2026-01-01',
    });
  });

  test('keeps text after a Comments header instead of dropping it', () => {
    const { boardData } = parseMarkdown('# Lane\n* Card\n  * Comments: hello');

    expect(boardData.lanes[0].cards[0].extraLines).toEqual([
      '  * Comments: hello',
    ]);
  });

  test('reads a bare blockquote line as an empty continuation', () => {
    const input = '# Lane\n* Card\n  * Description: a\n    >\n    > b';
    const { boardData } = parseMarkdown(input);

    expect(boardData.lanes[0].cards[0].description).toBe('a\n\nb');
  });

  test('writes the canonical format back', () => {
    const messy = `## Lane [id:aaa111]
- Card [id:bbb222]
\t* Description: desc
\t* Due: 2026-01-01
\t* Comments:
\t\t* note
+ Other [id:ccc333]
    * Label: red
`;
    const canonical = `# Lane [id:aaa111]
* Card [id:bbb222]
  * Description: desc
  * Due: 2026-01-01
  * Comments:
    * note
* Other [id:ccc333]
  * Label: red
`;

    expect(convertStateToMarkdown(parseMarkdown(messy))).toBe(canonical);
    expect(convertStateToMarkdown(parseMarkdown(canonical))).toBe(canonical);
  });
});

describe('quadrant field', () => {
  test('reads the Eisenhower quadrant of a card', () => {
    const input = '# Lane\n* A\n  * Quadrant: do\n* B\n  * Quadrant: Eliminate';
    const { boardData, parsingErrors } = parseMarkdown(input);

    expect(parsingErrors).toEqual([]);
    expect(boardData.lanes[0].cards.map((c) => c.quadrant)).toEqual([
      'do',
      'eliminate',
    ]);
  });

  test('keeps an unknown quadrant as an unread line', () => {
    const { boardData, parsingErrors } = parseMarkdown(
      '# Lane\n* A\n  * Quadrant: someday'
    );

    expect(boardData.lanes[0].cards[0].quadrant).toBeUndefined();
    expect(boardData.lanes[0].cards[0].extraLines).toEqual([
      '  * Quadrant: someday',
    ]);
    expect(parsingErrors).toHaveLength(1);
  });

  test('writes the quadrant after the label', () => {
    const markdown = `# Lane
* Card
  * Label: red
  * Quadrant: schedule
  * Comments:
    * note
`;

    expect(convertStateToMarkdown(parseMarkdown(markdown))).toBe(markdown);
  });
});

describe('done lane marker', () => {
  test('reads [done] before the id as the done lane flag', () => {
    const { boardData } = parseMarkdown(
      '# Doing [id:aaa111]\n# Finished [done] [id:bbb222]\n# Shipped [DONE]'
    );

    expect(
      boardData.lanes.map((l) => [l.title, l.id, l.done ?? false])
    ).toEqual([
      ['Doing', 'aaa111', false],
      ['Finished', 'bbb222', true],
      ['Shipped', undefined, true],
    ]);
  });

  test('writes the marker between the title and the id', () => {
    const markdown = '# Finished [done] [id:bbb222]\n* Card [id:ccc333]\n';

    expect(convertStateToMarkdown(parseMarkdown(markdown))).toBe(markdown);
  });
});

describe('quadrant names', () => {
  test('reads custom quadrant names from the top of the note', () => {
    const { quadrantNames, preamble, parsingErrors } = parseMarkdown(
      'Quadrants: Fazer | Agendar | Delegar | Eliminar\n\n# Lane\n'
    );

    expect(quadrantNames).toEqual({
      do: 'Fazer',
      schedule: 'Agendar',
      delegate: 'Delegar',
      eliminate: 'Eliminar',
    });
    expect(preamble).toEqual([]);
    expect(parsingErrors).toEqual([]);
  });

  test('keeps a malformed names line as an unread line', () => {
    const { quadrantNames, preamble } = parseMarkdown(
      'Quadrants: Fazer | Agendar\n# Lane\n'
    );

    expect(quadrantNames).toBeUndefined();
    expect(preamble).toEqual(['Quadrants: Fazer | Agendar']);
  });

  test('is only read before the first lane', () => {
    const { quadrantNames, boardData } = parseMarkdown(
      '# Lane\nQuadrants: A | B | C | D\n'
    );

    expect(quadrantNames).toBeUndefined();
    expect(boardData.lanes[0].extraLines).toEqual(['Quadrants: A | B | C | D']);
  });

  test('writes custom names on top and leaves default names out', () => {
    const custom =
      'Quadrants: Fazer | Agendar | Delegar | Eliminar\n\n# Lane\n* Card\n';

    expect(convertStateToMarkdown(parseMarkdown(custom))).toBe(custom);
    expect(
      convertStateToMarkdown(
        parseMarkdown(
          'Quadrants: Do | Schedule | Delegate | Eliminate\n# Lane\n* Card\n'
        )
      )
    ).toBe('# Lane\n* Card\n');
  });
});
