import { KanbanBoard, KanbanCard, KanbanLane } from '../../types/kanban';
import { stripIdMarker } from './ids';
import { toQuadrant } from './quadrants';
import { EditorInterface, ParsingErrors } from '../../types/editor';

enum Scope {
  Board = 'Board',
  Lane = 'Lane',
  Card = 'Card',
  Comments = 'Comments',
  Checklist = 'Checklist',
}

// The parser is tolerant on input and the converter strict on output, so
// notes edited elsewhere still load and are rewritten in the canonical form.
const LANE = /^#{1,2}\s+([\s\S]*)$/;
const CARD = /^[*+-]\s+([\s\S]*)$/;
const FIELD = /^ {2,}[*+-]\s+(description|due|label|quadrant):\s?([\s\S]*)$/i;
const LIST_HEADER = /^( {2,})[*+-]\s+(comments|checklist):\s*$/i;
const CONTINUATION = /^ {4,}>(?:\s([\s\S]*))?$/;
const CHECKLIST_ITEM = /^ +\[([xX ])\] ([\s\S]+)$/;
const COMMENT_ITEM = /^( +)[*+-] ([\s\S]*)$/;

// One leading tab is one indentation level (2 spaces). Tabs further into
// the line are content and stay untouched.
const expandLeadingTabs = (line: string): string =>
  line.replace(/^[ \t]+/, (indent) => indent.replace(/\t/g, '  '));

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
  // Comment items must be indented deeper than their "Comments:" header,
  // otherwise a comment such as "Due: friday" would be read as a field.
  let commentsIndent = 0;
  const parsingErrors: ParsingErrors[] = [];
  const preamble: string[] = [];

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    // Keeps the raw line under the card or lane it was written in so the
    // converter writes it back in place; otherwise it would drift to the
    // end of the note on every save.
    const reject = (message: string) => {
      parsingErrors.push({
        message,
        lineIndex: i,
        laneIndex,
        cardIndex,
        lineText: line,
      });
      const owner =
        cardIndex >= 0
          ? boardData.lanes[laneIndex].cards[cardIndex]
          : boardData.lanes[laneIndex];
      if (owner) {
        owner.extraLines = [...(owner.extraLines ?? []), line];
      } else {
        preamble.push(line);
      }
    };

    // The converter owns blank-line separators, so blanks carry no data.
    if (!line.trim()) {
      continue;
    }
    const norm = expandLeadingTabs(line);
    const laneMatch = LANE.exec(norm);
    const cardMatch = CARD.exec(norm);
    const fieldMatch = FIELD.exec(norm);
    const listMatch = LIST_HEADER.exec(norm);
    const continuation = CONTINUATION.exec(norm);
    const itemMatch =
      scope === Scope.Checklist ? CHECKLIST_ITEM.exec(norm) : null;
    const commentMatch =
      scope === Scope.Comments ? COMMENT_ITEM.exec(norm) : null;

    if (laneMatch) {
      laneIndex += 1;
      cardIndex = -1;
      scope = Scope.Lane;
      const { title, id } = stripIdMarker(laneMatch[1]);
      const lane: KanbanLane = { title, cards: [] };
      if (id) {
        lane.id = id;
      }
      boardData.lanes.push(lane);
    } else if (cardMatch) {
      if (boardData.lanes.length === 0) {
        reject('Cannot add cards before adding lanes!');
        continue;
      }
      const { title, id } = stripIdMarker(cardMatch[1]);
      const card: KanbanCard = { title };
      if (id) {
        card.id = id;
      }
      cardIndex += 1;
      scope = Scope.Card;
      boardData.lanes[laneIndex].cards.push(card);
    } else if (commentMatch && commentMatch[1].length > commentsIndent) {
      if (cardIndex < 0) {
        reject('Cannot add comments before adding a card!');
        continue;
      }
      boardData.lanes[laneIndex].cards[cardIndex].comments.push(
        commentMatch[2]
      );
    } else if (fieldMatch) {
      if (cardIndex < 0) {
        reject('Cannot add card fields before adding a card!');
        continue;
      }
      const card = boardData.lanes[laneIndex].cards[cardIndex];
      const field = fieldMatch[1].toLowerCase();
      if (field === 'quadrant') {
        const quadrant = toQuadrant(fieldMatch[2]);
        if (!quadrant) {
          reject('Unknown quadrant');
          continue;
        }
        card.quadrant = quadrant;
      } else {
        card[field as 'description' | 'due' | 'label'] = fieldMatch[2];
      }
    } else if (continuation) {
      // Multiline description continuation: "    > more text" appends to
      // the current card's description, keeping the note readable as
      // blockquoted Markdown.
      if (cardIndex < 0) {
        reject('Cannot add card fields before adding a card!');
        continue;
      }
      const text = (continuation[1] ?? '').trimStart();
      const card = boardData.lanes[laneIndex].cards[cardIndex];
      card.description = card.description
        ? `${card.description}\n${text}`
        : text;
    } else if (listMatch) {
      if (cardIndex < 0) {
        reject('Cannot add card fields before adding a card!');
        continue;
      }
      const card = boardData.lanes[laneIndex].cards[cardIndex];
      if (listMatch[2].toLowerCase() === 'comments') {
        scope = Scope.Comments;
        commentsIndent = listMatch[1].length;
        card.comments = [];
      } else {
        scope = Scope.Checklist;
        card.checklist = [];
      }
    } else if (itemMatch) {
      if (cardIndex < 0) {
        reject('Cannot add checklist items before adding a card!');
        continue;
      }
      boardData.lanes[laneIndex].cards[cardIndex].checklist!.push({
        done: itemMatch[1].toLowerCase() === 'x',
        text: itemMatch[2],
      });
    } else {
      reject('Cannot parse line');
    }
  }
  return {
    boardData,
    parsingErrors,
    preamble,
  };
};
