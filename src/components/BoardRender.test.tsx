import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { infuseBoardData } from '../lib/helpers';
import boardWithComments from '../mocks/boardWithComments';

test('renders lanes and cards from board data', () => {
  const { container } = render(
    <ModalProvider>
      <EditorInternal
        boardData={infuseBoardData(boardWithComments)}
        handleDataChange={() => {}}
        onCardUpdate={() => {}}
        parsingErrors={[]}
      />
    </ModalProvider>
  );
  const lanes = container.querySelectorAll('.kbn-lane');
  const cards = container.querySelectorAll('.kbn-card');
  expect(lanes).toHaveLength(2);
  expect(cards).toHaveLength(3);
  expect(screen.getByText('Lane 1')).toBeInTheDocument();
});
