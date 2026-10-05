import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ExportMenu } from './ExportMenu';
import { KanbanBoard } from '../../types/kanban';
import { DEFAULT_QUADRANT_NAMES } from '../lib/quadrants';
import { toCsv, toJson } from '../lib/exportBoard';

const board = (): KanbanBoard => ({
  lanes: [
    {
      id: 'l1',
      title: 'Doing',
      cards: [{ id: 'c1', title: 'Renew passport', label: 'red' }],
    },
  ],
});

const renderMenu = () =>
  render(<ExportMenu board={board()} quadrantNames={DEFAULT_QUADRANT_NAMES} />);

const openMenu = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));

afterEach(() => {
  vi.restoreAllMocks();
});

test('the menu opens from the button and lists the four actions', () => {
  renderMenu();
  const button = screen.getByRole('button', { name: 'Export' });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();

  openMenu();

  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(
    screen.getAllByRole('menuitem').map((item) => item.textContent)
  ).toEqual(['Copy JSON', 'Copy CSV', 'Download JSON', 'Download CSV']);
});

test.each([
  ['Copy JSON', () => toJson(board())],
  ['Copy CSV', () => toCsv(board(), DEFAULT_QUADRANT_NAMES)],
])('%s puts the export on the clipboard and closes the menu', (name, text) => {
  const writeText = vi.fn();
  Object.assign(navigator, { clipboard: { writeText } });
  renderMenu();
  openMenu();

  fireEvent.click(screen.getByRole('menuitem', { name }));

  expect(writeText).toHaveBeenCalledWith(text());
  expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
});

test.each([
  ['Download JSON', 'kanban-board.json', 'application/json'],
  ['Download CSV', 'kanban-board.csv', 'text/csv'],
])('%s saves a file named %s', async (name, fileName, type) => {
  const created: Blob[] = [];
  URL.createObjectURL = vi.fn((blob: Blob) => {
    created.push(blob);
    return 'blob:export';
  });
  URL.revokeObjectURL = vi.fn();
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  renderMenu();
  openMenu();

  fireEvent.click(screen.getByRole('menuitem', { name }));

  // The anchor the click was made on.
  const link = click.mock.contexts[0] as HTMLAnchorElement;
  expect(link.download).toBe(fileName);
  expect(link.href).toBe('blob:export');
  expect(created[0].type).toBe(type);
  expect(await created[0].text()).toBe(
    name.endsWith('JSON')
      ? toJson(board())
      : toCsv(board(), DEFAULT_QUADRANT_NAMES)
  );
  await vi.waitFor(() =>
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export')
  );
  expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
});

test('Escape and a click elsewhere close the menu', () => {
  renderMenu();
  openMenu();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();

  openMenu();
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
});
