import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ModalProvider } from 'react-modal-hook';
import Editor from './Editor';
import { EditorInternal } from './EditorInternal';
import { LabelColors } from '../lib/labels';

const boardWithOneCard = () => ({
  lanes: [
    {
      id: 'laneA',
      title: 'Todo',
      cards: [{ id: 'c1', title: 'Write docs', laneId: 'laneA' }],
    },
  ],
});

const openCard = (title: string) => {
  fireEvent.click(screen.getByText(title));
  return screen.getByRole('dialog');
};

const typeLabel = (dialog: HTMLElement, label: string) =>
  fireEvent.change(within(dialog).getByPlaceholderText('red, blue'), {
    target: { value: label },
  });

test('typing a label offers swatches that assign its color live', () => {
  const Harness = () => {
    const [board] = useState(boardWithOneCard);
    const [labelColors, setLabelColors] = useState<LabelColors | undefined>();
    return (
      <ModalProvider>
        <EditorInternal
          boardData={board}
          handleDataChange={() => {}}
          onCardUpdate={() => {}}
          labelColors={labelColors}
          onLabelColorsChange={setLabelColors}
        />
      </ModalProvider>
    );
  };
  render(<Harness />);
  const dialog = openCard('Write docs');
  typeLabel(dialog, 'urgent');

  fireEvent.click(within(dialog).getByLabelText('Set urgent to red'));

  const swatches = dialog.querySelector('.kbn-label-colors') as HTMLElement;
  expect(within(swatches).getByText('urgent').style.backgroundColor).toBe(
    'rgb(224, 82, 82)'
  );
  expect(within(dialog).getByLabelText('Set urgent to red')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('clearing the color renders the chip neutral again', () => {
  const Harness = () => {
    const [board] = useState(boardWithOneCard);
    const [labelColors, setLabelColors] = useState<LabelColors | undefined>({
      urgent: 'red',
    });
    return (
      <ModalProvider>
        <EditorInternal
          boardData={{
            ...board,
            lanes: [
              {
                ...board.lanes[0],
                cards: [{ ...board.lanes[0].cards[0], label: 'urgent' }],
              },
            ],
          }}
          handleDataChange={() => {}}
          onCardUpdate={() => {}}
          labelColors={labelColors}
          onLabelColorsChange={setLabelColors}
        />
      </ModalProvider>
    );
  };
  render(<Harness />);
  const dialog = openCard('Write docs');

  fireEvent.click(within(dialog).getByLabelText('Clear urgent color'));

  const swatches = dialog.querySelector('.kbn-label-colors') as HTMLElement;
  expect(within(swatches).getByText('urgent').style.backgroundColor).toBe('');
  expect(within(dialog).getByLabelText('Clear urgent color')).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('a color picked in the modal is saved in the note', () => {
  const ref = React.createRef<Editor>();
  const saved: string[] = [];
  render(
    <Editor ref={ref} boardData={boardWithOneCard()} parsingErrors={[]} />
  );
  ref.current!.editorKit = {
    onEditorValueChanged: (text: string) => saved.push(text),
  };

  const dialog = openCard('Write docs');
  typeLabel(dialog, 'urgent');
  fireEvent.click(within(dialog).getByLabelText('Set urgent to red'));

  expect(saved[0]).toContain('Labels: urgent=red');
});
