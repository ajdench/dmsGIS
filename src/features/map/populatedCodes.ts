export function buildEffectivePopulatedCodes(
  populatedV10Codes: ReadonlySet<string>,
  populated2026Codes: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set([
    ...populatedV10Codes,
    ...populated2026Codes,
  ]);
}
