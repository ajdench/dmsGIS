import { useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { buildBasemapPanelRows } from './basemapPanelFields';
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

export function BasemapPanelExact() {
  const [openPanes, setOpenPanes] = useState(['basemap']);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const basemap = useAppStore((state) => state.basemap);
  const setBasemapElementColor = useAppStore(
    (state) => state.setBasemapElementColor,
  );
  const setBasemapElementOpacity = useAppStore(
    (state) => state.setBasemapElementOpacity,
  );
  const setBasemapLayerVisibility = useAppStore(
    (state) => state.setBasemapLayerVisibility,
  );

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const rows = buildBasemapPanelRows({
    basemap,
    setBasemapElementColor,
    setBasemapElementOpacity,
    setBasemapLayerVisibility,
  });
  const paneVisibilityState = collectImmediateChildVisibility(
    rows,
    (row) => row.visibility.state === 'on',
  );

  return (
    <div ref={rootRef}>
      <SidebarAccordion value={openPanes} onValueChange={setOpenPanes} level="pane">
        <SidebarAccordionItem
          id="basemap"
          title="Basemap"
          level="pane"
          panel
          enabled={paneVisibilityState !== 'off'}
          toggleState={paneVisibilityState}
          onEnabledToggle={() => {
            const next = paneVisibilityState !== 'on';
            setBasemapLayerVisibility('showLandFill', next);
            setBasemapLayerVisibility('showSeaFill', next);
          }}
        >
          <div className="prototype-panel__content">
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
                      triangleMinRatio={0.15}
                      triangleMaxRatio={0.85}
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
          </div>
        </SidebarAccordionItem>
      </SidebarAccordion>
    </div>
  );
}
