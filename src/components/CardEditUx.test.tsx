import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { KanbanBoard } from '../../types/kanban';
import { updateCard } from '../lib/boardOps';
import { isoDate } from '../lib/labels';

const initialBoard = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [
        {
          id: 'c1',
          title: 'Write docs',
          laneId: 'laneA',
          checklist: [
            { done: true, text: 'outline' },
            { done: false, text: 'draft' },
          ],
          comments: ['first note'],
        },
      ],
    },
  ],
});

// EditorInternal is controlled; the harness applies changes like the
// Editor does so renames and new cards show up on the board.
const Harness = () => {
  const [board, setBoard] = useState(initialBoard());
  return (
    <ModalProvider>
      <EditorInternal
        boardData={board}
        handleDataChange={(next) => setBoard(next as KanbanBoard)}
        onCardUpdate={(laneId, cardId, patch) =>
          setBoard((current) => updateCard(current, laneId, cardId, patch))
        }
      />
    </ModalProvider>
  );
};

const openCard = (title: string) => {
  // The card title is the inline-rename button; the card body opens
  // the modal.
  fireEvent.click(screen.getByText(title).closest('.kbn-card')!);
  return screen.getByRole('dialog');
};

describe('due shortcuts', () => {
  test('fill the date field without typing', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByLabelText('Set due date to tomorrow'));

    expect(
      (within(dialog).getByLabelText('Due') as HTMLInputElement).value
    ).toBe(isoDate(1));
  });

  test('today and next week work the same way', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByLabelText('Set due date to today'));
    expect(
      (within(dialog).getByLabelText('Due') as HTMLInputElement).value
    ).toBe(isoDate(0));

    fireEvent.click(within(dialog).getByLabelText('Set due date to next week'));
    expect(
      (within(dialog).getByLabelText('Due') as HTMLInputElement).value
    ).toBe(isoDate(7));
  });
});

describe('collapsible modal sections', () => {
  test('the checklist hides its items but keeps the count', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByRole('button', { name: /Checklist/ }));

    expect(within(dialog).queryByText('outline')).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Checklist/ })
    ).toHaveTextContent('1/2');
  });

  test('an empty checklist starts collapsed', () => {
    const BareCard = () => {
      const [board, setBoard] = useState<KanbanBoard>(() => ({
        lanes: [
          {
            id: 'laneA',
            title: 'Todo',
            cards: [{ id: 'c1', title: 'Bare card', laneId: 'laneA' }],
          },
        ],
      }));
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
    render(<BareCard />);
    const dialog = openCard('Bare card');

    // The section header is there, the add-item row is not.
    expect(
      within(dialog).getByRole('button', { name: /Checklist/ })
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByPlaceholderText('New checklist item')
    ).not.toBeInTheDocument();
  });

  test('comments start collapsed when there are none', () => {
    const EmptyComments = () => {
      const [board, setBoard] = useState<KanbanBoard>(() => ({
        lanes: [
          {
            id: 'laneA',
            title: 'Todo',
            cards: [{ id: 'c1', title: 'Bare card', laneId: 'laneA' }],
          },
        ],
      }));
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
    render(<EmptyComments />);
    const dialog = openCard('Bare card');

    expect(
      within(dialog).queryByText('No Comments yet...')
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByPlaceholderText('New Comment')
    ).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /Comments/ }));
    expect(within(dialog).getByText('No Comments yet...')).toBeInTheDocument();
  });

  test('existing comments can be folded away', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByRole('button', { name: /Comments/ }));

    expect(within(dialog).queryByText('first note')).not.toBeInTheDocument();
    expect(
      within(dialog).queryByPlaceholderText('New Comment')
    ).not.toBeInTheDocument();
  });
});
