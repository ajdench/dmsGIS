import { z } from 'zod';

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{6}$/)
  .transform((value) => (value.startsWith('#') ? value : `#${value}`));

const nullableNumberSchema = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((value) => (typeof value === 'number' ? value : null));

const nullableBooleanSchema = z
  .union([z.boolean(), z.null(), z.undefined()])
  .transform((value) => (typeof value === 'boolean' ? value : null));

export const facilityPropertiesSchema = z
  .object({
    id: z.string().trim().min(1).catch(''),
    name: z.string().trim().min(1).catch('Unnamed facility'),
    type: z.string().trim().min(1).catch('pmc-facility'),
    region: z.string().trim().min(1).catch('Unassigned'),
    default_visible: z.coerce.number().catch(1),
    point_color_hex: hexColorSchema.catch('#64748b'),
    point_alpha: z.coerce.number().catch(1),
    lon_original: nullableNumberSchema,
    lat_original: nullableNumberSchema,
    snapped_to_land: nullableBooleanSchema,
    snap_distance_m: nullableNumberSchema,
  })
  .passthrough();

export type FacilityProperties = z.infer<typeof facilityPropertiesSchema>;

export function parseFacilityProperties(input: unknown): FacilityProperties {
  return facilityPropertiesSchema.parse(input);
}
