import { PmcPanel } from '../groups/PmcPanel';
import { useAppStore } from '../../store/appStore';

export function SelectionPanel() {
  const facilityFilterOptions = useAppStore(
    (state) => state.facilityFilterOptions,
  );
  const facilitySearchQuery = useAppStore(
    (state) => state.facilityFilters.searchQuery,
  );
  const selectedRegions = useAppStore((state) => state.facilityFilters.regions);
  const selectedTypes = useAppStore((state) => state.facilityFilters.types);
  const selectedDefaultVisibility = useAppStore(
    (state) => state.facilityFilters.defaultVisibility,
  );
  const setFacilitySearchQuery = useAppStore(
    (state) => state.setFacilitySearchQuery,
  );
  const setFacilityFilterRegions = useAppStore(
    (state) => state.setFacilityFilterRegions,
  );
  const setFacilityFilterTypes = useAppStore(
    (state) => state.setFacilityFilterTypes,
  );
  const setFacilityDefaultVisibilityFilter = useAppStore(
    (state) => state.setFacilityDefaultVisibilityFilter,
  );

  const selectedRegion = selectedRegions.length === 1 ? selectedRegions[0] : '';
  const selectedType = selectedTypes.length === 1 ? selectedTypes[0] : '';

  return (
    <section className="panel">
      <h2>Facilities</h2>
      <PmcPanel embedded />
      <label className="field-label" htmlFor="facility-region-filter">
        Region
      </label>
      <select
        id="facility-region-filter"
        className="select"
        aria-label="Filter facilities by region"
        value={selectedRegion}
        onChange={(event) =>
          setFacilityFilterRegions(
            event.target.value ? [event.target.value] : [],
          )
        }
      >
        <option value="">All regions</option>
        {facilityFilterOptions.regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
      <label className="field-label" htmlFor="facility-type-filter">
        Type
      </label>
      <select
        id="facility-type-filter"
        className="select"
        aria-label="Filter facilities by type"
        value={selectedType}
        onChange={(event) =>
          setFacilityFilterTypes(event.target.value ? [event.target.value] : [])
        }
      >
        <option value="">All types</option>
        {facilityFilterOptions.types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <label className="field-label" htmlFor="facility-default-visibility-filter">
        Default visibility
      </label>
      <select
        id="facility-default-visibility-filter"
        className="select"
        aria-label="Filter facilities by default visibility"
        value={selectedDefaultVisibility}
        onChange={(event) =>
          setFacilityDefaultVisibilityFilter(
            event.target.value as
              | 'all'
              | 'default-visible'
              | 'non-default-visible',
          )
        }
      >
        <option value="all">All facilities</option>
        <option value="default-visible">Default visible</option>
        <option value="non-default-visible">Non-default visible</option>
      </select>
      <input
        className="input input--compact"
        type="text"
        placeholder="Search facilities..."
        aria-label="Search facilities"
        value={facilitySearchQuery}
        onChange={(event) => setFacilitySearchQuery(event.target.value)}
      />
    </section>
  );
}
