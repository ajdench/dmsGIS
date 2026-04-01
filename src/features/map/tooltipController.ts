import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { PointTooltipEntry } from './pointSelection';
import { syncSelectedPointHighlight } from './selectionHighlights';

export interface TooltipDomRefs {
  root: HTMLDivElement | null;
  header: HTMLDivElement | null;
  name: HTMLDivElement | null;
  subname: HTMLDivElement | null;
  context: HTMLDivElement | null;
  footer: HTMLDivElement | null;
  page: HTMLSpanElement | null;
  prev: HTMLButtonElement | null;
  next: HTMLButtonElement | null;
}

export interface TooltipRenderState {
  entries: PointTooltipEntry[];
  index: number;
  boundaryName: string | null;
  jmcName: string | null;
}

interface TooltipRenderDependencies {
  dom: TooltipDomRefs;
  state: TooltipRenderState;
  formatRegionLabel?: (name: string | null) => string | null;
  selectedPointLayer: VectorLayer<VectorSource> | null;
  selectedJmcBoundaryLayer: VectorLayer<VectorSource> | null;
  setSelectedBoundaryForPoint: (entry: PointTooltipEntry) => void;
  syncSelectedJmcBoundaries: (entry: PointTooltipEntry) => void;
  setSelectedBoundaryState: (boundaryName: string | null, jmcName: string | null) => void;
  createSelectedPointStyle: (entry: PointTooltipEntry | null) => unknown;
}

export function renderDockedTooltip(
  dependencies: TooltipRenderDependencies,
): number {
  const {
    dom,
    state,
    formatRegionLabel,
    selectedPointLayer,
    selectedJmcBoundaryLayer,
    setSelectedBoundaryForPoint,
    syncSelectedJmcBoundaries,
    setSelectedBoundaryState,
    createSelectedPointStyle,
  } = dependencies;
  const { root, header, name, subname, context, footer, page, prev, next } = dom;

  if (
    !root ||
    !header ||
    !name ||
    !subname ||
    !context ||
    !footer ||
    !page ||
    !prev ||
    !next
  ) {
    return state.index;
  }

  const selectedPointSource = selectedPointLayer?.getSource();
  const selectedJmcSource = selectedJmcBoundaryLayer?.getSource();

  if (state.entries.length === 0) {
    return renderBoundaryOnlyTooltip({
      root,
      name,
      subname,
      context,
      footer,
      page,
      prev,
      next,
      boundaryName: state.boundaryName,
      jmcName: formatRegionLabel?.(state.jmcName) ?? state.jmcName,
      selectedPointSource,
      selectedPointLayer,
      selectedJmcSource,
      createSelectedPointStyle,
      setSelectedBoundaryState,
    });
  }

  const index = Math.max(0, Math.min(state.index, state.entries.length - 1));
  const current = state.entries[index];
  name.textContent = current.facilityName;
  subname.textContent = formatRegionLabel?.(current.jmcName) ?? current.jmcName ?? '';
  page.textContent = `Page ${index + 1} of ${state.entries.length}`;
  context.textContent = current.boundaryName ?? '';
  prev.disabled = index === 0;
  next.disabled = index >= state.entries.length - 1;
  footer.classList.remove('map-tooltip-card__footer--hidden');
  toggleClass(subname, 'map-tooltip-card__subname--hidden', !current.jmcName);
  toggleClass(context, 'map-tooltip-card__context--hidden', !current.boundaryName);

  setSelectedBoundaryForPoint(current);
  syncSelectedJmcBoundaries(current);

  root.classList.remove('map-tooltip-card--name-right');
  root.classList.remove('map-tooltip-card--hidden');
  syncSelectedPointHighlight({
    entry: current,
    selectedPointLayer,
    createSelectedPointStyle,
  });

  return index;
}

function renderBoundaryOnlyTooltip(params: {
  root: HTMLDivElement;
  name: HTMLDivElement;
  subname: HTMLDivElement;
  context: HTMLDivElement;
  footer: HTMLDivElement;
  page: HTMLSpanElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  boundaryName: string | null;
  jmcName: string | null;
  selectedPointSource: VectorSource | null | undefined;
  selectedPointLayer: VectorLayer<VectorSource> | null;
  selectedJmcSource: VectorSource | null | undefined;
  createSelectedPointStyle: (entry: PointTooltipEntry | null) => unknown;
  setSelectedBoundaryState: (boundaryName: string | null, jmcName: string | null) => void;
}): number {
  const {
    root,
    name,
    subname,
    context,
    footer,
    page,
    prev,
    next,
    boundaryName,
    jmcName,
    selectedPointSource,
    selectedPointLayer,
    selectedJmcSource,
    createSelectedPointStyle,
    setSelectedBoundaryState,
  } = params;

  if (!boundaryName) {
    name.textContent = '';
    subname.textContent = '';
    context.textContent = '';
    page.textContent = '';
    prev.disabled = true;
    next.disabled = true;
    footer.classList.add('map-tooltip-card__footer--hidden');
    subname.classList.add('map-tooltip-card__subname--hidden');
    context.classList.add('map-tooltip-card__context--hidden');
    root.classList.remove('map-tooltip-card--name-right');
    root.classList.add('map-tooltip-card--hidden');
    if (selectedPointSource) {
      selectedPointSource.clear();
    }
    if (selectedPointLayer) {
      selectedPointLayer.setStyle(createSelectedPointStyle(null) as never);
    }
    selectedJmcSource?.clear();
    setSelectedBoundaryState(null, null);
    return 0;
  }

  name.textContent = boundaryName;
  subname.textContent = jmcName ?? '';
  context.textContent = '';
  page.textContent = '';
  prev.disabled = true;
  next.disabled = true;
  footer.classList.add('map-tooltip-card__footer--hidden');
  toggleClass(subname, 'map-tooltip-card__subname--hidden', !jmcName);
  context.classList.add('map-tooltip-card__context--hidden');
  root.classList.remove('map-tooltip-card--name-right');
  root.classList.remove('map-tooltip-card--hidden');
  selectedPointSource?.clear();
  if (selectedPointLayer) {
    selectedPointLayer.setStyle(createSelectedPointStyle(null) as never);
  }
  setSelectedBoundaryState(boundaryName, jmcName);
  return 0;
}

function toggleClass(element: HTMLElement, className: string, hidden: boolean) {
  if (hidden) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}
