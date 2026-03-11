import { useAppStore } from '../../store/appStore';
import { SliderField } from '../../components/controls/SliderField';

export function LayerPanel() {
  const layers = useAppStore((state) => state.layers);
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const toggleLayer = useAppStore((state) => state.toggleLayer);
  const setLayerOpacity = useAppStore((state) => state.setLayerOpacity);

  return (
    <section className="panel">
      <h2>Overlays</h2>
      {isLoading && <p className="muted">Loading layers…</p>}
      {error && <p className="muted">Error: {error}</p>}
      {layers.map((layer) => (
        <div key={layer.id} className="stack-row layer-row">
          <label className="stack-row">
            <input
              className="checkbox"
              type="checkbox"
              checked={layer.visible}
              onChange={() => toggleLayer(layer.id)}
            />
            <span>{layer.name}</span>
          </label>
          <SliderField
            value={layer.opacity}
            min={0}
            max={1}
            step={0.1}
            onChange={(event) =>
              setLayerOpacity(layer.id, event)
            }
            ariaLabel={`${layer.name} opacity`}
            mode="percent"
          />
        </div>
      ))}
    </section>
  );
}
