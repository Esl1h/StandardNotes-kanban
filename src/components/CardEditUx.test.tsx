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

    expect((within(dialog).getByLabelText('Due') as HTMLInputElement).value).toBe(isoDate(1));
  });

  test('today and next week work the same way', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByLabelText('Set due date to today'));
    expect((within(dialog).getByLabelText('Due') as HTMLInputElement).value).toBe(isoDate(0));

    fireEvent.click(within(dialog).getByLabelText('Set due date to next week'));
    expect((within(dialog).getByLabelText('Due') as HTMLInputElement).value).toBe(isoDate(7));
  });
});

describe('collapsible modal sections', () => {
  test('the checklist hides its items but keeps the count', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByRole('button', { name: /Checklist/ }));

    expect(within(dialog).queryByText('outline')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Checklist/ })).toHaveTextContent('1/2');
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
    expect(within(dialog).getByRole('button', { name: /Checklist/ })).toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText('New checklist item')).not.toBeInTheDocument();
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

    expect(within(dialog).queryByText('No Comments yet...')).not.toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText('New Comment')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /Comments/ }));
    expect(within(dialog).getByText('No Comments yet...')).toBeInTheDocument();
  });

  test('existing comments can be folded away', () => {
    render(<Harness />);
    const dialog = openCard('Write docs');

    fireEvent.click(within(dialog).getByRole('button', { name: /Comments/ }));

    expect(within(dialog).queryByText('first note')).not.toBeInTheDocument();
    expect(within(dialog).queryByPlaceholderText('New Comment')).not.toBeInTheDocument();
  });
});

test('Enter adds a card and keeps the form open for the next one', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: /Add card/ }));
  const input = screen.getByLabelText('New card title in lane laneA');

  fireEvent.change(input, { target: { value: 'One' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.change(input, { target: { value: 'Two' } });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(screen.getByText('One')).toBeInTheDocument();
  expect(screen.getByText('Two')).toBeInTheDocument();
  expect((input as HTMLInputElement).value).toBe('');
  // Still open: the form actions are around.
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByLabelText('New card title in lane laneA')).not.toBeInTheDocument();
});

describe('inline rename on the board', () => {
  test('clicking the title edits it in place', () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('Write docs'));
    const input = screen.getByLabelText('Card title') as HTMLInputElement;
    expect(input.value).toBe('Write docs');

    fireEvent.change(input, { target: { value: 'Docs v2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Docs v2')).toBeInTheDocument();
    expect(screen.queryByText('Write docs')).not.toBeInTheDocument();
  });

  test('Escape puts the previous title back', () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('Write docs'));
    const input = screen.getByLabelText('Card title');
    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.queryByText('Nope')).not.toBeInTheDocument();
  });

  test('an emptied title keeps the current one', () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('Write docs'));
    const input = screen.getByLabelText('Card title');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Write docs')).toBeInTheDocument();
  });

  test('the card body still opens the modal', () => {
    render(<Harness />);

    fireEvent.click(screen.getByText('Write docs').closest('.kbn-card')!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
