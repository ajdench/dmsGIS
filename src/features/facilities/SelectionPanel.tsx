import { PmcPanel } from '../groups/PmcPanel';
import { useAppStore } from '../../store/appStore';

export function SelectionPanel() {
  const regions = useAppStore((state) => state.regions);
  const facilitySearchQuery = useAppStore(
    (state) => state.facilityFilters.searchQuery,
  );
  const selectedRegions = useAppStore((state) => state.facilityFilters.regions);
  const setFacilitySearchQuery = useAppStore(
    (state) => state.setFacilitySearchQuery,
  );
  const setFacilityFilterRegions = useAppStore(
    (state) => state.setFacilityFilterRegions,
  );

  const selectedRegion = selectedRegions.length === 1 ? selectedRegions[0] : '';

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
        {regions.map((region) => (
          <option key={region.name} value={region.name}>
            {region.name}
          </option>
        ))}
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
