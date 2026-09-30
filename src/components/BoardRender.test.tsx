import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import { EditorInternal } from './EditorInternal';
import { infuseBoardData } from '../lib/helpers';
import boardWithComments from '../mocks/boardWithComments';

test('renders lanes from board data', () => {
  const { container } = render(
    <ModalProvider>
      <EditorInternal
        printUrl={false}
        boardData={infuseBoardData(boardWithComments)}
        handleDataChange={() => {}}
        parsingErrors={[]}
      />
    </ModalProvider>
  );
  const lanes = container.querySelectorAll('.react-trello-lane');
  const cards = container.querySelectorAll('.react-trello-card');
  // eslint-disable-next-line no-console
  console.log('LANES:', lanes.length, 'CARDS:', cards.length);
  expect(screen.getByText('Lane 1')).toBeInTheDocument();
});
