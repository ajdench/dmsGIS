export interface RuntimeAssetUrlEnvironment {
  origin: string;
  baseUrl: string;
  isDev: boolean;
}

export function buildRuntimeAssetUrl(
  path: string,
  environment: RuntimeAssetUrlEnvironment,
): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const basePath = environment.isDev ? '/' : environment.baseUrl || '/';
  return new URL(normalizedPath, new URL(basePath, environment.origin)).toString();
}

export function resolveRuntimeAssetUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path;
  }

  return buildRuntimeAssetUrl(path, {
    origin: window.location.origin,
    baseUrl: import.meta.env.BASE_URL,
    isDev: Boolean(import.meta.env.DEV),
  });
}
