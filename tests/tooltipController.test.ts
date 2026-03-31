import { describe, expect, it } from 'vitest';
import { renderDockedTooltip } from '../src/features/map/tooltipController';

function createElementStub() {
  const classes = new Set<string>();
  return {
    textContent: '',
    disabled: false,
    classList: {
      add: (className: string) => classes.add(className),
      remove: (className: string) => classes.delete(className),
      contains: (className: string) => classes.has(className),
    },
  };
}

function createDomRefs() {
  return {
    root: createElementStub(),
    header: createElementStub(),
    name: createElementStub(),
    subname: createElementStub(),
    context: createElementStub(),
    footer: createElementStub(),
    page: createElementStub(),
    prev: createElementStub(),
    next: createElementStub(),
  };
}

describe('tooltipController', () => {
  it('renders boundary-only tooltip state when there are no point entries', () => {
    const dom = createDomRefs();
    const selectedPointLayer = {
      getSource: () => ({
        clear() {},
      }),
      setStyle() {},
    };
    const selectedJmcBoundaryLayer = {
      getSource: () => ({
        clear() {},
      }),
    };

    const index = renderDockedTooltip({
      dom,
      state: {
        entries: [],
        index: 0,
        boundaryName: 'Boundary A',
        jmcName: 'JMC North',
      },
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      selectedPointLayer: selectedPointLayer as never,
      selectedJmcBoundaryLayer: selectedJmcBoundaryLayer as never,
      setSelectedBoundaryForPoint() {},
      syncSelectedJmcBoundaries() {},
      setSelectedBoundaryState() {},
      createSelectedPointStyle() {
        return {};
      },
    });

    expect(index).toBe(0);
    expect(dom.name.textContent).toBe('Boundary A');
    expect(dom.subname.textContent).toBe('JMC North');
    expect(dom.page.textContent).toBe('');
    expect(dom.prev.disabled).toBe(true);
    expect(dom.next.disabled).toBe(true);
  });

  it('hides the tooltip and clears highlight state when no boundary is selected', () => {
    const dom = createDomRefs();
    let pointCleared = false;
    let jmcCleared = false;
    const selectedPointLayer = {
      getSource: () => ({
        clear() {
          pointCleared = true;
        },
      }),
      setStyle() {},
    };
    const selectedJmcBoundaryLayer = {
      getSource: () => ({
        clear() {
          jmcCleared = true;
        },
      }),
    };

    renderDockedTooltip({
      dom,
      state: {
        entries: [],
        index: 0,
        boundaryName: null,
        jmcName: null,
      },
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      selectedPointLayer: selectedPointLayer as never,
      selectedJmcBoundaryLayer: selectedJmcBoundaryLayer as never,
      setSelectedBoundaryForPoint() {},
      syncSelectedJmcBoundaries() {},
      setSelectedBoundaryState() {},
      createSelectedPointStyle() {
        return {};
      },
    });

    expect(dom.root.classList.contains('map-tooltip-card--hidden')).toBe(true);
    expect(pointCleared).toBe(true);
    expect(jmcCleared).toBe(true);
  });

  it('preserves the selected region highlight for boundary-only tooltip state', () => {
    const dom = createDomRefs();
    let jmcCleared = false;
    const selectedPointLayer = {
      getSource: () => ({
        clear() {},
      }),
      setStyle() {},
    };
    const selectedJmcBoundaryLayer = {
      getSource: () => ({
        clear() {
          jmcCleared = true;
        },
      }),
    };

    renderDockedTooltip({
      dom,
      state: {
        entries: [],
        index: 0,
        boundaryName: 'Boundary A',
        jmcName: 'Central & Wessex',
      },
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      selectedPointLayer: selectedPointLayer as never,
      selectedJmcBoundaryLayer: selectedJmcBoundaryLayer as never,
      setSelectedBoundaryForPoint() {},
      syncSelectedJmcBoundaries() {},
      setSelectedBoundaryState() {},
      createSelectedPointStyle() {
        return {};
      },
    });

    expect(dom.name.textContent).toBe('Boundary A');
    expect(dom.subname.textContent).toBe('Central & Wessex');
    expect(jmcCleared).toBe(false);
  });

  it('formats the displayed region subname without changing stored tooltip state', () => {
    const dom = createDomRefs();
    const selectedPointLayer = {
      getSource: () => ({
        clear() {},
      }),
      setStyle() {},
    };
    const selectedJmcBoundaryLayer = {
      getSource: () => ({
        clear() {},
      }),
    };

    renderDockedTooltip({
      dom,
      state: {
        entries: [],
        index: 0,
        boundaryName: 'Boundary A',
        jmcName: 'COA 3b London and East',
      },
      formatRegionLabel: (name) =>
        name ? name.replace(/^COA 3b\s+/, '') : name,
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      selectedPointLayer: selectedPointLayer as never,
      selectedJmcBoundaryLayer: selectedJmcBoundaryLayer as never,
      setSelectedBoundaryForPoint() {},
      syncSelectedJmcBoundaries() {},
      setSelectedBoundaryState() {},
      createSelectedPointStyle() {
        return {};
      },
    });

    expect(dom.subname.textContent).toBe('London and East');
  });
});
