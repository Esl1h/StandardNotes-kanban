import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Board } from './Board';
import { KanbanBoard } from '../../types/kanban';

const lanesOf = (titles: string[]): KanbanBoard => ({
  lanes: titles.map((title, i) => ({
    id: `lane${i}`,
    title,
    cards: [],
  })),
});

// Board is controlled, so keep its data in state like Editor does.
const Harness = ({ initial }: { initial: KanbanBoard }) => {
  const [data, setData] = useState(initial);
  return <Board data={data} onDataChange={setData} onCardClick={() => {}} />;
};

const laneTitleOfCard = () =>
  screen
    .getByText('Card')
    .closest('.kbn-lane')!
    .querySelector('.kbn-lane-title')!.textContent;

const pressAlt = (key: 'ArrowLeft' | 'ArrowRight') =>
  fireEvent.keyDown(document, { key, altKey: true });

const boardWithCard = (titles: string[], cardLane = 0): KanbanBoard => {
  const board = lanesOf(titles);
  board.lanes[cardLane].cards.push({
    id: 'card1',
    title: 'Card',
    laneId: board.lanes[cardLane].id,
  });
  return board;
};

test('Alt+Right moves the clicked card to the next lane', () => {
  render(<Harness initial={boardWithCard(['A', 'B', 'C'])} />);
  fireEvent.click(screen.getByText('Card'));

  pressAlt('ArrowRight');

  expect(laneTitleOfCard()).toBe('B');
});

test('keeps moving the same card on consecutive presses', () => {
  render(<Harness initial={boardWithCard(['A', 'B', 'C', 'D'])} />);
  fireEvent.click(screen.getByText('Card'));

  pressAlt('ArrowRight');
  pressAlt('ArrowRight');
  pressAlt('ArrowRight');
  expect(laneTitleOfCard()).toBe('D');

  pressAlt('ArrowLeft');
  expect(laneTitleOfCard()).toBe('C');
});

test('skips a collapsed lane in the way', () => {
  render(<Harness initial={boardWithCard(['A', 'B', 'C'])} />);
  fireEvent.click(screen.getByLabelText('Collapse lane B'));
  fireEvent.click(screen.getByText('Card'));

  pressAlt('ArrowRight');

  expect(laneTitleOfCard()).toBe('C');
});

test('skips several collapsed lanes and moves back across them', () => {
  render(<Harness initial={boardWithCard(['A', 'B', 'C', 'D'])} />);
  fireEvent.click(screen.getByLabelText('Collapse lane B'));
  fireEvent.click(screen.getByLabelText('Collapse lane C'));
  fireEvent.click(screen.getByText('Card'));

  pressAlt('ArrowRight');
  expect(laneTitleOfCard()).toBe('D');

  pressAlt('ArrowLeft');
  expect(laneTitleOfCard()).toBe('A');
});

test('stays put when every lane ahead is collapsed or there is none', () => {
  render(<Harness initial={boardWithCard(['A', 'B', 'C'])} />);
  fireEvent.click(screen.getByLabelText('Collapse lane B'));
  fireEvent.click(screen.getByLabelText('Collapse lane C'));
  fireEvent.click(screen.getByText('Card'));

  pressAlt('ArrowRight');
  pressAlt('ArrowLeft');

  expect(laneTitleOfCard()).toBe('A');
});
