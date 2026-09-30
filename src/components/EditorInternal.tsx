import React, { useState } from 'react';
import { useModal } from 'react-modal-hook';
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
  printUrl?: boolean;
  boardData: KanbanBoard;
  handleDataChange: (board: KanbanBoard | string) => void;
  onCardUpdate: (laneId: string, cardId: string, patch: Partial<KanbanCard>) => void;
  parsingErrors?: ParsingErrors[];
}

export const EditorInternal = ({
  printUrl,
  boardData,
  handleDataChange,
  onCardUpdate,
  parsingErrors = [],
}: EditorInternalProps) => {
  const [modalTarget, setModalTarget] = useState<{
    laneId: string;
    cardId: string;
  } | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(true);
  const errorCount = parsingErrors.filter((e) => e.lineText).length;

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
    <div
      className={`${HtmlClassName.snComponent}${printUrl ? ' print-url' : ''}`}
      id={HtmlElementId.snComponent}
      tabIndex={0}
    >
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
      <Board
        data={boardData}
        onDataChange={handleDataChange}
        onCardClick={(laneId, cardId) => setModalTarget({ laneId, cardId })}
      />
    </div>
  );
};
