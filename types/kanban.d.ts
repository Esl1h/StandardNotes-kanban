export interface KanbanChecklistItem {
  done: boolean;
  text: string;
}
export type Quadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

export interface KanbanCard {
  id?: string;
  title: string;
  description?: string;
  label?: string;
  due?: string;
  /** Eisenhower matrix placement; unset means unclassified. */
  quadrant?: Quadrant;
  laneId?: string;
  checklist?: Array<KanbanChecklistItem>;
  comments?: Array<string>;
  /** Lines the parser did not understand, kept here to be written back. */
  extraLines?: Array<string>;
}
export interface KanbanLane {
  id?: string;
  title: string;
  cards: Array<KanbanCard>;
  /** Cards in this lane count as finished and are hidden by default. */
  done?: boolean;
  /** Lines the parser did not understand, kept here to be written back. */
  extraLines?: Array<string>;
}
export interface KanbanBoard {
  lanes: Array<KanbanLane>;
}
