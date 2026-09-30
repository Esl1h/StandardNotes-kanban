import React, { useState } from 'react';
import Board from 'react-trello';
import { KanbanCardModal } from './KanbanCardModal';
import { useModal } from 'react-modal-hook';

export enum HtmlElementId {
  board = 'board',
  snComponent = 'sn-component',
}
export enum HtmlClassName {
  board = 'board',
  snComponent = 'sn-component',
}

export const EditorInternal = ({
  printUrl,
  boardData,
  handleDataChange,
  parsingErrors = [],
}) => {
  const [card, setCard] = useState({
    cardData: {
      title: '',
      description: '',
      label: '',
      comments: [],
    },
    metadata: null,
    cardId: null,
    laneId: null,
  });
  const [eventBus, setEventBus] = useState({
    publish: (event) => {},
  });
  const [errorsOpen, setErrorsOpen] = useState(true);
  const errorCount = parsingErrors.filter((e) => e.lineText).length;
  const [showModal, hideModal] = useModal(
    () => (
      <KanbanCardModal
        card={card.cardData}
        hideModal={hideModal}
        updateCard={(cardUpdate) => {
          eventBus.publish({
            type: 'UPDATE_CARD',
            laneId: card.laneId,
            card: {
              id: card.cardId,
              ...cardUpdate,
            },
          });
        }}
      />
    ),
    [card]
  );
  const openModal = (card) => {
    setCard(card);
    showModal();
  };
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
        id={HtmlElementId.board}
        className={HtmlClassName.board}
        data={boardData}
        canAddLanes
        editable
        editLaneTitle
        eventBusHandle={setEventBus}
        onCardClick={(cardId, metadata, laneId) => {
          const lane = boardData.lanes.find((lane) => lane.id === laneId);
          const cardData = lane?.cards.find((card) => card.id === cardId);
          if (!cardData) {
            return;
          }
          openModal({ cardId, cardData, metadata, laneId });
        }}
        onDataChange={handleDataChange}
      />
    </div>
  );
};
