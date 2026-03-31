import rawConfig from './coastalEnvelopeTreatment.json';
import {
  parseCoastalEnvelopeTreatment,
  type CoastalEnvelopeProduct,
  type CoastalEnvelopeProductId,
  type CoastalEnvelopeTreatment,
} from '../schemas/coastalEnvelopeTreatment';

const config = parseCoastalEnvelopeTreatment(rawConfig);

export const COASTAL_ENVELOPE_TREATMENT: CoastalEnvelopeTreatment = config;

export function getCoastalEnvelopeTreatment(): CoastalEnvelopeTreatment {
  return config;
}

export function isCoastalEnvelopeTreatmentActiveForBuild(): boolean {
  return config.status === 'active-review' || config.status === 'active';
}

export function getActiveCoastalEnvelopeProduct(): CoastalEnvelopeProduct {
  return getCoastalEnvelopeProduct(config.activeProductId);
}

export function getCoastalEnvelopeProduct(
  productId: CoastalEnvelopeProductId,
): CoastalEnvelopeProduct {
  const product = config.products[productId];
  if (!product) {
    throw new Error(`Missing coastal-envelope product: ${productId}`);
  }
  return product;
}
