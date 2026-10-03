import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { updateCard } from '../lib/boardOps';
import { DEFAULT_QUADRANT_NAMES, QuadrantNames } from '../lib/quadrants';

const initialBoard = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [
        { id: 'c1', title: 'Pay taxes', laneId: 'laneA', quadrant: 'do' },
        { id: 'c2', title: 'Read book', laneId: 'laneA' },
      ],
    },
    {
      id: 'laneB',
      title: 'Doing',
      cards: [
        {
          id: 'c3',
          title: 'Plan trip',
          laneId: 'laneB',
          quadrant: 'schedule',
        },
      ],
    },
    {
      id: 'laneC',
      title: 'Finished',
      done: true,
      cards: [
        { id: 'c4', title: 'Old chore', laneId: 'laneC', quadrant: 'do' },
      ],
    },
  ],
});

let renamed: QuadrantNames | undefined;

const Harness = ({ noteId = 'note-1' }: { noteId?: string }) => {
  const [board, setBoard] = useState(initialBoard());
  const [names, setNames] = useState(DEFAULT_QUADRANT_NAMES);
  return (
    <ModalProvider>
      <EditorInternal
        boardData={board}
        handleDataChange={(next) => setBoard(next as KanbanBoard)}
        onCardUpdate={(laneId, cardId, patch: Partial<KanbanCard>) =>
          setBoard((b) => updateCard(b, laneId, cardId, patch))
        }
        noteId={noteId}
        quadrantNames={names}
        onQuadrantNamesChange={(next) => {
          renamed = next;
          setNames(next);
        }}
      />
    </ModalProvider>
  );
};

beforeEach(() => {
  renamed = undefined;
  try {
    localStorage.clear();
  } catch {
    /* storage may be unavailable */
  }
});

const openMatrix = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Matrix' }));

const section = (name: string) =>
  screen.getByRole('region', { name }) as HTMLElement;

const titlesIn = (name: string) =>
  within(section(name))
    .queryAllByText(/./, { selector: '.kbn-card-title' })
    .map((el) => el.textContent);

test('the board view is the default', () => {
  render(<Harness />);

  expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.queryByRole('region', { name: 'Do' })).not.toBeInTheDocument();
});

test('the matrix groups open cards by quadrant', () => {
  render(<Harness />);

  openMatrix();

  expect(titlesIn('Unclassified')).toEqual(['Read book']);
  expect(titlesIn('Do')).toEqual(['Pay taxes']);
  expect(titlesIn('Schedule')).toEqual(['Plan trip']);
  expect(titlesIn('Delegate')).toEqual([]);
  expect(titlesIn('Eliminate')).toEqual([]);
});

test('each card shows the lane it is in', () => {
  render(<Harness />);
  openMatrix();

  expect(
    within(section('Schedule')).getByText('Doing', {
      selector: '.kbn-card-lane',
    })
  ).toBeInTheDocument();
});

test('finished cards appear only with the Done toggle on', () => {
  render(<Harness />);
  openMatrix();
  expect(titlesIn('Do')).toEqual(['Pay taxes']);

  fireEvent.click(screen.getByRole('button', { name: 'Done (1)' }));

  expect(titlesIn('Do')).toEqual(['Pay taxes', 'Old chore']);
  expect(
    within(section('Do')).getByText('Old chore').closest('.kbn-card')
  ).toHaveClass('kbn-card-finished');
});

test('completing a card moves it to the done lane', () => {
  render(<Harness />);
  openMatrix();

  fireEvent.click(screen.getByLabelText('Complete card Pay taxes'));

  expect(titlesIn('Do')).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Done (2)' }));
  const card = within(section('Do'))
    .getByText('Pay taxes')
    .closest('.kbn-card') as HTMLElement;
  expect(card).toHaveClass('kbn-card-finished');
  expect(within(card).getByText('Finished')).toHaveClass('kbn-card-lane');
});

test('the card modal sets the quadrant', () => {
  render(<Harness />);
  openMatrix();
  fireEvent.click(screen.getByText('Read book'));
  const dialog = screen.getByRole('dialog');

  fireEvent.change(within(dialog).getByLabelText('Quadrant'), {
    target: { value: 'delegate' },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save and close' })
  );

  expect(titlesIn('Delegate')).toEqual(['Read book']);
  expect(titlesIn('Unclassified')).toEqual([]);
});

test('a quadrant can be renamed', () => {
  render(<Harness />);
  openMatrix();

  fireEvent.click(screen.getByRole('button', { name: 'Rename quadrant Do' }));
  const input = screen.getByLabelText('Quadrant name');
  fireEvent.change(input, { target: { value: 'Fazer' } });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(renamed).toEqual({ ...DEFAULT_QUADRANT_NAMES, do: 'Fazer' });
  expect(titlesIn('Fazer')).toEqual(['Pay taxes']);
});

test('a quadrant name cannot hold the | separator', () => {
  render(<Harness />);
  openMatrix();

  fireEvent.click(screen.getByRole('button', { name: 'Rename quadrant Do' }));
  const input = screen.getByLabelText('Quadrant name');
  fireEvent.change(input, { target: { value: 'Now | here' } });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(renamed?.do).toBe('Now / here');
});

test('search filters the matrix too', () => {
  render(<Harness />);
  openMatrix();

  fireEvent.change(screen.getByLabelText('Search cards'), {
    target: { value: 'trip' },
  });

  expect(titlesIn('Do')).toEqual([]);
  expect(titlesIn('Schedule')).toEqual(['Plan trip']);
  expect(titlesIn('Unclassified')).toEqual([]);
});

test('the chosen view is remembered per note', () => {
  const { unmount } = render(<Harness noteId="note-1" />);
  openMatrix();
  unmount();

  render(<Harness noteId="note-1" />);
  expect(screen.getByRole('region', { name: 'Do' })).toBeInTheDocument();
});

test('another note opens in its own view', () => {
  const { unmount } = render(<Harness noteId="note-1" />);
  openMatrix();
  unmount();

  render(<Harness noteId="note-2" />);
  expect(screen.queryByRole('region', { name: 'Do' })).not.toBeInTheDocument();
});
