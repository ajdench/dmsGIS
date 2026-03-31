import rawConfig from './runtimeMapProducts.json';
import {
  parseRuntimeMapProducts,
  type RuntimeMapProduct,
  type RuntimeMapProductId,
  type RuntimeMapProducts,
} from '../schemas/runtimeMapProducts';

const config = parseRuntimeMapProducts(rawConfig);

export const RUNTIME_MAP_PRODUCTS: RuntimeMapProducts = config;

export function getRuntimeMapProduct(
  productId: RuntimeMapProductId = config.activeProductId,
): RuntimeMapProduct {
  const product = config.products[productId];
  if (!product) {
    throw new Error(`Missing runtime map product: ${productId}`);
  }
  return product;
}

export function getActiveRuntimeMapProductId(): RuntimeMapProductId {
  return config.activeProductId;
}

export function isBaselineRuntimeMapProduct(): boolean {
  return config.activeProductId === 'baseline';
}

export function resolveRuntimeMapProductPath(pathValue: string): string {
  if (!pathValue.startsWith('data/')) {
    return pathValue;
  }

  if (isBaselineRuntimeMapProduct()) {
    return pathValue;
  }

  const { dataRoot } = getRuntimeMapProduct();
  return `${dataRoot}/${pathValue.slice('data/'.length)}`;
}
