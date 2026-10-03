import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { KanbanBoard } from '../../types/kanban';

const initialBoard = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [{ id: 'c1', title: 'Open task', laneId: 'laneA' }],
    },
    {
      id: 'laneB',
      title: 'Finished',
      cards: [
        { id: 'c2', title: 'Closed one', laneId: 'laneB' },
        { id: 'c3', title: 'Closed two', laneId: 'laneB' },
      ],
    },
    { id: 'laneC', title: 'Later', cards: [] },
  ],
});

const Harness = () => {
  const [board, setBoard] = useState(initialBoard());
  return (
    <ModalProvider>
      <EditorInternal
        boardData={board}
        handleDataChange={(next) => setBoard(next as KanbanBoard)}
        onCardUpdate={() => {}}
      />
    </ModalProvider>
  );
};

const laneTitles = () =>
  Array.from(document.querySelectorAll('.kbn-lane-title')).map(
    (el) => el.textContent
  );

const markDone = (title: string) =>
  fireEvent.click(screen.getByLabelText(`Mark lane ${title} as done`));

test('there is no done toggle until a lane is marked as done', () => {
  render(<Harness />);

  expect(
    screen.queryByRole('button', { name: /Done \(/ })
  ).not.toBeInTheDocument();
});

test('the done lane is hidden and counted in the toolbar', () => {
  render(<Harness />);

  markDone('Finished');

  expect(laneTitles()).toEqual(['Todo', 'Later']);
  expect(screen.getByRole('button', { name: 'Done (2)' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('the toolbar button shows and hides the done lane', () => {
  render(<Harness />);
  markDone('Finished');

  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));
  expect(laneTitles()).toEqual(['Todo', 'Finished', 'Later']);
  expect(screen.getByText('Closed one')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));
  expect(laneTitles()).toEqual(['Todo', 'Later']);
});

test('marking another lane moves the done flag to it', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

  markDone('Later');

  expect(screen.getByRole('button', { name: 'Done (0)' })).toBeInTheDocument();
  expect(laneTitles()).toEqual(['Todo', 'Finished', 'Later']);
});

test('a done lane can be unmarked', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

  fireEvent.click(screen.getByLabelText('Unmark done lane Finished'));

  expect(
    screen.queryByRole('button', { name: /Done \(/ })
  ).not.toBeInTheDocument();
  expect(laneTitles()).toEqual(['Todo', 'Finished', 'Later']);
});

test('Alt+Right skips the hidden done lane', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByText('Open task'));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', keyCode: 27 });

  fireEvent.keyDown(document, { key: 'ArrowRight', altKey: true });

  expect(
    screen
      .getByText('Open task')
      .closest('.kbn-lane')!
      .querySelector('.kbn-lane-title')!.textContent
  ).toBe('Later');
});
