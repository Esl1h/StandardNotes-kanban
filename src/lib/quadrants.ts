import { Quadrant } from '../../types/kanban';

/**
 * Eisenhower quadrants in grid order: the top row is important, the left
 * column urgent.
 */
export const QUADRANTS: Quadrant[] = [
  'do',
  'schedule',
  'delegate',
  'eliminate',
];

export type QuadrantNames = Record<Quadrant, string>;

export const DEFAULT_QUADRANT_NAMES: QuadrantNames = {
  do: 'Do',
  schedule: 'Schedule',
  delegate: 'Delegate',
  eliminate: 'Eliminate',
};

export const toQuadrant = (value: string): Quadrant | undefined => {
  const key = value.trim().toLowerCase();
  return QUADRANTS.find((q) => q === key);
};
