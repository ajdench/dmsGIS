import { useLayoutEffect, useRef, useState } from 'react';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { useAppStore } from '../../store/appStore';
import {
  getOverlayPanelEmptyState,
  getOverlaySectionsForPanel,
} from './overlaySelectors';
import { buildOverlayPanelRows } from './overlayPanelFields';
import {
  ExactDragHandle,
  ExactFieldSections,
  ExactPillPopover,
  ExactSectionCardShell,
} from '../../components/sidebarExact/SidebarControls';
import {
  SidebarAccordion,
  SidebarAccordionItem,
} from '../../components/sidebarExact/SidebarAccordion';

export function OverlayPanelExact() {
  const [openPanes, setOpenPanes] = useState(['overlays']);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

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

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const panelSections = getOverlaySectionsForPanel(overlayLayers, activeViewPreset);
  const rows = buildOverlayPanelRows({
    layers: panelSections.flatMap((section) => section.layers),
    setOverlayLayerVisibility,
    setOverlayLayerOpacity,
    setOverlayLayerBorderVisibility,
    setOverlayLayerBorderColor,
    setOverlayLayerBorderOpacity,
  });
  const paneVisibilityState = collectImmediateChildVisibility(
    rows,
    (row) => row.visibility.state === 'on',
  );
  const emptyState = getOverlayPanelEmptyState(activeViewPreset, panelSections.length);

  return (
    <div ref={rootRef}>
      <SidebarAccordion value={openPanes} onValueChange={setOpenPanes} level="pane">
        <SidebarAccordionItem
          id="overlays"
          title="Overlays"
          level="pane"
          panel
          enabled={paneVisibilityState !== 'off'}
          toggleState={paneVisibilityState}
          onEnabledToggle={() => {
            const next = paneVisibilityState !== 'on';
            rows.forEach((row) => row.visibility.onChange(next));
          }}
        >
          <div className="prototype-panel__content">
            {emptyState ? (
              <p className="muted">{emptyState}</p>
            ) : (
              <div className="prototype-section-list">
                {rows.map((row) => (
                  <ExactSectionCardShell
                    key={row.id}
                    title={row.label}
                    enabled={row.visibility.state !== 'off'}
                    toggleState={row.visibility.state}
                    onEnabledToggle={() =>
                      row.visibility.onChange(row.visibility.state !== 'on')
                    }
                    pillPopover={
                      <ExactPillPopover
                        open={openPopoverId === row.id}
                        onOpenChange={(open) =>
                          setOpenPopoverId(open ? row.id : null)
                        }
                        summary={row.pill}
                        scrollContainer={sidebarElement}
                        portalContainer={workspaceGridElement}
                        viewportContainer={sidebarElement}
                      >
                        <ExactFieldSections
                          sections={row.sections}
                          ariaLabelPrefix={row.label}
                        />
                      </ExactPillPopover>
                    }
                    trailingControl={<ExactDragHandle label={row.label} />}
                  />
                ))}
              </div>
            )}
          </div>
        </SidebarAccordionItem>
      </SidebarAccordion>
    </div>
  );
}
