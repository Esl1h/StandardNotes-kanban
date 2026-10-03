import React from 'react';
import { ModalProvider } from 'react-modal-hook';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { updateCard } from '../lib/boardOps';
import { NoteBridge } from '../lib/noteBridge';
import { QuadrantNames } from '../lib/quadrants';
import {
  emptyHistory,
  History,
  HistoryStep,
  recordChange,
  redoStep,
  undoStep,
} from '../lib/history';
import { infuseBoardData } from '../lib/helpers';
import { parseMarkdown } from '../lib/parseMarkdown';
import { convertStateToMarkdown } from '../lib/convertStateToMarkdown';
import './Editor.css';
import { EditorInterface } from '../../types/editor';
import { EditorInternal } from './EditorInternal';
import { ErrorBoundary } from './ErrorBoundary';

const initialState: EditorInterface = {
  boardData: {
    lanes: [],
  },
  parsingErrors: [],
};

// What the editor needs from the kit; tests stub just this.
interface SaveNoteBridge {
  onEditorValueChanged(text: string): void;
  environment?: string;
  platform?: string;
}

interface EditorState extends EditorInterface {
  // False until Standard Notes streams the note in. Showing the board
  // before that would make an empty note look the same as a missing one,
  // and edits made meanwhile could not be saved.
  noteReceived: boolean;
  waitTimedOut: boolean;
  noteId?: string;
}

// Standard Notes normally delivers the note within a moment of load.
const NOTE_WAIT_MS = 5000;

// Inside Standard Notes the plugin always runs in an iframe. Standalone
// (npm start) it has no host to wait for.
const isEmbedded = () => window.parent !== window;

export default class Editor extends React.Component<
  Partial<EditorInterface>,
  EditorState
> {
  editorKit: SaveNoteBridge;
  rawText = '';
  waitTimer: ReturnType<typeof setTimeout> | undefined;
  // Not React state: nothing renders from it, it only feeds Ctrl+Z.
  undoHistory: History = emptyHistory;

  constructor(props: EditorInterface) {
    super(props);
    this.configureEditorKit();
    this.state = {
      ...initialState,
      ...props,
      noteReceived: props.boardData !== undefined || !isEmbedded(),
      waitTimedOut: false,
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
        return { ...initialState, boardData: { lanes: data.lanes } };
      }
    } catch {
      /* Do Nothing */
    }
    try {
      return parseMarkdown(text);
    } catch {
      const textByLine = text.split('\n');
      return {
        ...initialState,
        // The converter no longer re-emits parsingErrors, so the raw text
        // has to be kept here or the next save would erase the note.
        preamble: textByLine,
        parsingErrors: textByLine.map((lineText, lineIndex) => ({
          lineText,
          lineIndex,
          message: 'Complete Markdown parsing failure',
        })),
      };
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    if (!this.state.noteReceived) {
      this.waitTimer = setTimeout(
        () => this.setState({ waitTimedOut: true }),
        NOTE_WAIT_MS
      );
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    clearTimeout(this.waitTimer);
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.key.toLowerCase() !== 'z') {
      return;
    }
    // Inside a field, Ctrl+Z belongs to the browser's text undo; with the
    // card modal open it would change the board behind it.
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (document.body.classList.contains('ReactModal__Body--open')) {
      return;
    }
    e.preventDefault();
    this.stepHistory(e.shiftKey ? redoStep : undoStep);
  };

  undo = () => this.stepHistory(undoStep);

  handleQuadrantNamesChange = (quadrantNames: QuadrantNames) => {
    this.setState({ quadrantNames });
    this.saveNote(convertStateToMarkdown({ ...this.state, quadrantNames }));
  };

  stepHistory = (
    step: (h: History, board: KanbanBoard) => HistoryStep | null
  ) => {
    const result = step(this.undoHistory, this.state.boardData);
    if (!result) {
      return;
    }
    this.undoHistory = result.history;
    this.setState({ boardData: result.board });
    this.saveNote(
      convertStateToMarkdown({ ...this.state, boardData: result.board })
    );
  };

  clearUndoHistory = () => {
    this.undoHistory = emptyHistory;
  };

  receiveText = (text: string, noteId?: string) => {
    this.rawText = text;
    clearTimeout(this.waitTimer);
    // Our own save can be streamed back unchanged; only text the current
    // board would not have written came from another device or note.
    if (text !== convertStateToMarkdown(this.state)) {
      this.clearUndoHistory();
    }
    const newState = this.parseText(text);
    this.setState({
      ...initialState,
      ...newState,
      // Regenerate IDs deterministically at load time so lanes and
      // cards are draggable before the first edit happens.
      boardData: infuseBoardData(newState.boardData),
      noteReceived: true,
      noteId,
      waitTimedOut: false,
    });
  };

  configureEditorKit = () => {
    this.editorKit = new NoteBridge({
      setEditorRawText: this.receiveText,
      clearUndoHistory: this.clearUndoHistory,
    });
  };

  handleCardUpdate = (
    laneId: string,
    cardId: string,
    patch: Partial<KanbanCard>
  ) => {
    const boardData = updateCard(this.state.boardData, laneId, cardId, patch);
    this.undoHistory = recordChange(this.undoHistory, this.state.boardData);
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
    this.undoHistory = recordChange(this.undoHistory, this.state.boardData);
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
      // The standalone editor has no save bridge; ignore.
      void error;
    }
  };

  render() {
    if (!this.state.noteReceived) {
      return this.state.waitTimedOut ? (
        <div className="sn-component kbn-status" role="alert">
          <p>Note not received from Standard Notes. Reopen the note.</p>
          <p className="kbn-status-detail">
            Environment: {this.editorKit.environment ?? 'not reported'},
            platform: {this.editorKit.platform ?? 'not reported'}
          </p>
        </div>
      ) : (
        <div className="sn-component kbn-status" role="status">
          <span className="kbn-spinner" aria-hidden="true" />
          Loading note
        </div>
      );
    }
    return (
      <ModalProvider>
        <ErrorBoundary rawText={this.rawText} resetKey={this.state.boardData}>
          <EditorInternal
            boardData={this.state.boardData}
            handleDataChange={this.handleDataChange}
            onCardUpdate={this.handleCardUpdate}
            parsingErrors={this.state.parsingErrors}
            onUndo={this.undo}
            noteId={this.state.noteId}
            quadrantNames={this.state.quadrantNames}
            onQuadrantNamesChange={this.handleQuadrantNamesChange}
          />
        </ErrorBoundary>
      </ModalProvider>
    );
  }
}
