import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Editor from './Editor';
import { EditorInterface } from '../../types/editor';
import { KanbanBoard } from '../../types/kanban';
import { convertStateToMarkdown } from '../lib/convertStateToMarkdown';
import { infuseBoardData } from '../lib/helpers';

test('renders add lane button', () => {
  render(<Editor />);
  const addLaneButton = screen.getByText(/Add lane/i);
  expect(addLaneButton).toBeInTheDocument();
});

test('has an Export menu in the toolbar', () => {
  render(<Editor />);

  expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
});

test('saves the note when the last lane is removed', () => {
  const editor = new Editor({} as EditorInterface);
  const saved: string[] = [];
  editor.editorKit = {
    onEditorValueChanged: (text: string) => saved.push(text),
  };

  editor.handleDataChange({
    lanes: [{ id: 'lane-1', title: 'Only lane', cards: [] }],
  });
  editor.handleDataChange({ lanes: [] });

  expect(saved).toEqual(['# Only lane [id:lane-1]\n\n', '']);
});

test('keeps the last saved text for the crash fallback', () => {
  const editor = new Editor({} as EditorInterface);
  editor.editorKit = { onEditorValueChanged: () => {} };
  editor.receiveText('# Old [id:lane-1]\n\n', 'n1');

  editor.saveNote('# Typed in the fallback');

  expect(editor.rawText).toBe('# Typed in the fallback');
});

test('wraps legacy JSON notes so their data is not lost on save', () => {
  const editor = new Editor({} as EditorInterface);
  const legacyJson = JSON.stringify({
    lanes: [
      {
        title: 'Legacy Lane',
        cards: [{ title: 'Legacy Card', description: 'kept' }],
      },
    ],
  });

  const state = editor.parseText(legacyJson);

  expect(state.boardData.lanes).toHaveLength(1);
  expect(state.boardData.lanes[0].title).toBe('Legacy Lane');
  expect(state.boardData.lanes[0].cards[0].title).toBe('Legacy Card');

  // On first edit the editor saves whatever convertStateToMarkdown returns;
  // the legacy data must end up in that markdown, not be wiped.
  const markdown = convertStateToMarkdown({
    parsingErrors: [],
    boardData: state.boardData,
  });
  expect(markdown).toContain('# Legacy Lane');
  expect(markdown).toContain('* Legacy Card');
});

describe('undo and redo', () => {
  const boardWithTwoCards = (): KanbanBoard =>
    infuseBoardData({
      lanes: [
        {
          title: 'Lane',
          cards: [{ title: 'First' }, { title: 'Second' }],
        },
      ],
    });

  const mountEditor = () => {
    const ref = React.createRef<Editor>();
    const saved: string[] = [];
    render(
      <Editor ref={ref} boardData={boardWithTwoCards()} parsingErrors={[]} />
    );
    ref.current!.editorKit = {
      onEditorValueChanged: (text: string) => saved.push(text),
    };
    return { editor: ref.current!, saved };
  };

  const removeCard = (title: string) =>
    fireEvent.click(screen.getByLabelText(`Delete card ${title}`));

  test('Ctrl+Z brings a removed card back and saves the note', () => {
    const { saved } = mountEditor();

    removeCard('First');
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(saved).toHaveLength(1);

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(saved).toHaveLength(2);
    expect(saved[1]).toContain('* First');
  });

  test('Cmd+Shift+Z redoes the removal', () => {
    const { saved } = mountEditor();
    removeCard('First');
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    fireEvent.keyDown(document, { key: 'Z', metaKey: true, shiftKey: true });

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(saved).toHaveLength(3);
    expect(saved[2]).not.toContain('* First');
  });

  test('undo steps back one change at a time', () => {
    mountEditor();
    removeCard('First');
    removeCard('Second');

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.queryByText('First')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  test('Ctrl+Z is left to the field while typing in an input', () => {
    const { saved } = mountEditor();
    removeCard('First');

    fireEvent.keyDown(screen.getByLabelText('Search cards'), {
      key: 'z',
      ctrlKey: true,
    });

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(saved).toHaveLength(1);
  });

  test('a card edit from the modal can be undone', () => {
    const { editor, saved } = mountEditor();
    const lane = editor.state.boardData.lanes[0];

    act(() =>
      editor.handleCardUpdate(lane.id!, lane.cards[0].id!, { label: 'red' })
    );
    expect(saved[0]).toContain('Label: red');

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    expect(saved[1]).not.toContain('Label: red');
  });

  test('switching notes clears the history', () => {
    const { editor, saved } = mountEditor();
    removeCard('First');

    act(() => editor.clearUndoHistory());
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(saved).toHaveLength(1);
  });

  test('text synced from elsewhere clears the history', () => {
    const { editor, saved } = mountEditor();
    removeCard('First');

    act(() => editor.receiveText('# Remote lane\n* Remote card\n'));
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    expect(screen.getByText('Remote card')).toBeInTheDocument();
    expect(saved).toHaveLength(1);
  });

  test('our own save coming back does not clear the history', () => {
    const { editor, saved } = mountEditor();
    removeCard('First');

    act(() => editor.receiveText(saved[0]));
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });

    expect(screen.getByText('First')).toBeInTheDocument();
  });
});
