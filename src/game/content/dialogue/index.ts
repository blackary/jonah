import eastCity from './east-city.json';
import fish from './fish.json';
import joppa from './joppa.json';
import misc from './misc.json';
import nineveh from './nineveh.json';
import road from './road.json';
import ship from './ship.json';
import type { DialogueDefinition } from '../../types';

const allDialogue = [
  ...joppa,
  ...ship,
  ...fish,
  ...road,
  ...nineveh,
  ...eastCity,
  ...misc,
] as DialogueDefinition[];

export const DIALOGUES = Object.fromEntries(
  allDialogue.map((dialogue) => [dialogue.id, dialogue]),
) as Record<string, DialogueDefinition>;
