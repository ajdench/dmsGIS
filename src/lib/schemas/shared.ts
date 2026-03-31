import { z } from 'zod';

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/);

export const viewPresetIdSchema = z.enum(['current', 'coa3a', 'coa3b', 'coa3c']);
