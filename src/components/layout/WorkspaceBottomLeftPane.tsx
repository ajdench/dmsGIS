import { useMemo, useState } from 'react';
import { ExactMetricPill, ExactSwatch } from '../sidebarExact';
import { useAppStore } from '../../store/appStore';
import { buildWorkspaceBottomCardModel } from '../../lib/workspaceBottomCards';
import {
  summarizeFacilityParByPresetRegion,
  summarizeFacilityParByScenarioWorkspace,
} from '../../lib/facilityPar';

export function WorkspaceBottomLeftPane() {
  const [isRoyalNavyRegionalized, setIsRoyalNavyRegionalized] = useState(false);
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activeScenarioWorkspaceId = useAppStore((state) => state.activeScenarioWorkspaceId);
  const getDerivedScenarioWorkspace = useAppStore((state) => state.getDerivedScenarioWorkspace);
  const scenarioWorkspaceDrafts = useAppStore((state) => state.scenarioWorkspaceDrafts);
  const facilityParRecords = useAppStore((state) => state.facilityParRecords);
  const regions = useAppStore((state) => state.regions);
  const regionGroupOverrides = useAppStore((state) => state.regionGroupOverrides);
  const pmcRegionParDisplayByName = useAppStore((state) => state.pmcRegionParDisplayByName);
  const pmcTotalParDisplay = useAppStore((state) => state.pmcTotalParDisplay);
  const presetRegionParByPreset = useAppStore((state) => state.presetRegionParByPreset);
  const activeScenarioWorkspace = useMemo(
    () =>
      activeScenarioWorkspaceId
        ? getDerivedScenarioWorkspace(activeScenarioWorkspaceId)
        : null,
    [activeScenarioWorkspaceId, getDerivedScenarioWorkspace, scenarioWorkspaceDrafts],
  );
  const activeScenarioRegionParByName =
    activeScenarioWorkspaceId && activeScenarioWorkspace && facilityParRecords.length > 0
      ? summarizeFacilityParByScenarioWorkspace({
          facilities: facilityParRecords,
          workspaceId: activeScenarioWorkspaceId,
          assignmentLookup: activeScenarioWorkspace.assignmentLookup,
          preserveOriginalRegionNames: ['Overseas', 'Royal Navy'],
        }).regionParByName
      : presetRegionParByPreset[activeViewPreset] ?? {};
  const activeRoyalNavyRegionalParByName = (() => {
    if (facilityParRecords.length === 0) {
      return {};
    }

    const royalNavyFacilities = facilityParRecords.filter(
      (record) => record.regionName?.trim() === 'Royal Navy',
    );
    if (royalNavyFacilities.length === 0) {
      return {};
    }

    if (activeScenarioWorkspaceId && activeScenarioWorkspace) {
      return summarizeFacilityParByScenarioWorkspace({
        facilities: royalNavyFacilities,
        workspaceId: activeScenarioWorkspaceId,
        assignmentLookup: activeScenarioWorkspace.assignmentLookup,
      }).regionParByName;
    }

    return summarizeFacilityParByPresetRegion({
      facilities: royalNavyFacilities,
      preset: activeViewPreset,
    }).regionParByName;
  })();
  const { slots, totalCard } = buildWorkspaceBottomCardModel({
    activeViewPreset,
    regions,
    regionGroupOverrides,
    pmcRegionParDisplayByName,
    pmcTotalParDisplay,
    presetRegionParByPreset: {
      ...presetRegionParByPreset,
      [activeViewPreset]: activeScenarioRegionParByName,
    },
    presetRoyalNavyRegionalParByPreset: {
      [activeViewPreset]: activeRoyalNavyRegionalParByName,
    },
    showRoyalNavyRegionalization: isRoyalNavyRegionalized,
  });

  return (
    <section className="workspace-bottom-shell workspace-bottom-shell--left">
      <div className="workspace-bottom-shell__surface workspace-bottom-shell__surface--left-grid">
        {slots.map((card, index) => {
          return (
            <div key={card?.key ?? `empty-${index + 1}`} className="workspace-bottom-shell__column">
              {card ? (
                <div className="workspace-bottom-shell__title-card">
                  <div className="workspace-bottom-shell__title-card-swatch-row">
                    <ExactSwatch
                      swatch={card.swatch}
                    />
                  </div>
                  <div className="workspace-bottom-shell__title-card-title">
                    {card.title}
                  </div>
                  {card.middleRow?.kind === 'button' ? (
                    <div className="workspace-bottom-shell__title-card-middle-pill">
                      <ExactMetricPill
                        value={card.middleRow.label}
                        asButton
                        className="workspace-bottom-shell__title-card-middle-pill-control workspace-bottom-shell__title-card-middle-pill-control--info"
                        onClick={() =>
                          setIsRoyalNavyRegionalized((currentValue) => !currentValue)
                        }
                      />
                    </div>
                  ) : null}
                  {card.middleRow?.kind === 'royalNavyContribution' ? (
                    <div className="workspace-bottom-shell__title-card-middle-contribution" aria-hidden="true">
                      <div className="workspace-bottom-shell__title-card-middle-contribution-swatch">
                        <ExactSwatch swatch={card.middleRow.swatch} />
                      </div>
                      <div className="workspace-bottom-shell__title-card-middle-contribution-value">
                        {card.middleRow.valueDisplay}
                      </div>
                    </div>
                  ) : null}
                  <div className="workspace-bottom-shell__title-card-par">
                    {card.parDisplay ?? ''}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        <div className="workspace-bottom-shell__column">
          <div className="workspace-bottom-shell__title-card workspace-bottom-shell__title-card--total">
            <div className="workspace-bottom-shell__title-card-swatch-row">
              <ExactSwatch
                swatch={totalCard.swatch}
              />
            </div>
            <div className="workspace-bottom-shell__title-card-title">{totalCard.title}</div>
            <div className="workspace-bottom-shell__title-card-par workspace-bottom-shell__title-card-par--total">
              {totalCard.parDisplay ?? ''}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
