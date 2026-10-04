import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const Boom = ({ explode }: { explode: boolean }) => {
  if (explode) {
    throw new Error('kaboom');
  }
  return <div>all good</div>;
};

// React re-throws render errors in dev so jsdom reports them as uncaught;
// cancelling the window error event keeps that noise out of the output.
const ignoreWindowError = (e: ErrorEvent) => e.preventDefault();

beforeEach(() => {
  window.addEventListener('error', ignoreWindowError);
  // React also reports caught render errors through console.error.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  window.removeEventListener('error', ignoreWindowError);
  vi.restoreAllMocks();
});

test('shows the error message instead of a blank screen', () => {
  render(
    <ErrorBoundary rawText="" onRawTextChange={() => {}} resetKey={0}>
      <Boom explode />
    </ErrorBoundary>
  );

  expect(screen.getByRole('alert')).toHaveTextContent('kaboom');
});

test('lets the user read the raw note text', () => {
  render(
    <ErrorBoundary
      rawText={'# Lane\n* Card'}
      onRawTextChange={() => {}}
      resetKey={0}
    >
      <Boom explode />
    </ErrorBoundary>
  );
  expect(screen.queryByLabelText('Raw note text')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Show raw text' }));

  expect(screen.getByLabelText('Raw note text')).toHaveValue('# Lane\n* Card');
  fireEvent.click(screen.getByRole('button', { name: 'Hide raw text' }));
  expect(screen.queryByLabelText('Raw note text')).not.toBeInTheDocument();
});

test('offers no raw text button when no note was received', () => {
  render(
    <ErrorBoundary rawText="" onRawTextChange={() => {}} resetKey={0}>
      <Boom explode />
    </ErrorBoundary>
  );

  expect(
    screen.queryByRole('button', { name: 'Show raw text' })
  ).not.toBeInTheDocument();
});

test('renders its children when nothing fails', () => {
  render(
    <ErrorBoundary rawText="" onRawTextChange={() => {}} resetKey={0}>
      <Boom explode={false} />
    </ErrorBoundary>
  );

  expect(screen.getByText('all good')).toBeInTheDocument();
});

test('tries again when the reset key changes', () => {
  const { rerender } = render(
    <ErrorBoundary rawText="" onRawTextChange={() => {}} resetKey={0}>
      <Boom explode />
    </ErrorBoundary>
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();

  rerender(
    <ErrorBoundary rawText="" onRawTextChange={() => {}} resetKey={1}>
      <Boom explode={false} />
    </ErrorBoundary>
  );

  expect(screen.getByText('all good')).toBeInTheDocument();
});

test('saves what is typed in the raw text', () => {
  const onRawTextChange = vi.fn();
  render(
    <ErrorBoundary
      rawText={'# Lane\n* Card'}
      onRawTextChange={onRawTextChange}
      resetKey={0}
    >
      <Boom explode />
    </ErrorBoundary>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Show raw text' }));

  fireEvent.change(screen.getByLabelText('Raw note text'), {
    target: { value: '# Lane\n* Card\n* Another' },
  });

  expect(onRawTextChange).toHaveBeenCalledWith('# Lane\n* Card\n* Another');
  expect(screen.getByLabelText('Raw note text')).toHaveValue(
    '# Lane\n* Card\n* Another'
  );
});

test('replaces the raw text with a newer one from the app', () => {
  const { rerender } = render(
    <ErrorBoundary rawText="# One" onRawTextChange={() => {}} resetKey={0}>
      <Boom explode />
    </ErrorBoundary>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Show raw text' }));
  fireEvent.change(screen.getByLabelText('Raw note text'), {
    target: { value: '# One, edited' },
  });

  rerender(
    <ErrorBoundary rawText="# Two" onRawTextChange={() => {}} resetKey={0}>
      <Boom explode />
    </ErrorBoundary>
  );

  expect(screen.getByLabelText('Raw note text')).toHaveValue('# Two');
});
