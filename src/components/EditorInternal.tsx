import React, { useState } from 'react';
import { useModal } from 'react-modal-hook';
import { IconX } from '@tabler/icons-react';
import { Board } from './Board';
import { KanbanCardModal } from './KanbanCardModal';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { ParsingErrors } from '../../types/editor';

export enum HtmlElementId {
  snComponent = 'sn-component',
}
export enum HtmlClassName {
  snComponent = 'sn-component',
}

interface EditorInternalProps {
  boardData: KanbanBoard;
  handleDataChange: (board: KanbanBoard | string) => void;
  onCardUpdate: (laneId: string, cardId: string, patch: Partial<KanbanCard>) => void;
  parsingErrors?: ParsingErrors[];
}

export const EditorInternal = ({
  boardData,
  handleDataChange,
  onCardUpdate,
  parsingErrors = [],
}: EditorInternalProps) => {
  const [modalTarget, setModalTarget] = useState<{
    laneId: string;
    cardId: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [errorsOpen, setErrorsOpen] = useState(true);
  const errorCount = parsingErrors.filter((e) => e.lineText).length;
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  // Ctrl/Cmd+F focuses the in-board search while the editor has focus.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
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

  const [showModal, hideModal] = useModal(
    () => {
      const lane = boardData.lanes.find((l) => l.id === modalTarget?.laneId);
      const card = lane?.cards.find((c) => c.id === modalTarget?.cardId);
      if (!card || !modalTarget) {
        return null;
      }
      return (
        <KanbanCardModal
          card={card}
          hideModal={closeModal}
          updateCard={(patch) =>
            onCardUpdate(modalTarget.laneId, modalTarget.cardId, patch)
          }
        />
      );
    },
    [modalTarget, boardData]
  );

  React.useEffect(() => {
    if (modalTarget) {
      showModal();
    }
    // showModal is stable in react-modal-hook; only the target change
    // should open the modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalTarget]);

  return (
    <div className={HtmlClassName.snComponent} id={HtmlElementId.snComponent} tabIndex={0}>
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
      </div>
      <Board
        data={boardData}
        filter={query}
        onDataChange={handleDataChange}
        onCardClick={(laneId, cardId) => setModalTarget({ laneId, cardId })}
        onSearchRequest={setQuery}
      />
    </div>
  );
};
