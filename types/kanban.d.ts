export interface KanbanChecklistItem {
  done: boolean;
  text: string;
}
export interface KanbanCard {
  id?: string;
  title: string;
  description?: string;
  label?: string;
  due?: string;
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
  /** Lines the parser did not understand, kept here to be written back. */
  extraLines?: Array<string>;
}
export interface KanbanBoard {
  lanes: Array<KanbanLane>;
}
