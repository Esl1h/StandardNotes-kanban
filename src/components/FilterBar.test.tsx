import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Editor from './Editor';
import { KanbanBoard } from '../../types/kanban';
import { infuseBoardData } from '../lib/helpers';

// Dates relative to the real clock, since the badges use it too.
const inDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const board = (): KanbanBoard =>
  infuseBoardData({
    lanes: [
      {
        id: 'lane1',
        title: 'Doing',
        cards: [
          { id: 'a', title: 'Late task', label: 'red', due: inDays(-1) },
          { id: 'b', title: 'Today task', label: 'blue', due: inDays(0) },
          { id: 'c', title: 'Soon task', label: 'red, blue', due: inDays(3) },
          { id: 'd', title: 'Far task', due: inDays(30) },
          { id: 'e', title: 'No date' },
        ],
      },
      { id: 'lane2', title: 'Empty', cards: [] },
    ],
  });

const openEditor = (data: KanbanBoard = board()) =>
  render(<Editor boardData={data} />);

const filters = () => screen.getByRole('group', { name: 'Filters' });
const search = () => screen.getByLabelText('Search cards') as HTMLInputElement;

const shown = () =>
  Array.from(document.querySelectorAll('.kbn-card-title')).map(
    (el) => el.textContent
  );

test('offers the due filters and the labels of the cards', () => {
  openEditor();

  expect(
    within(filters()).getByRole('button', { name: 'Overdue' })
  ).toBeInTheDocument();
  expect(
    within(filters()).getByRole('button', { name: 'Today' })
  ).toBeInTheDocument();
  expect(
    within(filters()).getByRole('button', { name: 'This week' })
  ).toBeInTheDocument();
  expect(
    within(filters()).getByRole('button', { name: 'red' })
  ).toBeInTheDocument();
  expect(
    within(filters()).getByRole('button', { name: 'blue' })
  ).toBeInTheDocument();
});

test('has no filter bar when no card has a label or a due date', () => {
  openEditor(
    infuseBoardData({
      lanes: [{ id: 'l', title: 'L', cards: [{ id: 'x', title: 'Plain' }] }],
    })
  );

  expect(
    screen.queryByRole('group', { name: 'Filters' })
  ).not.toBeInTheDocument();
});

test('Overdue shows only the overdue cards and fills the search', () => {
  openEditor();

  fireEvent.click(within(filters()).getByRole('button', { name: 'Overdue' }));

  expect(shown()).toEqual(['Late task']);
  expect(search().value).toBe('due:overdue');
  expect(
    within(filters()).getByRole('button', { name: 'Overdue' })
  ).toHaveAttribute('aria-pressed', 'true');
});

test('pressing a filter again takes it off', () => {
  openEditor();
  const overdue = () =>
    within(filters()).getByRole('button', { name: 'Overdue' });

  fireEvent.click(overdue());
  fireEvent.click(overdue());

  expect(shown()).toHaveLength(5);
  expect(search().value).toBe('');
  expect(overdue()).toHaveAttribute('aria-pressed', 'false');
});

test('This week is today and the days after it', () => {
  openEditor();

  fireEvent.click(within(filters()).getByRole('button', { name: 'This week' }));

  expect(shown()).toEqual(['Today task', 'Soon task']);
});

test('a label and a due filter narrow the cards together', () => {
  openEditor();

  fireEvent.click(within(filters()).getByRole('button', { name: 'red' }));
  expect(shown()).toEqual(['Late task', 'Soon task']);

  fireEvent.click(within(filters()).getByRole('button', { name: 'This week' }));
  expect(shown()).toEqual(['Soon task']);
  expect(search().value).toBe('label:red due:week');
});

test('typing the qualifiers by hand gives the same result', () => {
  openEditor();

  fireEvent.change(search(), { target: { value: 'label:blue due:today' } });

  expect(shown()).toEqual(['Today task']);
  expect(
    within(filters()).getByRole('button', { name: 'blue' })
  ).toHaveAttribute('aria-pressed', 'true');
});

test('clicking a label on a card filters by that whole label', () => {
  openEditor();

  fireEvent.click(
    within(
      screen.getByText('Late task').closest('.kbn-card') as HTMLElement
    ).getByTitle('Filter by red')
  );

  expect(search().value).toBe('label:red');
  expect(shown()).toEqual(['Late task', 'Soon task']);
});

test('a lane without a matching card leaves the board', () => {
  openEditor();

  fireEvent.click(within(filters()).getByRole('button', { name: 'Overdue' }));

  expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  expect(screen.getByText('Doing')).toBeInTheDocument();
});

test('the matrix is filtered the same way', () => {
  openEditor();
  fireEvent.click(screen.getByRole('button', { name: 'Matrix' }));

  fireEvent.click(within(filters()).getByRole('button', { name: 'Overdue' }));

  expect(shown()).toEqual(['Late task']);
});
