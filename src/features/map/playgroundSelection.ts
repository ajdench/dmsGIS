import type {
  ScenarioRegionDefinition,
  ScenarioWorkspaceEditorState,
} from '../../lib/schemas/scenarioWorkspaces';
import type { SelectionState } from '../../types';

interface ResolvePlaygroundSelectedRegionParams {
  selection: SelectionState;
  scenarioWorkspaceEditor: ScenarioWorkspaceEditorState;
  scenarioAssignmentPopover: {
    selectedRegionId: string | null;
  } | null;
  regions: ScenarioRegionDefinition[] | null;
}

export function resolvePlaygroundSelectedRegion(
  params: ResolvePlaygroundSelectedRegionParams,
): {
  selectedRegionId: string | null;
  selectedRegionName: string | null;
} {
  const {
    selection,
    scenarioWorkspaceEditor,
    scenarioAssignmentPopover,
    regions,
  } = params;

  if (selection.facilityIds.length > 0) {
    return {
      selectedRegionId: selection.scenarioRegionId,
      selectedRegionName: selection.jmcName,
    };
  }

  const selectedRegionId = resolvePlaygroundEditorRegionId({
    scenarioWorkspaceEditor,
    scenarioAssignmentPopover,
  });
  const selectedRegionName =
    regions?.find((region) => region.id === selectedRegionId)?.label ?? null;

  return {
    selectedRegionId,
    selectedRegionName,
  };
}

export function resolvePlaygroundEditorRegionId({
  scenarioWorkspaceEditor,
  scenarioAssignmentPopover,
}: {
  scenarioWorkspaceEditor: ScenarioWorkspaceEditorState;
  scenarioAssignmentPopover: {
    selectedRegionId: string | null;
  } | null;
}): string | null {
  return (
    scenarioWorkspaceEditor.pendingScenarioRegionId ??
    scenarioWorkspaceEditor.selectedScenarioRegionId ??
    scenarioAssignmentPopover?.selectedRegionId ??
    null
  );
}
