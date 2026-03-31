export const PMC_REGION_ORDER = [
  'Scotland & Northern Ireland',
  'North',
  'Wales & West Midlands',
  'East',
  'South West',
  'Central & Wessex',
  'London & South',
  'Overseas',
  'Royal Navy',
] as const;

export function sortItemsByPmcRegionOrder<T extends { name: string }>(
  items: T[],
): T[] {
  return [...items].sort((left, right) => {
    const leftIndex = PMC_REGION_ORDER.indexOf(
      left.name as (typeof PMC_REGION_ORDER)[number],
    );
    const rightIndex = PMC_REGION_ORDER.indexOf(
      right.name as (typeof PMC_REGION_ORDER)[number],
    );

    if (leftIndex === -1 && rightIndex === -1) {
      return 0;
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });
}

/** Removes scenario prefixes for UI-only region labels while preserving stored names. */
export function stripScenarioRegionPrefix(name: string): string {
  return name.replace(/^(?:JMC|COA 3a|COA 3b)\s+/, '');
}

/** Keep the phrase after "&" together so wrapped labels break as
 *  "Wales &" / "West Midlands" instead of "Wales & West" / "Midlands". */
export function wrapRegionLabel(name: string): string {
  return name.replace(/& (.+)$/, (_, tail: string) =>
    `& ${tail.replace(/ /g, '\u00A0')}`,
  );
}
