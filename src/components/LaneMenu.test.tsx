import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { KanbanBoard } from '../../types/kanban';

const initialBoard = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [
        { id: 'c1', title: 'One', laneId: 'laneA' },
        { id: 'c2', title: 'Two', laneId: 'laneA' },
      ],
    },
    { id: 'laneB', title: 'Shipped', cards: [], done: true },
    { id: 'laneC', title: 'Empty', cards: [] },
  ],
});

const Harness = ({ board = initialBoard() }: { board?: KanbanBoard }) => {
  const [data, setData] = useState(board);
  return (
    <ModalProvider>
      <EditorInternal
        boardData={data}
        handleDataChange={(next) => setData(next as KanbanBoard)}
        onCardUpdate={() => {}}
        onUndo={() => setData(board)}
      />
    </ModalProvider>
  );
};

const openMenu = (title: string) =>
  fireEvent.click(screen.getByLabelText(`Lane actions ${title}`));

const items = () =>
  screen.queryAllByRole('menuitem').map((item) => item.textContent);

const cardsIn = (title: string) =>
  Array.from(
    screen
      .getByText(title, { selector: '.kbn-lane-title' })
      .closest('.kbn-lane')!
      .querySelectorAll('.kbn-card-title-btn')
  ).map((el) => el.textContent);

test('the menu offers the lane actions that apply', () => {
  render(<Harness />);

  openMenu('Todo');
  expect(items()).toEqual([
    'Mark as done',
    'Complete all cards',
    'Delete all cards',
    'Delete lane',
  ]);

  openMenu('Todo');
  openMenu('Empty');
  expect(items()).toEqual(['Mark as done', 'Delete lane']);
});

test('the menu closes on Escape and on a click outside', () => {
  render(<Harness />);

  openMenu('Todo');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(items()).toEqual([]);

  openMenu('Todo');
  fireEvent.mouseDown(document.body);
  expect(items()).toEqual([]);
});

test('Complete all cards moves them to the done lane, with an undo', () => {
  render(<Harness />);

  openMenu('Todo');
  fireEvent.click(screen.getByRole('menuitem', { name: 'Complete all cards' }));

  expect(cardsIn('Todo')).toEqual([]);
  expect(screen.getByRole('button', { name: 'Done (2)' })).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('2 cards completed');

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(cardsIn('Todo')).toEqual(['One', 'Two']);
});

test('with several done lanes the menu asks which one', () => {
  const board = initialBoard();
  board.lanes[2].done = true;
  render(<Harness board={board} />);

  openMenu('Todo');
  expect(items()).toEqual([
    'Mark as done',
    'Complete all cards in Shipped',
    'Complete all cards in Empty',
    'Delete all cards',
    'Delete lane',
  ]);

  fireEvent.click(
    screen.getByRole('menuitem', { name: 'Complete all cards in Empty' })
  );
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));
  expect(cardsIn('Empty')).toEqual(['One', 'Two']);
  expect(cardsIn('Shipped')).toEqual([]);
});

test('Delete all cards empties the lane and keeps it, with an undo', () => {
  render(<Harness />);

  openMenu('Todo');
  fireEvent.click(screen.getByRole('menuitem', { name: 'Delete all cards' }));

  expect(cardsIn('Todo')).toEqual([]);
  expect(screen.getByRole('status')).toHaveTextContent(
    '2 cards removed from "Todo"'
  );

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(cardsIn('Todo')).toEqual(['One', 'Two']);
});

test('a done lane shows its mark and is not offered to complete into', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Done (0)' }));
  const shipped = screen
    .getByText('Shipped', { selector: '.kbn-lane-title' })
    .closest('.kbn-lane') as HTMLElement;

  expect(
    within(shipped).getByTitle('Done lane: its cards count as finished')
  ).toBeInTheDocument();
  openMenu('Shipped');
  expect(items()).toEqual(['Unmark as done', 'Delete lane']);
});
