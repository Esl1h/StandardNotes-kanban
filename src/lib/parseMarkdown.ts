import { KanbanBoard, KanbanCard, KanbanLane } from '../../types/kanban';
import { stripIdMarker } from './ids';
import { EditorInterface, ParsingErrors } from '../../types/editor';

enum Scope {
  Board = 'Board',
  Lane = 'Lane',
  Card = 'Card',
  Comments = 'Comments',
  Checklist = 'Checklist',
}

/**
 * Parses our Markdown code and transforms it into a state object
 * @param {string} markdown
 * @return {EditorInterface}
 */
export const parseMarkdown = (markdown: string): EditorInterface => {
  const boardData: KanbanBoard = {
    lanes: [],
  };
  const lines = markdown.split('\n');
  let laneIndex = -1; // a value of -1 denotes that we aren't in a lane
  let cardIndex = -1; // or card
  let scope = Scope.Board;
  const parsingErrors: ParsingErrors[] = [];

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const errorData = (message: string) => ({
      message,
      lineIndex: i,
      laneIndex,
      cardIndex,
      lineText: line,
    });

    if (!line) {
      if (
        i === 0 ||
        (parsingErrors.length > 0 &&
          parsingErrors[parsingErrors.length - 1].lineIndex === i - 1)
      ) {
        parsingErrors.push(errorData(''));
      }
      continue;
    }
    if (line.startsWith('# ')) {
      laneIndex += 1;
      cardIndex = -1;
      scope = Scope.Lane;
      const { title, id } = stripIdMarker(line.slice(2));
      const lane: KanbanLane = { title, cards: [] };
      if (id) {
        lane.id = id;
      }
      boardData.lanes.push(lane);
    } else if (line.startsWith('* ')) {
      if (boardData.lanes.length === 0) {
        parsingErrors.push(errorData('Cannot add cards before adding lanes!'));
        continue;
      }
      const { title, id } = stripIdMarker(line.slice(2));
      const card: KanbanCard = { title };
      if (id) {
        card.id = id;
      }
      cardIndex += 1;
      scope = Scope.Card;
      boardData.lanes[laneIndex].cards.push(card);
    } else if (line.toLowerCase().startsWith('  * description: ')) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add card fields before adding a card!')
        );
        continue;
      }
      boardData.lanes[laneIndex].cards[cardIndex].description = line.slice(17);
    } else if (line.startsWith('    > ') || line.trim() === '    >') {
      // Multiline description continuation: "    > more text" appends to
      // the current card's description, keeping the note readable as
      // blockquoted Markdown.
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add card fields before adding a card!')
        );
        continue;
      }
      const continuation = line.slice(line.indexOf('>') + 1).trimStart();
      const card = boardData.lanes[laneIndex].cards[cardIndex];
      card.description = card.description
        ? `${card.description}\n${continuation}`
        : continuation;
    } else if (line.toLowerCase().startsWith('  * due: ')) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add card fields before adding a card!')
        );
        continue;
      }
      boardData.lanes[laneIndex].cards[cardIndex].due = line.slice(9);
    } else if (line.toLowerCase().startsWith('  * label: ')) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add card fields before adding a card!')
        );
        continue;
      }
      boardData.lanes[laneIndex].cards[cardIndex].label = line.slice(11);
    } else if (line.toLowerCase().startsWith('  * comments:')) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add card fields before adding a card!')
        );
        continue;
      }
      scope = Scope.Comments;
      boardData.lanes[laneIndex].cards[cardIndex].comments = [];
    } else if (line.toLowerCase().startsWith('  * checklist:')) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add card fields before adding a card!')
        );
        continue;
      }
      scope = Scope.Checklist;
      boardData.lanes[laneIndex].cards[cardIndex].checklist = [];
    } else if (scope === Scope.Checklist && /^ +\[[xX ]\] ./.test(line)) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add checklist items before adding a card!')
        );
        continue;
      }
      const match = /^ +\[([xX ])\] (.*)$/.exec(line)!;
      boardData.lanes[laneIndex].cards[cardIndex].checklist!.push({
        done: match[1].toLowerCase() === 'x',
        text: match[2],
      });
    } else if (
      scope === Scope.Comments &&
      line.toLowerCase().startsWith('    * ')
    ) {
      if (cardIndex < 0) {
        parsingErrors.push(
          errorData('Cannot add comments before adding a card!')
        );
        continue;
      }
      boardData.lanes[laneIndex].cards[cardIndex].comments.push(line.slice(6));
    } else {
      parsingErrors.push(errorData('Cannot parse line'));
    }
  }
  return {
    boardData,
    parsingErrors,
  };
};
