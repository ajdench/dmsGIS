import { PmcPanel } from '../groups/PmcPanel';

export function SelectionPanel() {
  return (
    <section className="panel">
      <h2>Facilities</h2>
      <PmcPanel embedded />
      <input
        className="input input--compact"
        type="text"
        placeholder="Search facilities..."
        aria-label="Search facilities"
      />
    </section>
  );
}
