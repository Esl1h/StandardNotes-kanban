import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Board } from './Board';
import Editor from './Editor';
import { KanbanBoard } from '../../types/kanban';
import { infuseBoardData } from '../lib/helpers';

const board = (): KanbanBoard => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Doing',
      cards: [
        { id: 'c1', title: 'First', laneId: 'laneA' },
        { id: 'c2', title: 'Second', laneId: 'laneA' },
      ],
    },
    { id: 'laneB', title: 'Finished', done: true, cards: [] },
  ],
});

const openEditor = () => {
  const ref = React.createRef<Editor>();
  const saved: string[] = [];
  render(<Editor ref={ref} boardData={infuseBoardData(board())} />);
  ref.current!.editorKit = {
    onEditorValueChanged: (text: string) => saved.push(text),
  };
  return saved;
};

test('deleting a card on the board offers to undo it', () => {
  const onUndo = vi.fn();
  let removed: KanbanBoard | undefined;
  const props = {
    onUndo,
    onCardClick: () => {},
    onDataChange: (next: KanbanBoard) => {
      removed = next;
    },
  };
  const { rerender } = render(<Board data={board()} {...props} />);

  fireEvent.click(screen.getByLabelText('Delete card First'));
  rerender(<Board data={removed!} {...props} />);

  expect(screen.getByRole('status')).toHaveTextContent('Card "First" removed');
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(onUndo).toHaveBeenCalledTimes(1);
});

test('the card toast goes away when the board changes in any other way', () => {
  let removed: KanbanBoard | undefined;
  const props = {
    onUndo: vi.fn(),
    onCardClick: () => {},
    onDataChange: (next: KanbanBoard) => {
      removed = next;
    },
  };
  const { rerender } = render(<Board data={board()} {...props} />);
  fireEvent.click(screen.getByLabelText('Delete card First'));
  rerender(<Board data={removed!} {...props} />);
  expect(screen.getByRole('status')).toBeInTheDocument();

  rerender(<Board data={{ lanes: [...removed!.lanes] }} {...props} />);

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('Undo in the editor brings a deleted card back and saves', () => {
  const saved = openEditor();

  fireEvent.click(screen.getByLabelText('Delete card First'));
  expect(screen.queryByText('First')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(screen.getByText('First')).toBeInTheDocument();
  expect(saved).toHaveLength(2);
  expect(saved[1]).toContain('* First');
});

describe('in the matrix view', () => {
  const openMatrix = () => {
    const saved = openEditor();
    fireEvent.click(screen.getByRole('button', { name: 'Matrix' }));
    return saved;
  };

  test('deleting a card offers to undo it', () => {
    const saved = openMatrix();

    fireEvent.click(screen.getByLabelText('Delete card Second'));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Card "Second" removed'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(saved).toHaveLength(2);
    expect(saved[1]).toContain('* Second');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('completing a card offers to undo it', () => {
    const saved = openMatrix();

    fireEvent.click(screen.getByLabelText('Complete card First'));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Card "First" completed'
    );
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(saved).toHaveLength(2);
  });
});
