import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
    { id: 'laneB', title: 'Done', cards: [] },
  ],
});

test('the undo toast names the lane and calls onUndo once', () => {
  const data = board();
  const onUndo = vi.fn();
  let removed: KanbanBoard | undefined;
  const props = {
    onUndo,
    onCardClick: () => {},
    onDataChange: (next: KanbanBoard) => {
      removed = next;
    },
  };
  const { rerender } = render(<Board data={data} {...props} />);

  fireEvent.click(screen.getByLabelText('Delete lane Doing'));
  rerender(<Board data={removed!} {...props} />);

  expect(screen.getByRole('status')).toHaveTextContent('Lane "Doing" removed');
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(onUndo).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('the toast goes away when the board changes in any other way', () => {
  const data = board();
  let removed: KanbanBoard | undefined;
  const props = {
    onUndo: vi.fn(),
    onCardClick: () => {},
    onDataChange: (next: KanbanBoard) => {
      removed = next;
    },
  };
  const { rerender } = render(<Board data={data} {...props} />);
  fireEvent.click(screen.getByLabelText('Delete lane Doing'));
  rerender(<Board data={removed!} {...props} />);
  expect(screen.getByRole('status')).toBeInTheDocument();

  // Undo would now revert this edit instead of the removal.
  rerender(<Board data={{ lanes: [...removed!.lanes] }} {...props} />);

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('the toast disappears by itself', () => {
  vi.useFakeTimers();
  try {
    const data = board();
    let removed: KanbanBoard | undefined;
    const props = {
      onUndo: vi.fn(),
      onCardClick: () => {},
      onDataChange: (next: KanbanBoard) => {
        removed = next;
      },
    };
    const { rerender } = render(<Board data={data} {...props} />);
    fireEvent.click(screen.getByLabelText('Delete lane Doing'));
    rerender(<Board data={removed!} {...props} />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test('Undo in the editor brings the lane and its cards back and saves', () => {
  const ref = React.createRef<Editor>();
  const saved: string[] = [];
  render(<Editor ref={ref} boardData={infuseBoardData(board())} />);
  ref.current!.editorKit = {
    onEditorValueChanged: (text: string) => saved.push(text),
  };

  fireEvent.click(screen.getByLabelText('Delete lane Doing'));
  expect(screen.queryByText('First')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.getByText('Second')).toBeInTheDocument();
  expect(saved).toHaveLength(2);
  expect(saved[1]).toContain('# Doing');
});
