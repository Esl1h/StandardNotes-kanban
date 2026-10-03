import { withIdMarker } from './ids';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { EditorInterface } from '../../types/editor';

export const convertStateToMarkdown = (state: EditorInterface): string => {
  const { boardData, preamble = [] } = state;

  const boardText = convertBoardData(boardData);
  // Unrecognized lines that came before the first lane stay on top.
  const preambleText =
    preamble.length > 0
      ? `${preamble.join('\n')}\n${boardText ? '\n' : ''}`
      : '';
  return `${preambleText}${boardText}`;
};

const convertBoardData = (boardData: KanbanBoard): string => {
  const boardText = boardData.lanes
    .map(
      (lane) =>
        `# ${withIdMarker(lane.title, lane.id)}\n${convertExtraLines(
          lane.extraLines
        )}${convertCards(lane.cards)}`
    )
    .join('\n\n');
  return addNewlineIfNotEmpty(boardText);
};

const convertExtraLines = (lines: string[] = []): string =>
  lines.map((line) => `${line}\n`).join('');

const convertCards = (cards: Array<KanbanCard>): string =>
  cards
    .map((card) => {
      // Extra lines go right under the title, where the parser sees them
      // in the same scope as before: scope-dependent lines (checklist items,
      // comments) can't be captured by a field written above them.
      const lines: string[] = [...(card.extraLines ?? [])];
      if (card.description) {
        const [first, ...rest] = card.description.split('\n');
        lines.push(`  * Description: ${first}`);
        rest.forEach((text) => lines.push(`    > ${text}`));
      }
      if (card.due) {
        lines.push(`  * Due: ${card.due}`);
      }
      if (card.label) {
        lines.push(`  * Label: ${card.label}`);
      }
      if (card.checklist && card.checklist.length > 0) {
        lines.push('  * Checklist:');
        card.checklist.forEach((item) =>
          lines.push(`    [${item.done ? 'x' : ' '}] ${item.text}`)
        );
      }
      if (card.comments && card.comments.length > 0) {
        lines.push('  * Comments:');
        card.comments.forEach((comment) => lines.push(`    * ${comment}`));
      }
      return `* ${withIdMarker(card.title, card.id)}${
        lines.length > 0 ? `\n${lines.join('\n')}` : ''
      }`;
    })
    .join('\n');

const addNewlineIfNotEmpty = (text: string): string => {
  return text ? `${text}\n` : '';
};
