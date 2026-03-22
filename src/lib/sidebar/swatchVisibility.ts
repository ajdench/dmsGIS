/**
 * Resolves the opacity to pass to a sidebar pill swatch for a given row.
 *
 * SUNSETTED FEATURE — hide-swatch-when-off
 * ----------------------------------------
 * The original behaviour set swatch opacity to 0 when a row was in the Off
 * state, making the colour dot invisible. The intent was to signal that the
 * layer was inactive. In practice it looked inconsistent: the colour dot is
 * useful precisely when a row is off, as it helps the user identify which
 * layer they are about to re-enable.
 *
 * The feature is preserved here as a single named, re-activatable control.
 * To re-enable globally, set HIDE_SWATCH_WHEN_OFF to true.
 * To apply selectively, pass an explicit override as the third argument.
 */
const HIDE_SWATCH_WHEN_OFF = false;

export function resolvePillSwatchOpacity(
  opacity: number,
  visible: boolean,
  hideWhenOff: boolean = HIDE_SWATCH_WHEN_OFF,
): number {
  return hideWhenOff ? (visible ? opacity : 0) : opacity;
}
