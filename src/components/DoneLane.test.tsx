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

const laneAction = (title: string, action: string) => {
  fireEvent.click(screen.getByLabelText(`Lane actions ${title}`));
  fireEvent.click(screen.getByRole('menuitem', { name: action }));
};

const markDone = (title: string) => laneAction(title, 'Mark as done');

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

test('cards in the shown done lane render as finished on the board', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

  expect(screen.getByText('Closed one').closest('.kbn-card')).toHaveClass(
    'kbn-card-finished'
  );
  // Gray, struck-through text comes with the class; see the
  // .kbn-card-finished rules in Editor.css.
  expect(screen.getByText('Open task').closest('.kbn-card')).not.toHaveClass(
    'kbn-card-finished'
  );
});

test('the finished strike rule still matches the rendered title', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

  // Guards the CSS selector against markup drift: the title became a
  // button with inline rename and the strike silently stopped matching.
  const struck = document.querySelector(
    '.kbn-card-finished .kbn-card-title, .kbn-card-finished .kbn-card-title-btn'
  );
  expect(struck).toBe(screen.getByText('Closed one'));
});

test('several lanes can be done lanes at once', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

  markDone('Later');
  expect(screen.getByRole('button', { name: 'Done (2)' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));
  expect(laneTitles()).toEqual(['Todo']);
});

test('a done lane can be unmarked', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));

  laneAction('Finished', 'Unmark as done');

  expect(
    screen.queryByRole('button', { name: /Done \(/ })
  ).not.toBeInTheDocument();
  expect(laneTitles()).toEqual(['Todo', 'Finished', 'Later']);
});

test('Alt+Right skips the hidden done lane', () => {
  render(<Harness />);
  markDone('Finished');
  fireEvent.click(screen.getByText('Open task').closest('.kbn-card'));
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', keyCode: 27 });

  fireEvent.keyDown(document, { key: 'ArrowRight', altKey: true });

  expect(
    screen
      .getByText('Open task')
      .closest('.kbn-lane')!
      .querySelector('.kbn-lane-title')!.textContent
  ).toBe('Later');
});
