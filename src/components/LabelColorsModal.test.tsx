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
  // The card title is the inline-rename button; the card body opens
  // the modal.
  fireEvent.click(screen.getByText(title).closest('.kbn-card')!);
  return screen.getByRole('dialog');
};

const typeLabel = (dialog: HTMLElement, label: string) => {
  const input = within(dialog).getByLabelText('Add label');
  fireEvent.change(input, { target: { value: label } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

const chipInput = (dialog: HTMLElement) =>
  dialog.querySelector('.kbn-label-input-chips') as HTMLElement;

test('Enter turns the typed label into a chip', () => {
  const Harness = () => {
    const [board] = useState(boardWithOneCard);
    return (
      <ModalProvider>
        <EditorInternal boardData={board} handleDataChange={() => {}} onCardUpdate={() => {}} />
      </ModalProvider>
    );
  };
  render(<Harness />);
  const dialog = openCard('Write docs');

  typeLabel(dialog, 'urgent');

  expect(within(dialog).getByText('urgent')).toBeInTheDocument();
});

test('the chip remove button takes the label off', () => {
  const Harness = () => {
    const [board] = useState(() => ({
      lanes: [
        {
          id: 'laneA',
          title: 'Todo',
          cards: [
            {
              id: 'c1',
              title: 'Write docs',
              laneId: 'laneA',
              label: 'urgent, later',
            },
          ],
        },
      ],
    }));
    return (
      <ModalProvider>
        <EditorInternal boardData={board} handleDataChange={() => {}} onCardUpdate={() => {}} />
      </ModalProvider>
    );
  };
  render(<Harness />);
  const dialog = openCard('Write docs');

  fireEvent.click(within(dialog).getByLabelText('Remove label urgent'));

  expect(within(chipInput(dialog)).queryByText('urgent')).not.toBeInTheDocument();
  expect(within(chipInput(dialog)).getByText('later')).toBeInTheDocument();
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

  fireEvent.click(within(dialog).getByLabelText('Set color of urgent'));
  fireEvent.click(within(dialog).getByLabelText('Set urgent to red'));

  const chip = within(chipInput(dialog)).getByText('urgent');
  expect(chip.style.backgroundColor).toBe('rgb(224, 82, 82)');
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

  fireEvent.click(within(dialog).getByLabelText('Set color of urgent'));
  fireEvent.click(within(dialog).getByLabelText('Clear urgent color'));

  const chip = within(chipInput(dialog)).getByText('urgent');
  expect(chip.style.backgroundColor).toBe('');
});

test('a color picked in the modal is saved in the note', () => {
  const ref = React.createRef<Editor>();
  const saved: string[] = [];
  render(<Editor ref={ref} boardData={boardWithOneCard()} parsingErrors={[]} />);
  ref.current!.editorKit = {
    onEditorValueChanged: (text: string) => saved.push(text),
  };

  const dialog = openCard('Write docs');
  typeLabel(dialog, 'urgent');
  fireEvent.click(within(dialog).getByLabelText('Set color of urgent'));
  fireEvent.click(within(dialog).getByLabelText('Set urgent to red'));

  expect(saved[0]).toContain('Labels: urgent=red');
});
