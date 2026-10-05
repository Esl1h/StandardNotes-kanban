import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Board } from './Board';
import { KanbanBoard } from '../../types/kanban';

const board = (): KanbanBoard => ({
  lanes: [
    { id: 'laneA', title: 'A', cards: [] },
    { id: 'laneB', title: 'B', cards: [] },
  ],
});

const renderBoard = (props: Partial<React.ComponentProps<typeof Board>> = {}) =>
  render(
    <Board
      data={board()}
      onDataChange={() => {}}
      onCardClick={() => {}}
      {...props}
    />
  );

test('starts with the lanes the loader reports as collapsed', () => {
  renderBoard({ loadCollapsed: () => new Set(['laneB']) });

  expect(screen.getByLabelText('Expand lane B')).toBeInTheDocument();
  expect(screen.getByLabelText('Collapse lane A')).toBeInTheDocument();
});

test('reports every change in the collapsed lanes', () => {
  const onCollapsedChange = vi.fn();
  renderBoard({ onCollapsedChange });

  fireEvent.click(screen.getByLabelText('Collapse lane B'));
  expect(onCollapsedChange).toHaveBeenLastCalledWith(new Set(['laneB']));

  fireEvent.click(screen.getByLabelText('Collapse lane A'));
  expect(onCollapsedChange).toHaveBeenLastCalledWith(
    new Set(['laneB', 'laneA'])
  );

  fireEvent.click(screen.getByLabelText('Expand lane B'));
  expect(onCollapsedChange).toHaveBeenLastCalledWith(new Set(['laneA']));
});

test('does not report lanes that no longer exist', () => {
  const onCollapsedChange = vi.fn();
  renderBoard({
    loadCollapsed: () => new Set(['gone', 'laneA']),
    onCollapsedChange,
  });

  fireEvent.click(screen.getByLabelText('Collapse lane B'));

  expect(onCollapsedChange).toHaveBeenLastCalledWith(
    new Set(['laneA', 'laneB'])
  );
});
