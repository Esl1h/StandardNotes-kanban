import {
  addCardToLane,
  addLane,
  moveCard,
  moveLane,
  removeCard,
  removeLane,
  renameLane,
  updateCard,
  setDoneLane,
  completeCard,
  clearDoneCards,
  setCardQuadrant,
} from './boardOps';
import { KanbanBoard } from '../../types/kanban';

const board: KanbanBoard = {
  lanes: [
    {
      id: 'lane-1',
      title: 'To Do',
      cards: [
        { id: 'card-1', title: 'Card 1', laneId: 'lane-1' },
        { id: 'card-2', title: 'Card 2', laneId: 'lane-1' },
      ],
    },
    {
      id: 'lane-2',
      title: 'Done',
      cards: [{ id: 'card-3', title: 'Card 3', laneId: 'lane-2' }],
    },
  ],
};

test('adds a lane with an id', () => {
  const next = addLane(board, 'Backlog');
  expect(next.lanes).toHaveLength(3);
  expect(next.lanes[2].title).toBe('Backlog');
  expect(next.lanes[2].id).toBeDefined();
  expect(next.lanes[2].cards).toEqual([]);
});

test('renames a lane without touching the others', () => {
  const next = renameLane(board, 'lane-2', 'Finished');
  expect(next.lanes[1].title).toBe('Finished');
  expect(next.lanes[0].title).toBe('To Do');
});

test('removes a lane', () => {
  const next = removeLane(board, 'lane-1');
  expect(next.lanes.map((l) => l.id)).toEqual(['lane-2']);
});

test('adds a card to the end of a lane', () => {
  const next = addCardToLane(board, 'lane-2', 'Card 4');
  expect(next.lanes[1].cards).toHaveLength(2);
  expect(next.lanes[1].cards[1].title).toBe('Card 4');
  expect(next.lanes[1].cards[1].laneId).toBe('lane-2');
  expect(next.lanes[1].cards[1].id).toBeDefined();
});

test('updates a card through a patch', () => {
  const next = updateCard(board, 'lane-1', 'card-1', {
    description: 'updated',
  });
  expect(next.lanes[0].cards[0].description).toBe('updated');
  expect(next.lanes[0].cards[1].description).toBeUndefined();
});

test('removes a card', () => {
  const next = removeCard(board, 'lane-1', 'card-1');
  expect(next.lanes[0].cards.map((c) => c.id)).toEqual(['card-2']);
});

test('reorders a lane', () => {
  const next = moveLane(board, 0, 1);
  expect(next.lanes.map((l) => l.id)).toEqual(['lane-2', 'lane-1']);
});

test('moves a card down inside the same lane', () => {
  const next = moveCard(board, 'lane-1', 0, 'lane-1', 1);
  expect(next.lanes[0].cards.map((c) => c.id)).toEqual(['card-2', 'card-1']);
});

test('moves a card to another lane and updates its laneId', () => {
  const next = moveCard(board, 'lane-1', 0, 'lane-2', 1);
  expect(next.lanes[1].cards.map((c) => c.id)).toEqual(['card-3', 'card-1']);
  expect(next.lanes[1].cards[1].laneId).toBe('lane-2');
  expect(next.lanes[0].cards.map((c) => c.id)).toEqual(['card-2']);
});

test('keeps the board unchanged for unknown lanes or cards', () => {
  expect(moveCard(board, 'nope', 0, 'lane-2', 0)).toBe(board);
  expect(moveCard(board, 'lane-1', 9, 'lane-2', 0)).toBe(board);
});

describe('done lane', () => {
  const board = (): KanbanBoard => ({
    lanes: [
      {
        id: 'a',
        title: 'Todo',
        cards: [{ id: 'c1', title: 'One', laneId: 'a' }],
      },
      {
        id: 'b',
        title: 'Done',
        cards: [{ id: 'c2', title: 'Two', laneId: 'b' }],
      },
      { id: 'c', title: 'Shipped', cards: [], done: true },
    ],
  });

  test('marking a lane as done unmarks any other', () => {
    const next = setDoneLane(board(), 'b');

    expect(next.lanes.map((l) => l.done ?? false)).toEqual([
      false,
      true,
      false,
    ]);
  });

  test('can clear the done lane', () => {
    expect(setDoneLane(board(), null).lanes.some((lane) => lane.done)).toBe(
      false
    );
  });

  test('completing a card moves it to the end of the done lane', () => {
    const next = completeCard(board(), 'a', 'c1');

    expect(next.lanes[0].cards).toEqual([]);
    expect(next.lanes[2].cards.map((c) => [c.id, c.laneId])).toEqual([
      ['c1', 'c'],
    ]);
  });

  test('completing does nothing without a done lane', () => {
    const plain = setDoneLane(board(), null);

    expect(completeCard(plain, 'a', 'c1')).toBe(plain);
  });

  test('clearing the done lane removes its cards and keeps the lane', () => {
    const finished = completeCard(board(), 'a', 'c1');

    const next = clearDoneCards(finished);

    expect(next.lanes.map((l) => [l.id, l.cards.length])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 0],
    ]);
    expect(next.lanes[2].done).toBe(true);
  });

  test('clearing leaves the other lanes untouched', () => {
    const finished = completeCard(board(), 'a', 'c1');

    const next = clearDoneCards(finished);

    expect(next.lanes[1]).toBe(finished.lanes[1]);
  });

  test('clearing with nothing finished returns the same board', () => {
    const plain = board();

    expect(clearDoneCards(plain)).toBe(plain);
    expect(clearDoneCards(setDoneLane(plain, null))).toEqual(
      setDoneLane(plain, null)
    );
  });
});

describe('setCardQuadrant', () => {
  const board = (): KanbanBoard => ({
    lanes: [
      { id: 'a', title: 'A', cards: [{ id: 'c1', title: 'One', laneId: 'a' }] },
      {
        id: 'b',
        title: 'B',
        cards: [{ id: 'c2', title: 'Two', laneId: 'b', quadrant: 'do' }],
      },
    ],
  });

  test('sets the quadrant of a card wherever its lane is', () => {
    const next = setCardQuadrant(board(), 'c1', 'schedule');

    expect(next.lanes[0].cards[0].quadrant).toBe('schedule');
  });

  test('clears the quadrant', () => {
    const next = setCardQuadrant(board(), 'c2', undefined);

    expect(next.lanes[1].cards[0].quadrant).toBeUndefined();
  });

  test('returns the board unchanged for an unknown card', () => {
    const b = board();

    expect(setCardQuadrant(b, 'nope', 'do')).toBe(b);
  });
});
