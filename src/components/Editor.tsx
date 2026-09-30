import React from 'react';
import { EditorKit, EditorKitDelegate } from 'sn-editor-kit';
import { ModalProvider } from 'react-modal-hook';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { updateCard } from '../lib/boardOps';
import { infuseBoardData } from '../lib/helpers';
import { parseMarkdown } from '../lib/parseMarkdown';
import { convertStateToMarkdown } from '../lib/convertStateToMarkdown';
import './Editor.css';
import { EditorInterface } from '../../types/editor';
import { EditorInternal } from './EditorInternal';

const initialState: EditorInterface = {
  printUrl: false,
  boardData: {
    lanes: [],
  },
  editorConfig: '',
  parsingErrors: [],
};

export default class Editor extends React.Component<Partial<EditorInterface>, EditorInterface> {
  editorKit: EditorKit;

  constructor(props: EditorInterface) {
    super(props);
    this.configureEditorKit();
    this.state = {
      ...initialState,
      ...props,
    };
  }

  parseText(text: string): EditorInterface {
    // In the very first version of this editor, we saved the data as JSON.
    // However, we no longer save the data as JSON.
    // This may be removed at some point in the future.
    try {
      const data = JSON.parse(text);
      if (Object.hasOwn(data, 'lanes')) {
        // Legacy JSON format stored lanes at the top level instead of
        // under boardData. Wrap it so the board renders and, most
        // importantly, is re-saved instead of being wiped on first edit.
        console.log('Parsed data from JSON.');
        return { ...initialState, boardData: { lanes: data.lanes } };
      }
    } catch {
      /* Do Nothing */
    }
    try {
      return parseMarkdown(text);
    } catch {
      console.log('Could not parse data from Markdown.');
      const textByLine = text.split('\n');
      return {
        ...initialState,
        parsingErrors: textByLine.map((lineText, lineIndex) => ({
          lineText,
          lineIndex,
          message: 'Complete Markdown parsing failure',
        })),
      };
    }
  }

  configureEditorKit = () => {
    const delegate = new EditorKitDelegate({
      /** This loads every time a different note is loaded */
      setEditorRawText: (text: string) => {
        const newState = this.parseText(text);
        this.setState({
          ...initialState,
          ...newState,
          // Regenerate IDs deterministically at load time so lanes and
          // cards are draggable before the first edit happens.
          boardData: infuseBoardData(newState.boardData),
        });
      },
      clearUndoHistory: () => {},
      getElementsBySelector: () => [],
    });

    this.editorKit = new EditorKit({
      delegate: delegate,
      mode: 'plaintext',
      supportsFilesafe: false,
    });
  };

  handleCardUpdate = (laneId: string, cardId: string, patch: Partial<KanbanCard>) => {
    const boardData = updateCard(this.state.boardData, laneId, cardId, patch);
    this.setState({ boardData });
    this.saveNote(convertStateToMarkdown({ ...this.state, boardData }));
  };

  handleDataChange = (boardData: KanbanBoard | string) => {
    if (typeof boardData === 'string') {
      const newState = this.parseText(boardData);
      this.setState({
        ...this.state,
        ...newState,
      });
      return;
    }
    if (boardData.lanes.length > 0 && !boardData.lanes[0].id) {
      // The only time we should see ID-less lanes here is a board state
      // pushed before our infusion ran; repopulate them.
      this.setState({ boardData: infuseBoardData(boardData) });
      return;
    }
    // Any user-driven board change is saved, including removing the
    // last lane.
    this.setState({ boardData });
    const markdown = convertStateToMarkdown({
      ...this.state,
      boardData,
    });
    this.saveNote(markdown);
  };

  saveNote = (text: string) => {
    /** This will work in an SN context, but breaks the standalone editor,
     * so we need to catch the error
     */
    try {
      this.editorKit.onEditorValueChanged(text);
    } catch (error) {
      console.log('Error saving note:', error);
    }
  };

  render() {
    return (
      <ModalProvider>
        <EditorInternal
          printUrl={this.state.printUrl}
          boardData={this.state.boardData}
          handleDataChange={this.handleDataChange}
          onCardUpdate={this.handleCardUpdate}
          parsingErrors={this.state.parsingErrors}
        />
      </ModalProvider>
    );
  }
}
