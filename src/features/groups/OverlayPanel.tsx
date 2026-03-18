import { useEffect, useRef } from 'react';
import { SliderField } from '../../components/controls/SliderField';
import { useAppStore } from '../../store/appStore';
import { getOverlayLayersForPanel } from './overlaySelectors';

export function OverlayPanel() {
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const overlayLayers = useAppStore((state) => state.overlayLayers);
  const setOverlayLayerVisibility = useAppStore(
    (state) => state.setOverlayLayerVisibility,
  );
  const setOverlayLayerOpacity = useAppStore(
    (state) => state.setOverlayLayerOpacity,
  );
  const setOverlayLayerBorderVisibility = useAppStore(
    (state) => state.setOverlayLayerBorderVisibility,
  );
  const setOverlayLayerBorderColor = useAppStore(
    (state) => state.setOverlayLayerBorderColor,
  );
  const setOverlayLayerBorderOpacity = useAppStore(
    (state) => state.setOverlayLayerBorderOpacity,
  );

  const panelLayers = getOverlayLayersForPanel(overlayLayers, activeViewPreset);

  return (
    <section className="panel panel--regions">
      <h2>Overlays</h2>
      <div className="stack-col">
        {panelLayers.map((layer) => (
          <OverlayLayerPopover
            key={layer.id}
            title={layer.name}
            visible={layer.visible}
            opacity={layer.opacity}
            borderVisible={layer.borderVisible}
            borderColor={layer.borderColor}
            borderOpacity={layer.borderOpacity}
            onVisibilityChange={(checked) =>
              setOverlayLayerVisibility(layer.id, checked)
            }
            onOpacityChange={(value) => setOverlayLayerOpacity(layer.id, value)}
            onBorderVisibilityChange={(checked) =>
              setOverlayLayerBorderVisibility(layer.id, checked)
            }
            onBorderColorChange={(color) =>
              setOverlayLayerBorderColor(layer.id, color)
            }
            onBorderOpacityChange={(value) =>
              setOverlayLayerBorderOpacity(layer.id, value)
            }
          />
        ))}
      </div>
    </section>
  );
}

interface OverlayLayerPopoverProps {
  title: string;
  visible: boolean;
  opacity: number;
  borderVisible: boolean;
  borderColor: string;
  borderOpacity: number;
  onVisibilityChange: (checked: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  onBorderVisibilityChange: (checked: boolean) => void;
  onBorderColorChange: (color: string) => void;
  onBorderOpacityChange: (opacity: number) => void;
}

function OverlayLayerPopover({
  title,
  visible,
  opacity,
  borderVisible,
  borderColor,
  borderOpacity,
  onVisibilityChange,
  onOpacityChange,
  onBorderVisibilityChange,
  onBorderColorChange,
  onBorderOpacityChange,
}: OverlayLayerPopoverProps) {
  const detailsRef = useOutsideClose();
  const slug = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="color-control">
      <span className="color-control__label color-control__label--region">{title}</span>
      <details className="color-popover" ref={detailsRef}>
        <summary className="color-popover__summary">
          <span className="color-popover__percent">{Math.round(opacity * 100)}%</span>
        </summary>
        <div className="color-popover__panel">
          <div className="popover-section">
            <label className="stack-row stack-row--tight popover-section__title">
              <input
                className="checkbox"
                type="checkbox"
                checked={visible}
                onChange={(event) => onVisibilityChange(event.currentTarget.checked)}
                aria-label={`${title} visible`}
              />
              <span>Visible</span>
            </label>
          </div>
          <div className="popover-section">
            <label className="field-label" htmlFor={`${slug}-opacity`}>
              Opacity
            </label>
            <SliderField
              id={`${slug}-opacity`}
              min={0}
              max={1}
              step={0.05}
              value={opacity}
              onChange={onOpacityChange}
              ariaLabel={`${title} opacity`}
              mode="percent"
            />
          </div>
          <div className="popover-section">
            <label className="stack-row stack-row--tight popover-section__title">
              <input
                className="checkbox"
                type="checkbox"
                checked={borderVisible}
                onChange={(event) =>
                  onBorderVisibilityChange(event.currentTarget.checked)
                }
                aria-label={`${title} border visible`}
              />
              <span>Border</span>
            </label>
            <label className="field-label" htmlFor={`${slug}-border-color`}>
              Colour
            </label>
            <input
              id={`${slug}-border-color`}
              className="color-input color-input--popover"
              type="color"
              value={borderColor}
              onChange={(event) => onBorderColorChange(event.currentTarget.value)}
              aria-label={`${title} border colour`}
            />
            <label className="field-label" htmlFor={`${slug}-border-opacity`}>
              Opacity
            </label>
            <SliderField
              id={`${slug}-border-opacity`}
              min={0}
              max={1}
              step={0.05}
              value={borderOpacity}
              onChange={onBorderOpacityChange}
              ariaLabel={`${title} border opacity`}
              mode="percent"
            />
          </div>
        </div>
      </details>
    </div>
  );
}

function useOutsideClose() {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const details = detailsRef.current;
      if (!details?.open) return;
      const target = event.target;
      if (target instanceof Node && !details.contains(target)) {
        details.removeAttribute('open');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return detailsRef;
}
