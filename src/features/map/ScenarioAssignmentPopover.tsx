import type { ScenarioRegionDefinition } from '../../lib/schemas/scenarioWorkspaces';

interface ScenarioAssignmentPopoverProps {
  boundaryName: string;
  regions: ScenarioRegionDefinition[];
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  onClose: () => void;
}

export function ScenarioAssignmentPopover({
  boundaryName,
  regions,
  selectedRegionId,
  onSelectRegion,
  onClose,
}: ScenarioAssignmentPopoverProps) {
  return (
    <div
      className="map-assignment-popover map-tooltip-card"
      role="dialog"
      aria-label={`Assign ${boundaryName} to a region`}
    >
      <div className="map-assignment-popover__header">
        <div className="map-assignment-popover__copy">
          <div className="map-assignment-popover__eyebrow">Region assignment</div>
          <div className="map-assignment-popover__title">{boundaryName}</div>
        </div>
        <button
          type="button"
          className="map-assignment-popover__close"
          onClick={onClose}
          title="Close region assignment"
        >
          Off
        </button>
      </div>
      <div className="map-assignment-popover__options">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            className={`map-assignment-popover__option${
              selectedRegionId === region.id
                ? ' map-assignment-popover__option--active'
                : ''
            }`}
            onClick={() => onSelectRegion(region.id)}
          >
            <span
              className="map-assignment-popover__swatch"
              style={{ backgroundColor: region.palette.populated }}
              aria-hidden="true"
            />
            <span className="map-assignment-popover__label">{region.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
