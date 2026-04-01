import { z } from 'zod';
import { facilityFilterStateSchema } from './facilities';
import { scenarioWorkspaceIdSchema } from './scenarioWorkspaces';

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/);

const viewPresetIdSchema = z.enum(['current', 'coa3a', 'coa3b', 'coa3c']);
const overlayFamilySchema = z.enum([
  'boardBoundaries',
  'scenarioRegions',
  'wardSplitFill',
  'wardSplitWards',
  'nhsRegions',
  'customRegions',
  'regionFill',
  'englandIcb',
  'devolvedHb',
]);
const facilitySymbolShapeSchema = z.enum([
  'circle',
  'square',
  'diamond',
  'triangle',
]);
const basemapProviderSchema = z.enum(['localDetailed']);
const basemapScaleSchema = z.enum(['10m']);

export const basemapSettingsSnapshotSchema = z.object({
  provider: basemapProviderSchema,
  scale: basemapScaleSchema,
  landFillColor: hexColorSchema,
  landFillOpacity: z.number().min(0).max(1),
  showLandFill: z.boolean(),
  countryBorderColor: hexColorSchema,
  countryBorderOpacity: z.number().min(0).max(1),
  showCountryBorders: z.boolean(),
  countryLabelColor: hexColorSchema,
  countryLabelOpacity: z.number().min(0).max(1),
  countryLabelSize: z.number().min(1).max(18).optional(),
  countryLabelBorderColor: hexColorSchema.optional(),
  countryLabelBorderWidth: z.number().min(0).max(6).optional(),
  countryLabelBorderOpacity: z.number().min(0).max(1).optional(),
  showCountryLabels: z.boolean(),
  majorCityColor: hexColorSchema,
  majorCityOpacity: z.number().min(0).max(1),
  majorCitySize: z.number().min(1).max(18).optional(),
  majorCityBorderColor: hexColorSchema.optional(),
  majorCityBorderWidth: z.number().min(0).max(6).optional(),
  majorCityBorderOpacity: z.number().min(0).max(1).optional(),
  showMajorCities: z.boolean(),
  regionLabelColor: hexColorSchema.optional(),
  regionLabelOpacity: z.number().min(0).max(1).optional(),
  regionLabelSize: z.number().min(1).max(18).optional(),
  regionLabelBorderColor: hexColorSchema.optional(),
  regionLabelBorderWidth: z.number().min(0).max(10).optional(),
  regionLabelBorderOpacity: z.number().min(0).max(1).optional(),
  showRegionLabels: z.boolean().optional(),
  networkLabelColor: hexColorSchema.optional(),
  networkLabelOpacity: z.number().min(0).max(1).optional(),
  networkLabelSize: z.number().min(1).max(18).optional(),
  networkLabelBorderColor: hexColorSchema.optional(),
  networkLabelBorderWidth: z.number().min(0).max(10).optional(),
  networkLabelBorderOpacity: z.number().min(0).max(1).optional(),
  showNetworkLabels: z.boolean().optional(),
  facilityLabelColor: hexColorSchema.optional(),
  facilityLabelOpacity: z.number().min(0).max(1).optional(),
  facilityLabelSize: z.number().min(1).max(18).optional(),
  facilityLabelBorderColor: hexColorSchema.optional(),
  facilityLabelBorderWidth: z.number().min(0).max(10).optional(),
  facilityLabelBorderOpacity: z.number().min(0).max(1).optional(),
  showFacilityLabels: z.boolean().optional(),
  seaFillColor: hexColorSchema,
  seaFillOpacity: z.number().min(0).max(1),
  showSeaFill: z.boolean(),
  seaLabelColor: hexColorSchema,
  seaLabelOpacity: z.number().min(0).max(1),
  seaLabelSize: z.number().min(1).max(18).optional(),
  seaLabelBorderColor: hexColorSchema.optional(),
  seaLabelBorderWidth: z.number().min(0).max(6).optional(),
  seaLabelBorderOpacity: z.number().min(0).max(1).optional(),
  showSeaLabels: z.boolean(),
});

export const layerStateSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['polygon', 'point']),
  path: z.string().min(1),
  visible: z.boolean(),
  opacity: z.number().min(0).max(1),
});

export const regionStyleSnapshotSchema = z.object({
  name: z.string().min(1),
  visible: z.boolean(),
  color: hexColorSchema,
  opacity: z.number().min(0).max(1),
  shape: facilitySymbolShapeSchema.default('circle'),
  borderVisible: z.boolean(),
  borderColor: hexColorSchema,
  borderWidth: z.number().min(0).max(10).default(1),
  borderOpacity: z.number().min(0).max(1),
  symbolSize: z.number().min(1).max(12),
});

export const combinedPracticeStyleSnapshotSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  visible: z.boolean(),
  borderColor: hexColorSchema,
  borderWidth: z.number().min(0).max(10).default(1),
  borderOpacity: z.number().min(0).max(1),
});

export const overlayLayerSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  family: overlayFamilySchema,
  visible: z.boolean(),
  opacity: z.number().min(0).max(1),
  borderVisible: z.boolean(),
  borderColor: hexColorSchema,
  borderOpacity: z.number().min(0).max(1),
  swatchColor: hexColorSchema,
});

export const facilityPresentationStateSchema = z.object({
  symbolShape: facilitySymbolShapeSchema,
  symbolSize: z.number().min(1).max(12),
  filters: facilityFilterStateSchema,
});

export const mapViewportStateSchema = z.object({
  center: z.tuple([z.number().finite(), z.number().finite()]),
  zoom: z.number().finite(),
  rotation: z.number().finite().default(0),
});

export const selectionStateSchema = z.object({
  facilityIds: z.array(z.string().min(1)).default([]),
  boundaryName: z.string().trim().nullable().default(null),
  jmcName: z.string().trim().nullable().default(null),
  scenarioRegionId: z.string().trim().nullable().default(null),
});

export const mapSessionStateSchema = z.object({
  schemaVersion: z.literal(1),
  activeViewPreset: viewPresetIdSchema,
  activeScenarioWorkspaceId: scenarioWorkspaceIdSchema.nullable().default(null),
  viewport: mapViewportStateSchema,
  basemap: basemapSettingsSnapshotSchema,
  layers: z.array(layerStateSnapshotSchema),
  overlayLayers: z.array(overlayLayerSnapshotSchema),
  regions: z.array(regionStyleSnapshotSchema),
  combinedPractices: z.array(combinedPracticeStyleSnapshotSchema).default([]),
  regionGlobalOpacity: z.number().min(0).max(1),
  facilities: facilityPresentationStateSchema,
  selection: selectionStateSchema,
});

export const savedViewMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().default(''),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.literal(1),
});

export const savedViewOwnerSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().trim().default(''),
});

export const savedViewSharePolicySchema = z.object({
  scope: z.enum(['private', 'link', 'users']),
  canEdit: z.boolean().default(false),
  sharedWithUserIds: z.array(z.string().min(1)).default([]),
});

export const namedSavedViewSchema = z.object({
  metadata: savedViewMetadataSchema,
  session: mapSessionStateSchema,
});

export const userSavedViewSchema = namedSavedViewSchema.extend({
  owner: savedViewOwnerSchema,
});

export const shareableSavedViewSchema = userSavedViewSchema.extend({
  share: savedViewSharePolicySchema,
});

export type BasemapSettingsSnapshot = z.infer<typeof basemapSettingsSnapshotSchema>;
export type LayerStateSnapshot = z.infer<typeof layerStateSnapshotSchema>;
export type RegionStyleSnapshot = z.infer<typeof regionStyleSnapshotSchema>;
export type CombinedPracticeStyleSnapshot = z.infer<
  typeof combinedPracticeStyleSnapshotSchema
>;
export type OverlayLayerSnapshot = z.infer<typeof overlayLayerSnapshotSchema>;
export type FacilityPresentationState = z.infer<typeof facilityPresentationStateSchema>;
export type MapViewportState = z.infer<typeof mapViewportStateSchema>;
export type SelectionState = z.infer<typeof selectionStateSchema>;
export type MapSessionState = z.infer<typeof mapSessionStateSchema>;
export type SavedViewMetadata = z.infer<typeof savedViewMetadataSchema>;
export type SavedViewOwner = z.infer<typeof savedViewOwnerSchema>;
export type SavedViewSharePolicy = z.infer<typeof savedViewSharePolicySchema>;
export type NamedSavedView = z.infer<typeof namedSavedViewSchema>;
export type UserSavedView = z.infer<typeof userSavedViewSchema>;
export type ShareableSavedView = z.infer<typeof shareableSavedViewSchema>;

export function parseMapSessionState(input: unknown): MapSessionState {
  return mapSessionStateSchema.parse(input);
}

export function parseNamedSavedView(input: unknown): NamedSavedView {
  return namedSavedViewSchema.parse(input);
}

export function parseUserSavedView(input: unknown): UserSavedView {
  return userSavedViewSchema.parse(input);
}

export function parseShareableSavedView(input: unknown): ShareableSavedView {
  return shareableSavedViewSchema.parse(input);
}
