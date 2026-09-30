import React from 'react';
import { render, screen } from '@testing-library/react';
import Editor from './Editor';
import { EditorInterface } from '../../types/editor';
import { convertStateToMarkdown } from '../lib/convertStateToMarkdown';

test('renders add another lane button', () => {
  render(<Editor />);
  const addLaneButton = screen.getByText(/Add another lane/i);
  expect(addLaneButton).toBeInTheDocument();
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
    editorConfig: {},
    parsingErrors: [],
    boardData: state.boardData,
  });
  expect(markdown).toContain('# Legacy Lane');
  expect(markdown).toContain('* Legacy Card');
});
