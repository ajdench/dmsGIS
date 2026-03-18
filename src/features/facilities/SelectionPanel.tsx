import { PmcPanel } from '../groups/PmcPanel';
import { useAppStore } from '../../store/appStore';

export function SelectionPanel() {
  const facilitySearchQuery = useAppStore((state) => state.facilitySearchQuery);
  const setFacilitySearchQuery = useAppStore(
    (state) => state.setFacilitySearchQuery,
  );

  return (
    <section className="panel">
      <h2>Facilities</h2>
      <PmcPanel embedded />
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
