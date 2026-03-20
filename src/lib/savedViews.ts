import type {
  BasemapSettings,
  FacilitySymbolShape,
  LayerState,
  OverlayLayerStyle,
  RegionStyle,
  ViewPresetId,
} from '../types';
import { createFacilityFilterState } from './facilityFilters';
import type { FacilityFilterState } from './schemas/facilities';
import {
  parseMapSessionState,
  parseNamedSavedView,
  parseShareableSavedView,
  parseUserSavedView,
  type MapSessionState,
  type MapViewportState,
  type NamedSavedView,
  type SavedViewMetadata,
  type SavedViewOwner,
  type SavedViewSharePolicy,
  type SelectionState,
  type ShareableSavedView,
  type UserSavedView,
} from './schemas/savedViews';

export interface MapSessionSnapshotInput {
  activeViewPreset: ViewPresetId;
  viewport?: Partial<MapViewportState>;
  basemap: BasemapSettings;
  layers: LayerState[];
  overlayLayers: OverlayLayerStyle[];
  regions: RegionStyle[];
  regionGlobalOpacity: number;
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  facilityFilters?: Partial<FacilityFilterState>;
  selection?: Partial<SelectionState>;
}

interface SavedViewInputBase {
  metadata: Omit<SavedViewMetadata, 'schemaVersion'>;
  session: MapSessionState;
}

interface UserSavedViewInput extends SavedViewInputBase {
  owner: SavedViewOwner;
}

interface ShareableSavedViewInput extends UserSavedViewInput {
  share: Partial<SavedViewSharePolicy>;
}

export function createMapSessionState(
  input: MapSessionSnapshotInput,
): MapSessionState {
  return parseMapSessionState({
    schemaVersion: 1,
    activeViewPreset: input.activeViewPreset,
    viewport: {
      center: input.viewport?.center ?? [0, 0],
      zoom: input.viewport?.zoom ?? 0,
      rotation: input.viewport?.rotation ?? 0,
    },
    basemap: { ...input.basemap },
    layers: input.layers.map((layer) => ({ ...layer })),
    overlayLayers: input.overlayLayers.map((layer) => ({ ...layer })),
    regions: input.regions.map((region) => ({ ...region })),
    regionGlobalOpacity: input.regionGlobalOpacity,
    facilities: {
      symbolShape: input.facilitySymbolShape,
      symbolSize: input.facilitySymbolSize,
      filters: createFacilityFilterState(input.facilityFilters),
    },
    selection: {
      facilityIds: input.selection?.facilityIds ?? [],
      boundaryName: input.selection?.boundaryName ?? null,
      jmcName: input.selection?.jmcName ?? null,
    },
  });
}

export function createNamedSavedView(
  input: SavedViewInputBase,
): NamedSavedView {
  return parseNamedSavedView({
    metadata: {
      ...input.metadata,
      schemaVersion: 1,
    },
    session: input.session,
  });
}

export function createUserSavedView(
  input: UserSavedViewInput,
): UserSavedView {
  return parseUserSavedView({
    metadata: {
      ...input.metadata,
      schemaVersion: 1,
    },
    session: input.session,
    owner: input.owner,
  });
}

export function createShareableSavedView(
  input: ShareableSavedViewInput,
): ShareableSavedView {
  return parseShareableSavedView({
    metadata: {
      ...input.metadata,
      schemaVersion: 1,
    },
    session: input.session,
    owner: input.owner,
    share: {
      scope: input.share.scope ?? 'private',
      canEdit: input.share.canEdit ?? false,
      sharedWithUserIds: input.share.sharedWithUserIds ?? [],
    },
  });
}
