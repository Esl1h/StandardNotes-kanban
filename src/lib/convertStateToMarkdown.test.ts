import { convertStateToMarkdown } from './convertStateToMarkdown';
import { parseMarkdown } from './parseMarkdown';
import { KanbanBoard } from '../../types/kanban';
import boardWithComments from '../mocks/boardWithComments';
import simpleBoard from '../mocks/simpleBoard';
import fs from 'fs/promises';

const defaultState = {
  parsingErrors: [],
};

test('converts simple board data', async () => {
  const boardData = simpleBoard;
  const simpleBoardMarkdown = await fs.readFile(
    './src/mocks/simpleBoard.markdown',
    'utf8'
  );
  const expectedOutput = simpleBoardMarkdown.trim();
  const result = convertStateToMarkdown({ ...defaultState, boardData });
  expect(result.trim()).toEqual(expectedOutput);
});

test('converts JSON with cards with comments', async () => {
  const boardData: KanbanBoard = boardWithComments;
  const boardWithCommentsMarkdown = await fs.readFile(
    './src/mocks/boardWithComments.markdown',
    'utf8'
  );
  const expectedResult = boardWithCommentsMarkdown.trim();
  const result = convertStateToMarkdown({ ...defaultState, boardData });
  expect(result.trim()).toEqual(expectedResult);
});

test('writes due dates after descriptions', () => {
  const boardData: KanbanBoard = {
    lanes: [
      {
        title: 'Lane',
        cards: [{ title: 'Card', description: 'desc', due: '2026-12-31' }],
      },
    ],
  };
  const result = convertStateToMarkdown({ ...defaultState, boardData });
  expect(result.trim()).toBe(
    `# Lane
* Card
  * Description: desc
  * Due: 2026-12-31`
  );
});

test('writes multiline descriptions as blockquote continuations', () => {
  const boardData: KanbanBoard = {
    lanes: [
      {
        title: 'Lane',
        cards: [{ title: 'Card', description: 'first\nsecond\nthird' }],
      },
    ],
  };
  const result = convertStateToMarkdown({ ...defaultState, boardData });
  expect(result.trim()).toBe(
    `# Lane
* Card
  * Description: first
    > second
    > third`
  );
});

test('converts done checklist items with x marks', () => {
  const boardData: KanbanBoard = {
    lanes: [
      {
        title: 'Lane',
        cards: [
          {
            title: 'Card',
            checklist: [
              { done: true, text: 'finished item' },
              { done: false, text: 'pending item' },
            ],
          },
        ],
      },
    ],
  };
  const result = convertStateToMarkdown({ ...defaultState, boardData });
  expect(result.trim()).toBe(
    `# Lane
* Card
  * Checklist:
    [x] finished item
    [ ] pending item`
  );
});

test('round-trips metadata through markdown without loss', () => {
  const markdown = `# Lane
* Card 1
  * Description: first
    > second
  * Due: 2026-12-31
  * Label: red, blue
  * Checklist:
    [x] finished item
    [ ] pending item
  * Comments:
    * a comment
* Card 2
  * Description: second card`;

  const parsed = parseMarkdown(markdown);
  const converted = convertStateToMarkdown({
    ...defaultState,
    boardData: parsed.boardData,
  });
  const reparsed = parseMarkdown(converted);

  expect(converted.trim()).toBe(markdown);
  expect(reparsed.boardData).toEqual(parsed.boardData);
});
