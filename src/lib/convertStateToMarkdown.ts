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

// Lines are the unit of the format, so a line break inside a title, label
// or comment would turn its tail into a different line on the next load.
const oneLine = (text: string): string => text.replace(/\r?\n/g, ' ');

const convertBoardData = (boardData: KanbanBoard): string => {
  const boardText = boardData.lanes
    .map(
      (lane) =>
        `# ${withIdMarker(oneLine(lane.title), lane.id)}\n${convertExtraLines(
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
        lines.push(`  * Due: ${oneLine(card.due)}`);
      }
      if (card.label) {
        lines.push(`  * Label: ${oneLine(card.label)}`);
      }
      if (card.quadrant) {
        lines.push(`  * Quadrant: ${card.quadrant}`);
      }
      if (card.checklist && card.checklist.length > 0) {
        lines.push('  * Checklist:');
        card.checklist.forEach((item) =>
          lines.push(`    [${item.done ? 'x' : ' '}] ${oneLine(item.text)}`)
        );
      }
      if (card.comments && card.comments.length > 0) {
        lines.push('  * Comments:');
        card.comments.forEach((comment) =>
          lines.push(`    * ${oneLine(comment)}`)
        );
      }
      return `* ${withIdMarker(oneLine(card.title), card.id)}${
        lines.length > 0 ? `\n${lines.join('\n')}` : ''
      }`;
    })
    .join('\n');

const addNewlineIfNotEmpty = (text: string): string => {
  return text ? `${text}\n` : '';
};
