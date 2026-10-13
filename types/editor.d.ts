import { KanbanBoard, Quadrant } from './kanban';

export interface EditorInterface {
  boardData: KanbanBoard;
  parsingErrors: ParsingErrors[];
  /** Unrecognized lines found before the first lane, kept at the top. */
  preamble?: string[];
  /** Display names of the Eisenhower quadrants, when renamed. */
  quadrantNames?: Record<Quadrant, string>;
  /** Palette color per label name, from the note's Labels: line. */
  labelColors?: Record<string, string>;
}

export interface ParsingErrors {
  message: string;
  lineIndex: number;
  lineText: string;
  laneIndex?: number;
  cardIndex?: number;
}
