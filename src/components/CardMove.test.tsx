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
      cards: [{ id: 'c1', title: 'Write docs', laneId: 'laneA' }],
    },
    {
      id: 'laneB',
      title: 'Done',
      cards: [{ id: 'c2', title: 'Existing', laneId: 'laneB' }],
    },
  ],
});

// EditorInternal is controlled, so keep the board in state like Editor does.
const Harness = ({
  onCardUpdate,
}: {
  onCardUpdate: (laneId: string, cardId: string, patch: object) => void;
}) => {
  const [board, setBoard] = useState(initialBoard());
  return (
    <ModalProvider>
      <EditorInternal
        boardData={board}
        handleDataChange={(next) => setBoard(next as KanbanBoard)}
        onCardUpdate={onCardUpdate}
      />
    </ModalProvider>
  );
};

const openCard = (title: string) => {
  fireEvent.click(screen.getByText(title));
  return screen.getByRole('dialog');
};

const laneCards = (laneTitle: string) =>
  within(
    screen
      .getByText(laneTitle, { selector: '.kbn-lane-title' })
      .closest('.kbn-lane') as HTMLElement
  )
    .queryAllByText(/./, { selector: '.kbn-card-title' })
    .map((el) => el.textContent);

test('the card modal offers every lane and starts on the current one', () => {
  render(<Harness onCardUpdate={() => {}} />);
  const dialog = openCard('Write docs');

  const select = within(dialog).getByLabelText('Move to') as HTMLSelectElement;

  expect(select.value).toBe('laneA');
  expect(
    Array.from(select.options).map((o) => [o.value, o.textContent])
  ).toEqual([
    ['laneA', 'Todo'],
    ['laneB', 'Done'],
  ]);
});

test('choosing a lane moves the card to the end of it', () => {
  render(<Harness onCardUpdate={() => {}} />);
  const dialog = openCard('Write docs');

  fireEvent.change(within(dialog).getByLabelText('Move to'), {
    target: { value: 'laneB' },
  });

  expect(laneCards('Todo')).toEqual([]);
  expect(laneCards('Done')).toEqual(['Existing', 'Write docs']);
  expect(
    (within(screen.getByRole('dialog')).getByLabelText(
      'Move to'
    ) as HTMLSelectElement).value
  ).toBe('laneB');
});

test('edits made before moving are saved on the lane the card ended in', () => {
  const onCardUpdate = vi.fn();
  render(<Harness onCardUpdate={onCardUpdate} />);
  const dialog = openCard('Write docs');
  fireEvent.change(within(dialog).getByPlaceholderText('Description'), {
    target: { value: 'typed before moving' },
  });

  fireEvent.change(within(dialog).getByLabelText('Move to'), {
    target: { value: 'laneB' },
  });
  fireEvent.keyDown(screen.getByRole('dialog'), {
    key: 'Escape',
    keyCode: 27,
  });

  expect(onCardUpdate).toHaveBeenCalledTimes(1);
  expect(onCardUpdate).toHaveBeenCalledWith(
    'laneB',
    'c1',
    expect.objectContaining({ description: 'typed before moving' })
  );
});
