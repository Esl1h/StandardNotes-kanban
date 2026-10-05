import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Editor from './Editor';
import { KanbanBoard } from '../../types/kanban';
import { infuseBoardData } from '../lib/helpers';

const board = (): KanbanBoard =>
  infuseBoardData({
    lanes: [
      { id: 'a', title: 'Doing', cards: [{ id: 'c1', title: 'Open card' }] },
      {
        id: 'b',
        title: 'Finished',
        done: true,
        cards: [
          { id: 'c2', title: 'Done one' },
          { id: 'c3', title: 'Done two' },
        ],
      },
    ],
  });

const openEditor = (data: KanbanBoard = board()) => {
  const ref = React.createRef<Editor>();
  const saved: string[] = [];
  render(<Editor ref={ref} boardData={data} />);
  ref.current!.editorKit = {
    onEditorValueChanged: (text: string) => saved.push(text),
  };
  return saved;
};

const showFinished = () =>
  fireEvent.click(screen.getByRole('button', { name: /^Done \(/ }));

test('Clear done shows up only while the finished cards are shown', () => {
  openEditor();
  expect(
    screen.queryByRole('button', { name: 'Clear done' })
  ).not.toBeInTheDocument();

  showFinished();

  expect(
    screen.getByRole('button', { name: 'Clear done' })
  ).toBeInTheDocument();
});

test('there is nothing to clear when the done lane is empty', () => {
  openEditor(
    infuseBoardData({
      lanes: [{ id: 'b', title: 'Finished', done: true, cards: [] }],
    })
  );

  showFinished();

  expect(
    screen.queryByRole('button', { name: 'Clear done' })
  ).not.toBeInTheDocument();
});

test('clearing removes the finished cards, saves and offers Undo', () => {
  const saved = openEditor();
  showFinished();
  expect(screen.getByText('Done one')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Clear done' }));

  expect(screen.queryByText('Done one')).not.toBeInTheDocument();
  expect(screen.queryByText('Done two')).not.toBeInTheDocument();
  expect(screen.getByText('Open card')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    '2 finished cards removed'
  );
  expect(saved).toHaveLength(1);
  expect(saved[0]).not.toContain('Done one');
  // The lane itself stays, and so does its marker.
  expect(saved[0]).toContain('# Finished [done]');
});

test('Undo brings the finished cards back and saves', () => {
  const saved = openEditor();
  showFinished();
  fireEvent.click(screen.getByRole('button', { name: 'Clear done' }));

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

  expect(screen.getByText('Done one')).toBeInTheDocument();
  expect(screen.getByText('Done two')).toBeInTheDocument();
  expect(saved).toHaveLength(2);
  expect(saved[1]).toContain('* Done one');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('a single card is announced in the singular', () => {
  openEditor(
    infuseBoardData({
      lanes: [
        {
          id: 'b',
          title: 'Finished',
          done: true,
          cards: [{ id: 'c2', title: 'Only one' }],
        },
      ],
    })
  );
  showFinished();

  fireEvent.click(screen.getByRole('button', { name: 'Clear done' }));

  expect(screen.getByRole('status')).toHaveTextContent(
    '1 finished card removed'
  );
});
