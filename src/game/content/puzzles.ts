import type { PuzzleDefinition, TriviaGate } from '../types';

export const PUZZLES: Record<string, PuzzleDefinition> = {
  cargo_cleats: {
    id: 'cargo_cleats',
    label: 'Cargo Cleats',
    targetState: [1, 0, 1],
    labels: ['Port Cleat', 'Center Cleat', 'Starboard Cleat'],
  },
  fish_sigils: {
    id: 'fish_sigils',
    label: 'Luminescent Sigils',
    targetState: [1, 1, 0, 1],
    labels: ['North Sigil', 'West Sigil', 'East Sigil', 'South Sigil'],
  },
};

export const TRIVIA_GATES: Record<string, TriviaGate> = {
  joppa_call: {
    id: 'joppa_call',
    tags: ['jonah1'],
    questionsRequired: 1,
  },
  ship_lots: {
    id: 'ship_lots',
    tags: ['jonah1', 'jonah2'],
    questionsRequired: 1,
  },
  fish_prayer: {
    id: 'fish_prayer',
    tags: ['jonah2'],
    questionsRequired: 2,
  },
  nineveh_gate: {
    id: 'nineveh_gate',
    tags: ['jonah3'],
    questionsRequired: 1,
  },
  king_response: {
    id: 'king_response',
    tags: ['jonah3'],
    questionsRequired: 1,
  },
  east_city_reflection: {
    id: 'east_city_reflection',
    tags: ['jonah4'],
    questionsRequired: 1,
  },
};
