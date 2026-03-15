import type { RequirementSet, SaveState } from '../types';

export function meetsRequirements(
  requirement: RequirementSet | undefined,
  save: SaveState,
): boolean {
  if (!requirement) {
    return true;
  }

  if (requirement.allFlags?.some((flag) => save.flags[flag] !== true)) {
    return false;
  }

  if (requirement.notFlags?.some((flag) => save.flags[flag] === true)) {
    return false;
  }

  if (requirement.hasItems?.some((item) => !save.inventory.includes(item))) {
    return false;
  }

  if (requirement.lacksItems?.some((item) => save.inventory.includes(item))) {
    return false;
  }

  if (requirement.values) {
    for (const [key, value] of Object.entries(requirement.values)) {
      if (save.flags[key] !== value) {
        return false;
      }
    }
  }

  if (requirement.minValues) {
    for (const [key, value] of Object.entries(requirement.minValues)) {
      if (Number(save.flags[key] ?? 0) < value) {
        return false;
      }
    }
  }

  return true;
}
