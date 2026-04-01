import './topBar.css';
import { Fragment, useState } from 'react';
import { exportCurrentMapView } from '../../features/export/exportCurrentMapView';
import { isDphcEstimateCoaPlaygroundWorkspaceId } from '../../lib/config/scenarioWorkspaces';
import { VIEW_PRESET_BUTTONS } from '../../lib/config/viewPresets';
import { useAppStore } from '../../store/appStore';

const MIDDLE_PANE_COUNT = 6;
const MIDDLE_SPACER_PANE_COUNT = MIDDLE_PANE_COUNT - 2;
const TOPBAR_VERSION = 'v3';
const BRAND_SUBTITLE = 'Dench | Co';
const BRAND_DESCRIPTOR_LINES = ['Geographic', 'Information', 'Service'] as const;
const FUNCTIONS_LABEL = 'Functions';
const NON_COMBINED_PRACTICE_LABEL = 'Combined Practice';
const LOCAL_DPHC_SERVICES_LABEL = 'Local DPHC Services';
const POPULATION_AT_RISK_LABEL = 'Population at Risk (PAR)';
const PORTSMOUTH_COMBINED_PRACTICE_NAME = 'Portsmouth Combined Medical Practice';
const PORTSMOUTH_FULL_WIDTH_MEMBER_NAMES = new Set(['Southwick Park', 'Thorney Island']);
type ParSummaryRow = {
  label: string;
  valueKey:
    | 'facilityPar'
    | 'practicePar'
    | 'regionPar'
    | 'baseportPar'
    | 'correctionPar'
    | 'totalPar';
  valueClassName?: string;
  rowClassName?: string;
};
const PAR_SUMMARY_ROWS: readonly ParSummaryRow[] = [
  {
    label: 'Facility:',
    valueKey: 'facilityPar',
    rowClassName: 'topbar__spacer-par-row--facility',
  },
  { label: 'Practice:', valueKey: 'practicePar' },
  { label: 'Region:', valueKey: 'regionPar' },
  { label: 'Baseport:', valueKey: 'baseportPar' },
  {
    label: 'Correction:',
    valueKey: 'correctionPar',
    valueClassName: 'topbar__spacer-par-value--correction',
  },
  {
    label: 'Total:',
    valueKey: 'totalPar',
    rowClassName: 'topbar__spacer-par-row--total',
    valueClassName: 'topbar__spacer-par-value--total',
  },
] as const;
const MIDDLE_PANE_DEFINITIONS = [
  { label: FUNCTIONS_LABEL },
  { label: NON_COMBINED_PRACTICE_LABEL },
  { label: LOCAL_DPHC_SERVICES_LABEL },
  { label: POPULATION_AT_RISK_LABEL },
] as const;
const PRIMARY_ACTION_LABELS = ['Open', 'Save', 'Export', 'Reset'] as const;
type ActionLabel = (typeof PRIMARY_ACTION_LABELS)[number];
type BrandColorMode = 'switch1' | 'switch2';
type PracticeMemberLayoutItem = {
  facilityId: string;
  displayName: string;
  fullWidth: boolean;
  row: number;
  column: 1 | 2;
};

function formatBoardClusterLabel(name: string | null) {
  if (!name) {
    return null;
  }

  if (name.startsWith('NHS ') && name.endsWith(' Integrated Care Board')) {
    return {
      prefix: 'ICB:',
      name: name.slice(4, -' Integrated Care Board'.length),
    };
  }

  return {
    prefix: 'Health Board:',
    name,
  };
}

function formatPracticeMemberDisplayName(name: string): string {
  return name
    .replace(/\s+(?:Medical Centre|Medical Cent|Med Cent)$/u, '')
    .trim();
}

function formatCombinedPracticeDisplayName(name: string | null): string | null {
  if (!name) {
    return null;
  }

  return name.replace(/\s+Combined Medical Practice$/u, '').trim() || name;
}

function buildPracticeMemberLayoutItems(params: {
  combinedPracticeName: string | null;
  members: Array<{
    facilityId: string;
    facilityName: string;
  }>;
}): PracticeMemberLayoutItem[] {
  const { combinedPracticeName, members } = params;
  const displayMembers = members.map(({ facilityId, facilityName }) => ({
    facilityId,
    displayName: formatPracticeMemberDisplayName(facilityName),
  }));

  if (combinedPracticeName !== PORTSMOUTH_COMBINED_PRACTICE_NAME) {
    return displayMembers.map(({ facilityId, displayName }, index) => ({
      facilityId,
      displayName,
      fullWidth: true,
      row: 2 + index,
      column: 1,
    }));
  }

  // Portsmouth is the only approved exception: short names stay in the two-column grid
  // while the longest names collapse into full-width rows at the bottom.
  const shortItems: PracticeMemberLayoutItem[] = [];
  const fullWidthItems: PracticeMemberLayoutItem[] = [];
  const shortItemSlots: ReadonlyArray<{ row: number; column: 1 | 2 }> = [
    { row: 2, column: 1 },
    { row: 2, column: 2 },
    { row: 3, column: 1 },
    { row: 3, column: 2 },
  ];
  const fullWidthRows: readonly number[] = [4, 5];

  for (const { facilityId, displayName } of displayMembers) {
    if (PORTSMOUTH_FULL_WIDTH_MEMBER_NAMES.has(displayName)) {
      fullWidthItems.push({
        facilityId,
        displayName,
        fullWidth: true,
        row: fullWidthRows[fullWidthItems.length] ?? 5,
        column: 1,
      });
      continue;
    }

    const nextSlot = shortItemSlots[shortItems.length] ?? shortItemSlots.at(-1) ?? { row: 3, column: 2 as const };
    shortItems.push({
      facilityId,
      displayName,
      fullWidth: false,
      row: nextSlot.row,
      column: nextSlot.column,
    });
  }

  return [...shortItems, ...fullWidthItems];
}

export function TopBar() {
  const openSavedViewsDialog = useAppStore((state) => state.openSavedViewsDialog);
  const resetActiveViewPreset = useAppStore((state) => state.resetActiveViewPreset);
  const setNotice = useAppStore((state) => state.setNotice);
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activeScenarioWorkspaceId = useAppStore((state) => state.activeScenarioWorkspaceId);
  const activateViewPreset = useAppStore((state) => state.activateViewPreset);
  const requestFacilitySelection = useAppStore((state) => state.requestFacilitySelection);
  const selectedBoundaryName = useAppStore((state) => state.selection.boundaryName);
  const pointTooltipDisplay = useAppStore((state) => state.pointTooltipDisplay);
  const requestPointTooltipPage = useAppStore((state) => state.requestPointTooltipPage);
  const [brandColorMode, setBrandColorMode] = useState<BrandColorMode>('switch1');
  const boardClusterLabel = formatBoardClusterLabel(selectedBoundaryName);
  const practicePaneLabel = pointTooltipDisplay.isCombinedPractice
    ? 'Combined Medical Practice'
    : NON_COMBINED_PRACTICE_LABEL;
  const isPortsmouthCombinedPractice =
    pointTooltipDisplay.combinedPracticeName === PORTSMOUTH_COMBINED_PRACTICE_NAME;
  const practiceMemberLayoutItems = buildPracticeMemberLayoutItems({
    combinedPracticeName: pointTooltipDisplay.combinedPracticeName,
    members: pointTooltipDisplay.combinedPracticeMembers,
  });
  const facilityPageLabel =
    pointTooltipDisplay.pageCount > 0
      ? `${pointTooltipDisplay.pageIndex + 1} of ${pointTooltipDisplay.pageCount}`
      : null;
  const playgroundModeActive = isDphcEstimateCoaPlaygroundWorkspaceId(activeScenarioWorkspaceId);

  const handleActionClick = (label: ActionLabel) => {
    if (label === 'Open') {
      openSavedViewsDialog('open');
      return;
    }

    if (label === 'Save') {
      openSavedViewsDialog('save');
      return;
    }

    if (label === 'Export') {
      exportCurrentMapView();
      setNotice({
        message: 'Export is not implemented yet',
        tone: 'warning',
      });
      return;
    }

    resetActiveViewPreset();
  };

  return (
    <header className="topbar-strip" data-topbar-version={TOPBAR_VERSION}>
      <div className="topbar__pane topbar__pane--brand">
        <div className="topbar-brand__stack">
          <button
            type="button"
            className={`topbar-brand__title topbar-brand__title-button${
              brandColorMode === 'switch2' ? ' topbar-brand__title-button--switch2' : ''
            }`}
            aria-label="Toggle dmsGIS service colour arrangement"
            aria-pressed={brandColorMode === 'switch2'}
            onClick={() =>
              setBrandColorMode((current) => (current === 'switch1' ? 'switch2' : 'switch1'))
            }
          >
            <span className="topbar-brand__title-letter topbar-brand__title-letter--slot-d">d</span>
            <span className="topbar-brand__title-letter topbar-brand__title-letter--slot-m">m</span>
            <span className="topbar-brand__title-letter topbar-brand__title-letter--slot-s">s</span>
            <span className="topbar-brand__title-letter topbar-brand__title-letter--slot-g">G</span>
            <span className="topbar-brand__title-letter topbar-brand__title-letter--slot-i">I</span>
            <span className="topbar-brand__title-letter topbar-brand__title-letter--slot-gis-s">S</span>
          </button>
          <div className="topbar-brand__descriptor" aria-hidden="true">
            {BRAND_DESCRIPTOR_LINES.map((line) => (
              <span key={line} className="topbar-brand__descriptor-line">
                {line}
              </span>
            ))}
          </div>
          <div className="topbar-brand__subtitle" aria-hidden="true">
            <span>{BRAND_SUBTITLE}</span>
          </div>
        </div>
      </div>

      <div className="topbar-cluster">
        <div
          className={`topbar-cluster__pane topbar-cluster__pane--top topbar-cluster__pane--top-merged topbar-cluster__pane--facility${
            facilityPageLabel ? ' topbar-cluster__pane--top-with-pager' : ''
          }`}
        >
          <div className="topbar-cluster__facility-grid">
            <span
              className="topbar-cluster__facility-cell topbar-cluster__facility-cell--top-left topbar-cluster__facility-cell--title"
            >
              <span className="topbar-cluster__facility-prefix topbar-cluster__facility-prefix--facility">
                Facility:
              </span>
            </span>
            <span
              className="topbar-cluster__facility-cell topbar-cluster__facility-cell--top-right topbar-cluster__facility-cell--value"
              title={pointTooltipDisplay.facilityName ?? undefined}
            >
              {pointTooltipDisplay.facilityName ? (
                <span className="topbar-cluster__facility-value topbar-cluster__facility-value--facility">
                  {pointTooltipDisplay.facilityName}
                </span>
              ) : null}
            </span>
            <span
              className="topbar-cluster__facility-cell topbar-cluster__facility-cell--bottom-left topbar-cluster__facility-cell--title"
            >
              <span className="topbar-cluster__facility-prefix topbar-cluster__facility-prefix--region">
                Region:
              </span>
            </span>
            <span
              className="topbar-cluster__facility-cell topbar-cluster__facility-cell--bottom-right topbar-cluster__facility-cell--value"
              title={pointTooltipDisplay.regionName ?? undefined}
            >
              {pointTooltipDisplay.regionName ? (
                <span className="topbar-cluster__facility-value topbar-cluster__facility-value--region">
                  {pointTooltipDisplay.regionName}
                </span>
              ) : null}
            </span>
          </div>
          {facilityPageLabel ? (
            <div className="topbar-cluster__pager topbar-cluster__pager--top">
              <button
                type="button"
                className="topbar-cluster__pager-button"
                aria-label="Previous facility"
                disabled={pointTooltipDisplay.pageIndex <= 0}
                onClick={() => requestPointTooltipPage(-1)}
              >
                <span className="topbar-cluster__pager-button-glyph">{'<'}</span>
              </button>
              <span className="topbar-cluster__pager-label">{facilityPageLabel}</span>
              <button
                type="button"
                className="topbar-cluster__pager-button"
                aria-label="Next facility"
                disabled={pointTooltipDisplay.pageIndex >= pointTooltipDisplay.pageCount - 1}
                onClick={() => requestPointTooltipPage(1)}
              >
                <span className="topbar-cluster__pager-button-glyph">{'>'}</span>
              </button>
            </div>
          ) : null}
        </div>
        <div className="topbar-cluster__pane topbar-cluster__pane--bottom">
          <div className="topbar-cluster__bottom-row">
            {boardClusterLabel ? (
              <span className="topbar-cluster__label">
                <span className="topbar-cluster__label-prefix">{boardClusterLabel.prefix}</span>{' '}
                <span className="topbar-cluster__label-name">{boardClusterLabel.name}</span>
              </span>
            ) : (
              <span className="topbar-cluster__label">
                <span className="topbar-cluster__label-prefix">ICB/Health Board:</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {MIDDLE_PANE_DEFINITIONS.slice(0, MIDDLE_SPACER_PANE_COUNT).map(
        ({ label }, index) => (
          (() => {
            const isParPane = label === POPULATION_AT_RISK_LABEL;
            const isPracticePane = label === NON_COMBINED_PRACTICE_LABEL;
            const paneLabel = isPracticePane ? practicePaneLabel : label;

            return (
          <div
            key={`topbar-spacer-${index + 3}`}
            className={`topbar__pane topbar__pane--spacer topbar__pane--spacer-label${
              isParPane ? ' topbar__pane--spacer-par' : ''
            }${
              isPracticePane ? ' topbar__pane--spacer-practice' : ''
            }`}
            aria-hidden="false"
          >
            <span
              className={`topbar__spacer-label${
                isPracticePane && pointTooltipDisplay.isCombinedPractice
                  ? ' topbar__spacer-label--practice-combined'
                  : ''
              }`}
            >
              {paneLabel}
            </span>
            {isPracticePane && pointTooltipDisplay.isCombinedPractice ? (
              <div
                className={`topbar__spacer-practice-summary${
                  isPortsmouthCombinedPractice
                    ? ' topbar__spacer-practice-summary--portsmouth'
                    : ''
                }`}
                aria-label="Combined practice summary"
              >
                <span
                  className="topbar__spacer-practice-name"
                  title={pointTooltipDisplay.combinedPracticeName ?? undefined}
                >
                  {formatCombinedPracticeDisplayName(pointTooltipDisplay.combinedPracticeName)}
                </span>
                {practiceMemberLayoutItems.length > 0 ? (
                  <>
                    {practiceMemberLayoutItems.map(
                      ({ facilityId, displayName, fullWidth, row, column }) => (
                      <button
                        key={facilityId}
                        type="button"
                        className={`topbar__spacer-practice-member${
                          fullWidth || !isPortsmouthCombinedPractice
                            ? ' topbar__spacer-practice-member--full-width'
                            : ''
                        }${
                          !fullWidth && isPortsmouthCombinedPractice && column === 2
                            ? ' topbar__spacer-practice-member--column-2'
                            : ''
                        }`}
                        title={displayName}
                        style={{
                          gridRow: String(row),
                          gridColumn: fullWidth ? '1 / -1' : String(column),
                        }}
                        onClick={() => requestFacilitySelection(facilityId)}
                      >
                        {displayName}
                      </button>
                    ),
                    )}
                  </>
                ) : null}
              </div>
            ) : null}
            {isParPane ? (
              <div className="topbar__spacer-par-summary" aria-label="Population at risk summary">
                {PAR_SUMMARY_ROWS.map(({ label: rowLabel, valueKey, valueClassName, rowClassName }) => (
                  <div
                    key={rowLabel}
                    className={`topbar__spacer-par-row${rowClassName ? ` ${rowClassName}` : ''}`}
                  >
                    <span className="topbar__spacer-par-title">{rowLabel}</span>
                    <span
                      className={`topbar__spacer-par-value${
                        valueClassName ? ` ${valueClassName}` : ''
                      }`}
                    >
                      {valueKey === 'correctionPar' && pointTooltipDisplay.correctionParContext ? (
                        <>
                          <span className="topbar__spacer-par-value-context">
                            {pointTooltipDisplay.correctionParContext}
                          </span>{' '}
                          <span className="topbar__spacer-par-value-number">
                            {pointTooltipDisplay[valueKey] ?? '—'}
                          </span>
                        </>
                      ) : (
                        pointTooltipDisplay[valueKey] ?? '—'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
            );
          })()
        ),
      )}

      <div className="topbar__pane topbar__pane--actions">
        <div className="topbar-strip__actions">
          <div className="topbar-strip__action-row">
            {PRIMARY_ACTION_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                className={`button topbar-strip__action-button ${
                  label === 'Reset' ? 'button--primary' : 'button--ghost'
                }`}
                onClick={() => handleActionClick(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="topbar-strip__action-row topbar-strip__action-row--presets"
            aria-label="Map presets"
          >
            {VIEW_PRESET_BUTTONS.map(({ id, label }) => {
              const isActive = !playgroundModeActive && activeViewPreset === id;
              const buttonClassName = `button topbar-strip__action-button${
                isActive ? ' topbar-strip__action-button--preset-active' : ''
              }`;
              const labelClassName = `topbar-strip__action-button-label${
                id === 'coa3a' ? ' topbar-strip__action-button-label--sjc' : ''
              }`;

              return (
                <button
                  key={id}
                  type="button"
                  className={buttonClassName}
                  aria-pressed={isActive}
                  onClick={() => activateViewPreset(id)}
                >
                  <span className={labelClassName}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
