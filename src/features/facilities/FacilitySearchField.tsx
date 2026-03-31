import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  buildFacilitySearchSuggestions,
  buildFacilitySearchSuggestionRecords,
  extractFacilitySuggestionRecords,
} from '../../lib/facilitySearchSuggestions';
import type { FacilityRecord } from '../../lib/facilities';
import { normalizeFacilitySearchQuery } from '../../lib/facilityFilters';

interface FacilitySearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  onSuggestionSelect?: (facility: FacilityRecord) => void;
  panelTopBoundaryElement?: HTMLElement | null;
}

const FACILITY_SUGGESTION_LIMIT = 8;
const FACILITY_SEARCH_PANEL_JOIN_COMPENSATION_PX = 1;

export function FacilitySearchField({
  value,
  onValueChange,
  onSuggestionSelect,
  panelTopBoundaryElement = null,
}: FacilitySearchFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [facilityRecords, setFacilityRecords] = useState<FacilityRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [panelContentHeight, setPanelContentHeight] = useState(0);
  const [panelAvailableHeight, setPanelAvailableHeight] = useState<number | null>(null);
  const [panelRenderedHeight, setPanelRenderedHeight] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadFacilityNames() {
      setLoading(true);
      setLoadError(false);

      try {
        const facilitiesUrl = `${import.meta.env.BASE_URL}data/facilities/facilities.geojson`;
        const response = await fetch(facilitiesUrl);

        if (!response.ok) {
          throw new Error(`Failed to load facilities: ${response.status}`);
        }

        const data = (await response.json()) as {
          features?: Array<{ properties?: { name?: unknown } }>;
        };

        if (cancelled) {
          return;
        }

        setFacilityRecords(extractFacilitySuggestionRecords(data));
      } catch {
        if (cancelled) {
          return;
        }

        setFacilityRecords([]);
        setLoadError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFacilityNames();

    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = buildFacilitySearchSuggestions(
    facilityRecords,
    value,
    FACILITY_SUGGESTION_LIMIT,
  );
  const suggestionRecords = buildFacilitySearchSuggestionRecords(
    facilityRecords,
    value,
    FACILITY_SUGGESTION_LIMIT,
  );
  const hasActiveSearchQuery = normalizeFacilitySearchQuery(value).length > 0;
  const showPanel = open && (loading || loadError || suggestions.length > 0);

  useLayoutEffect(() => {
    if (!showPanel) {
      setPanelContentHeight(0);
      setPanelAvailableHeight(null);
      setPanelRenderedHeight(0);
      return;
    }

    function measurePanelGeometry() {
      const rootRect = rootRef.current?.getBoundingClientRect();
      const boundaryRect = panelTopBoundaryElement?.getBoundingClientRect();
      const panelElement = panelRef.current;
      const listElement = listRef.current;

      const panelBorderHeight = panelElement
        ? parseFloat(getComputedStyle(panelElement).borderTopWidth) +
          parseFloat(getComputedStyle(panelElement).borderBottomWidth)
        : 0;

      const listChildren = listElement ? Array.from(listElement.children) : [];
      const listRowGap = listElement
        ? parseFloat(getComputedStyle(listElement).rowGap || '0')
        : 0;
      const listContentHeight = listChildren.reduce((sum, child) => {
        return sum + child.getBoundingClientRect().height;
      }, 0);
      const listGapHeight =
        listChildren.length > 1 ? (listChildren.length - 1) * listRowGap : 0;
      const nextPanelContentHeight = Math.ceil(
        listContentHeight + listGapHeight + panelBorderHeight,
      );
      setPanelContentHeight(nextPanelContentHeight);
      setPanelRenderedHeight(
        Math.ceil(panelElement?.getBoundingClientRect().height ?? nextPanelContentHeight),
      );

      if (!rootRect || !boundaryRect) {
        setPanelAvailableHeight(null);
        return;
      }

      const nextPanelAvailableHeight = Math.ceil(
        rootRect.top -
          boundaryRect.top +
          FACILITY_SEARCH_PANEL_JOIN_COMPENSATION_PX,
      );
      setPanelAvailableHeight(Math.max(0, nextPanelAvailableHeight));
    }

    measurePanelGeometry();

    const observer = new ResizeObserver(() => {
      measurePanelGeometry();
    });

    if (panelTopBoundaryElement) {
      observer.observe(panelTopBoundaryElement);
    }

    if (rootRef.current) {
      observer.observe(rootRef.current);
    }

    if (panelRef.current) {
      observer.observe(panelRef.current);
    }

    if (listRef.current) {
      observer.observe(listRef.current);
    }

    window.addEventListener('resize', measurePanelGeometry);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measurePanelGeometry);
    };
  }, [showPanel, suggestions, loading, loadError, panelTopBoundaryElement]);

  useEffect(() => {
    const nextSuggestions = buildFacilitySearchSuggestions(
      facilityRecords,
      value,
      FACILITY_SUGGESTION_LIMIT,
    );

    if (nextSuggestions.length === 0) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((current) => {
      if (current < 0) {
        return 0;
      }

      if (current >= nextSuggestions.length) {
        return nextSuggestions.length - 1;
      }

      return current;
    });
  }, [facilityRecords, value]);

  function commitSuggestion(facility: FacilityRecord) {
    onValueChange(facility.displayName);
    onSuggestionSelect?.(facility);
    setOpen(false);
  }

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && rootRef.current?.contains(nextTarget)) {
      return;
    }

    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel && event.key === 'ArrowDown') {
      setOpen(true);
      return;
    }

    if (!showPanel) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        suggestions.length === 0 ? -1 : Math.min(current + 1, suggestions.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        suggestions.length === 0 ? -1 : Math.max(current - 1, 0),
      );
      return;
    }

    if (
      event.key === 'Enter' &&
      activeIndex >= 0 &&
      activeIndex < suggestionRecords.length
    ) {
      event.preventDefault();
      commitSuggestion(suggestionRecords[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`facility-search-field${showPanel ? ' facility-search-field--open' : ''}${
        showPanel && !hasActiveSearchQuery ? ' facility-search-field--browse' : ''
      }${showPanel && hasActiveSearchQuery ? ' facility-search-field--filtered' : ''}`}
      style={
        {
          ['--facility-search-panel-content-height' as string]: `${panelContentHeight}px`,
          ['--facility-search-panel-rendered-height' as string]: `${panelRenderedHeight}px`,
          ...(panelAvailableHeight !== null
            ? {
                ['--facility-search-panel-available-height' as string]: `${panelAvailableHeight}px`,
              }
            : {}),
        } as CSSProperties
      }
      onBlur={handleBlur}
    >
      <div className="facility-search-field__focus-frame" aria-hidden="true" />
      {showPanel ? (
        <div
          ref={panelRef}
          className="facility-search-field__panel"
          role="presentation"
        >
          <div
            id={listboxId}
            ref={listRef}
            className="facility-search-field__list"
            role="listbox"
            aria-label="Facility suggestions"
          >
            {loading ? (
              <div className="facility-search-field__status">Loading facilities...</div>
            ) : null}
            {!loading && loadError ? (
              <div className="facility-search-field__status">
                Facility suggestions unavailable...
              </div>
            ) : null}
            {!loading && !loadError
              ? suggestionRecords.map((suggestion, index) => (
                  <button
                    key={suggestion.id || suggestion.displayName}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`facility-search-field__option${
                      index === activeIndex
                        ? ' facility-search-field__option--active'
                        : ''
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commitSuggestion(suggestion)}
                  >
                    {suggestion.displayName}
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}
      <input
        className={`input input--compact facility-search-field__input${
          showPanel ? ' facility-search-field__input--open' : ''
        }`}
        type="text"
        placeholder="Search facilities..."
        aria-label="Search facilities"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls={showPanel ? listboxId : undefined}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
