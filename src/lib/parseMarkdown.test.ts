import { KanbanBoard } from '../../types/kanban';
import { parseMarkdown } from './parseMarkdown';

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

test('reports the error and keeps parsing when a card appears before any lane', () => {
  const input = `* Stray card
# Lane 1
* Card 1`;
  const { boardData, parsingErrors } = parseMarkdown(input);

  expect(parsingErrors.some((e) => /before adding lanes/i.test(e.message))).toBe(
    true
  );
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
