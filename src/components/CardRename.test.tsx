import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { KanbanBoard } from '../../types/kanban';
import { updateCard } from '../lib/boardOps';

const initialBoard = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [{ id: 'c1', title: 'Write docs', laneId: 'laneA' }],
    },
  ],
});

// EditorInternal is controlled; Editor applies card edits with updateCard,
// so the harness does the same to see the rename on the board.
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
  fireEvent.click(screen.getByText(title));
  return screen.getByRole('dialog');
};

const renameAndSave = (dialog: HTMLElement, title: string) => {
  fireEvent.change(within(dialog).getByLabelText('Card title'), {
    target: { value: title },
  });
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save and close' })
  );
};

test('the modal opens with the title ready to edit', () => {
  render(<Harness />);
  const dialog = openCard('Write docs');

  expect(
    (within(dialog).getByLabelText('Card title') as HTMLInputElement).value
  ).toBe('Write docs');
});

test('renaming the card updates it on the board', () => {
  render(<Harness />);
  const dialog = openCard('Write docs');

  renameAndSave(dialog, 'Review the docs');

  expect(screen.getByText('Review the docs')).toBeInTheDocument();
  expect(screen.queryByText('Write docs')).not.toBeInTheDocument();
});

test('an emptied title keeps the current one', () => {
  render(<Harness />);
  const dialog = openCard('Write docs');

  renameAndSave(dialog, '   ');

  expect(screen.getByText('Write docs')).toBeInTheDocument();
});
