import React from 'react';
import { act, render, screen } from '@testing-library/react';
import Editor from './Editor';

// Inside Standard Notes the plugin runs in an iframe, so window.parent is
// another window. jsdom has no parent, so fake one.
const originalParent = Object.getOwnPropertyDescriptor(window, 'parent');
const embed = () =>
  Object.defineProperty(window, 'parent', {
    configurable: true,
    value: {},
  });

afterEach(() => {
  if (originalParent) {
    Object.defineProperty(window, 'parent', originalParent);
  }
  vi.useRealTimers();
});

const mount = () => {
  const ref = React.createRef<Editor>();
  render(<Editor ref={ref} />);
  return ref.current!;
};

test('shows a loading state, not an empty board, until the note arrives', () => {
  embed();
  const editor = mount();

  expect(screen.getByRole('status')).toHaveTextContent('Loading note');
  expect(screen.queryByText(/Add lane/i)).not.toBeInTheDocument();

  act(() => editor.receiveText('# Lane\n* Card\n'));

  expect(screen.queryByText('Loading note')).not.toBeInTheDocument();
  expect(screen.getByText('Lane')).toBeInTheDocument();
  expect(screen.getByText('Card')).toBeInTheDocument();
});

test('an empty note is a board with no lanes, not a missing note', () => {
  embed();
  const editor = mount();

  act(() => editor.receiveText(''));

  expect(screen.getByText(/Add lane/i)).toBeInTheDocument();
  expect(screen.queryByText(/Note not received/i)).not.toBeInTheDocument();
});

test('says the note was not received and what the relay reported', () => {
  vi.useFakeTimers();
  embed();
  const editor = mount();
  editor.editorKit = {
    onEditorValueChanged: () => {},
    environment: 'mobile',
    platform: 'android',
  };

  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Note not received from Standard Notes. Reopen the note.'
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Environment: mobile, platform: android'
  );
});

test('says so when the relay never registered', () => {
  vi.useFakeTimers();
  embed();
  mount();

  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Environment: not reported, platform: not reported'
  );
});

test('a note that arrives late replaces the warning', () => {
  vi.useFakeTimers();
  embed();
  const editor = mount();
  act(() => {
    vi.advanceTimersByTime(5000);
  });

  act(() => editor.receiveText('# Late lane\n'));

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText('Late lane')).toBeInTheDocument();
});

test('does not wait for a note outside Standard Notes', () => {
  render(<Editor />);

  expect(screen.getByText(/Add lane/i)).toBeInTheDocument();
});

test('does not wait when the board is handed in directly', () => {
  embed();
  render(<Editor boardData={{ lanes: [] }} />);

  expect(screen.getByText(/Add lane/i)).toBeInTheDocument();
});
