import React, { useState } from 'react';
import { useModal } from 'react-modal-hook';
import { IconX } from '@tabler/icons-react';
import { Board } from './Board';
import { ExportMenu } from './ExportMenu';
import { Matrix } from './Matrix';
import { KanbanCardModal } from './KanbanCardModal';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { ParsingErrors } from '../../types/editor';
import { moveCard } from '../lib/boardOps';
import { DUE_FILTERS, DueFilter, hasFilter, toggleFilter } from '../lib/filter';
import { chipStyle, daysUntil, labelChips } from '../lib/labels';
import { DEFAULT_QUADRANT_NAMES, QuadrantNames } from '../lib/quadrants';
import { readCollapsed, writeCollapsed } from '../lib/collapsedPreference';
import {
  PreferenceStore,
  readView,
  View,
  writeView,
} from '../lib/viewPreference';

const snComponentId = 'sn-component';

const DUE_LABELS: Record<DueFilter, string> = {
  overdue: 'Overdue',
  today: 'Today',
  week: 'This week',
};

interface EditorInternalProps {
  boardData: KanbanBoard;
  handleDataChange: (board: KanbanBoard | string) => void;
  onCardUpdate: (
    laneId: string,
    cardId: string,
    patch: Partial<KanbanCard>
  ) => void;
  parsingErrors?: ParsingErrors[];
  onUndo?: () => void;
  /** Identifies the note so each one remembers its own view. */
  noteId?: string;
  quadrantNames?: QuadrantNames;
  onQuadrantNamesChange?: (names: QuadrantNames) => void;
  /** Where each note's view is remembered, apart from the note itself. */
  preferences?: PreferenceStore;
}

export const EditorInternal = ({
  boardData,
  handleDataChange,
  onCardUpdate,
  parsingErrors = [],
  onUndo,
  noteId,
  quadrantNames = DEFAULT_QUADRANT_NAMES,
  onQuadrantNamesChange,
  preferences,
}: EditorInternalProps) => {
  const [modalTarget, setModalTarget] = useState<{
    laneId: string;
    cardId: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [errorsOpen, setErrorsOpen] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [view, setView] = useState<View>(() => readView(preferences, noteId));
  const [viewNoteId, setViewNoteId] = useState(noteId);
  if (viewNoteId !== noteId) {
    // Another note was opened: show the view that note was left in.
    setViewNoteId(noteId);
    setView(readView(preferences, noteId));
  }
  const changeView = (next: View) => {
    setView(next);
    writeView(preferences, noteId, next);
  };
  // What the filter bar offers: the labels of the cards on screen, and the
  // due filters when any of them has a date.
  const filterable = boardData.lanes
    .filter((lane) => showDone || !lane.done)
    .flatMap((lane) => lane.cards);
  const filterLabels = Array.from(
    new Map(
      filterable
        .flatMap((card) => labelChips(card.label))
        .map((chip) => [chip.name.toLowerCase(), chip])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));
  const hasDueDates = filterable.some((card) => daysUntil(card.due) !== null);
  const doneLanes = boardData.lanes.filter((lane) => lane.done);
  const doneCount = doneLanes.reduce((n, lane) => n + lane.cards.length, 0);
  const errorCount = parsingErrors.filter((e) => e.lineText).length;
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  // Ctrl/Cmd+F focuses the in-board search while the editor has focus.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
        ) {
          return;
        }
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const closeModal = () => {
    hideModal();
    setModalTarget(null);
  };

  const moveModalCard = (toLaneId: string) => {
    if (!modalTarget) {
      return;
    }
    const fromLane = boardData.lanes.find((l) => l.id === modalTarget.laneId);
    const toLane = boardData.lanes.find((l) => l.id === toLaneId);
    const index =
      fromLane?.cards.findIndex((c) => c.id === modalTarget.cardId) ?? -1;
    if (!toLane || index < 0 || toLane === fromLane) {
      return;
    }
    handleDataChange(
      moveCard(
        boardData,
        modalTarget.laneId,
        index,
        toLaneId,
        toLane.cards.length
      )
    );
    // Edits still pending in the modal are saved against this lane when it
    // closes, so it has to follow the card.
    setModalTarget({ laneId: toLaneId, cardId: modalTarget.cardId });
  };

  const [showModal, hideModal] = useModal(() => {
    const lane = boardData.lanes.find((l) => l.id === modalTarget?.laneId);
    const card = lane?.cards.find((c) => c.id === modalTarget?.cardId);
    if (!card || !modalTarget) {
      return null;
    }
    return (
      <KanbanCardModal
        card={card}
        lanes={boardData.lanes}
        laneId={modalTarget.laneId}
        quadrantNames={quadrantNames}
        onMove={moveModalCard}
        hideModal={closeModal}
        updateCard={(patch) =>
          onCardUpdate(modalTarget.laneId, modalTarget.cardId, patch)
        }
      />
    );
  }, [modalTarget, boardData, quadrantNames]);

  React.useEffect(() => {
    if (modalTarget) {
      showModal();
    }
    // showModal is stable in react-modal-hook; only the target change
    // should open the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalTarget]);

  return (
    <div className="sn-component" id={snComponentId} tabIndex={0}>
      {errorCount > 0 && (
        <div className="parse-errors" role="alert">
          <button
            type="button"
            className="parse-errors-toggle"
            onClick={() => setErrorsOpen(!errorsOpen)}
          >
            {errorsOpen ? '▾' : '▸'} {errorCount} line
            {errorCount === 1 ? '' : 's'} could not be read (preserved as-is)
          </button>
          {errorsOpen && (
            <ul>
              {parsingErrors
                .filter((e) => e.message)
                .map((e, i) => (
                  <li key={`${e.lineIndex}-${i}`}>
                    Line {e.lineIndex + 1}: {e.message}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
      <div className="kbn-toolbar">
        <input
          ref={searchRef}
          type="search"
          className="kbn-input kbn-search"
          placeholder="Search title, description or label"
          title="Also label:name and due:overdue, due:today or due:week"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search cards"
        />
        {query && (
          <button
            type="button"
            className="kbn-icon-btn"
            aria-label="Clear search"
            onClick={() => setQuery('')}
          >
            <IconX size={14} stroke={1.5} />
          </button>
        )}
        <div className="kbn-view-toggle" role="group" aria-label="View">
          {(['board', 'matrix'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              className="kbn-btn kbn-btn-ghost kbn-toolbar-btn"
              aria-pressed={view === v}
              onClick={() => changeView(v)}
            >
              {v === 'board' ? 'Board' : 'Matrix'}
            </button>
          ))}
        </div>
        {doneLanes.length > 0 && (
          <button
            type="button"
            className="kbn-btn kbn-btn-ghost kbn-toolbar-btn"
            aria-pressed={showDone}
            title={showDone ? 'Hide finished cards' : 'Show finished cards'}
            onClick={() => setShowDone(!showDone)}
          >
            Done ({doneCount})
          </button>
        )}
        <ExportMenu board={boardData} quadrantNames={quadrantNames} />
      </div>
      {(hasDueDates || filterLabels.length > 0) && (
        <div className="kbn-filters" role="group" aria-label="Filters">
          {hasDueDates &&
            DUE_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                className="kbn-btn kbn-btn-ghost kbn-toolbar-btn"
                aria-pressed={hasFilter(query, 'due', value)}
                onClick={() => setQuery(toggleFilter(query, 'due', value))}
              >
                {DUE_LABELS[value]}
              </button>
            ))}
          {filterLabels.map((chip) => (
            <button
              key={chip.name}
              type="button"
              className="kbn-card-chip kbn-filter-chip"
              style={chipStyle(chip.color)}
              aria-pressed={hasFilter(query, 'label', chip.name)}
              onClick={() => setQuery(toggleFilter(query, 'label', chip.name))}
            >
              {chip.name}
            </button>
          ))}
        </div>
      )}
      {view === 'matrix' ? (
        <Matrix
          data={boardData}
          filter={query}
          showDone={showDone}
          quadrantNames={quadrantNames}
          onDataChange={handleDataChange}
          onUndo={onUndo}
          onCardClick={(laneId, cardId) => setModalTarget({ laneId, cardId })}
          onSearchRequest={setQuery}
          onRenameQuadrant={(quadrant, name) =>
            onQuadrantNamesChange?.({ ...quadrantNames, [quadrant]: name })
          }
        />
      ) : (
        <Board
          // Each note remembers its own collapsed lanes.
          key={noteId ?? ''}
          data={boardData}
          filter={query}
          onDataChange={handleDataChange}
          onCardClick={(laneId, cardId) => setModalTarget({ laneId, cardId })}
          onSearchRequest={setQuery}
          onUndo={onUndo}
          showDone={showDone}
          loadCollapsed={() => readCollapsed(preferences, noteId)}
          onCollapsedChange={(collapsed) =>
            writeCollapsed(preferences, noteId, collapsed)
          }
        />
      )}
    </div>
  );
};
