import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { KanbanBoard } from '../../types/kanban';

const board = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [
        {
          id: 'c1',
          title: 'Write docs',
          label: 'work',
          checklist: [{ done: false, text: 'draft' }],
          comments: ['first'],
        },
      ],
    },
  ],
});

const setup = (data = board()) => {
  const onCardUpdate = vi.fn();
  const ui = (b: KanbanBoard) => (
    <ModalProvider>
      <EditorInternal boardData={b} handleDataChange={vi.fn()} onCardUpdate={onCardUpdate} />
    </ModalProvider>
  );
  const view = render(ui(data));
  fireEvent.click(screen.getByText('Write docs').closest('.kbn-card')!);
  return {
    onCardUpdate,
    dialog: screen.getByRole('dialog'),
    rerender: (b: KanbanBoard) => view.rerender(ui(b)),
  };
};

const close = (dialog: HTMLElement) =>
  fireEvent.click(within(dialog).getByLabelText('Save and close'));

test('closing a card nobody edited does not write the note', () => {
  const { onCardUpdate, dialog } = setup();

  close(dialog);

  expect(onCardUpdate).not.toHaveBeenCalled();
});

test('closing sends only the fields that changed', () => {
  const { onCardUpdate, dialog } = setup();

  fireEvent.change(within(dialog).getByLabelText('Card title'), { target: { value: 'Docs' } });
  close(dialog);

  expect(onCardUpdate).toHaveBeenCalledWith('laneA', 'c1', { title: 'Docs' });
});

test('closing keeps a checklist item, label and comment that were typed but not added', () => {
  const { onCardUpdate, dialog } = setup();

  fireEvent.change(within(dialog).getByPlaceholderText('New checklist item'), {
    target: { value: 'ship' },
  });
  fireEvent.change(within(dialog).getByLabelText('Add label'), { target: { value: 'home' } });
  fireEvent.change(within(dialog).getByPlaceholderText('New Comment'), {
    target: { value: 'later' },
  });
  close(dialog);

  expect(onCardUpdate).toHaveBeenCalledWith('laneA', 'c1', {
    label: 'work, home',
    checklist: [
      { done: false, text: 'draft' },
      { done: false, text: 'ship' },
    ],
    comments: ['first', 'later'],
  });
});

test('the modal stays closed when its card disappears and comes back', () => {
  const { dialog, rerender } = setup();
  expect(dialog).toBeInTheDocument();

  rerender({ lanes: [{ id: 'laneA', title: 'Todo', cards: [] }] });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  rerender(board());

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
