# Project Todo

User-derived task list for dmsGIS. Items reflect product decisions and feature intentions — not implementation-level bugs (see `sidebar-parity-bugs.md` for those).

---

## Open

### 3. Zoom-relative map point scaling

**Area:** Facilities — map rendering
**What:** At high zoom levels map points look appropriately sized, but as the map zooms out the points remain the same screen size and become disproportionately large relative to the geography. Points (and their borders, if present) should scale down as the map zooms out, maintaining a consistent relationship to the geographic scale.
**Why:** Raised during the SVG icon refactor — the Icon scale is currently fixed per `size` setting and does not vary with zoom. This should be factored into any further size/scale work on map symbols.
**Notes:** The current `Icon.scale` is set once at style creation time. Zoom-aware scaling will require either a style function that recomputes scale on each render (keyed by zoom level) or use of OL resolution-based rendering. The per-region style cache in `facilityLayerStyles.ts` will also need to include zoom level as a cache key.
**Files likely touched:** `src/features/map/mapStyleUtils.ts`, `src/features/map/facilityLayerStyles.ts`.

---

### 2. Shape border rendering audit across all shapes and swatches

**Area:** Facilities — map rendering + sidebar swatch previews
**What:** Border rendering needs a full audit across shapes (circle, square, diamond, triangle) in both map icons and sidebar swatches. The map side now uses SVG `Icon` with clip-path inward borders, but swatches still use a separate inner-scale approach. Both paths need to agree on what "border off" and "border at 0 thickness" mean visually, and swatch previews should accurately reflect the rendered map state.
**Why:** The SVG icon refactor resolved map-side issues (inward borders, rounded corners, size normalisation). Remaining work is swatch alignment and verifying all border controls (visible, width, opacity) interact correctly end-to-end.
**Files likely touched:** `src/components/sidebarExact/ExactSwatch.tsx`, `src/features/map/facilityLayerStyles.ts`.

---

### 4. Land transparency dissolves into sea/background colour

**Area:** Basemap — land fill rendering
**What:** As land fill opacity is reduced, the background (generally the configured sea colour) should show through so that land masses visually dissolve into the sea/background. Currently land simply becomes transparent revealing whatever is behind it.
**Why:** User expectation — reducing land opacity should blend land into the surrounding sea colour rather than exposing the raw canvas/tile background.
**Notes:** The map viewport background is now set to white (`#fff`), so when both land and sea are at 0% the canvas is clean white (useful for future export). Country borders also auto-hide when land opacity reaches 0%.
**Files likely touched:** `src/features/map/MapWorkspace.tsx` (land fill style), possibly basemap store if new settings are needed.

---

### 1. Wire Point controls to Cities popover

**Area:** Labels pane — Cities row
**What:** The Cities label row shows accompanying point markers alongside city name text. The Cities popover currently exposes Text and Border controls only. Add a Point section to control the accompanying point (colour, size, opacity) independently of the label text.
**Why:** Cities points are visible map elements; without controls they are unmanageable from the sidebar.
**Files likely touched:** `src/features/labels/labelPanelFields.ts`, `src/store/appStore.ts` (if new basemap keys needed), map runtime layer config.

---

### 5. Basemap reset icon colour tuning

**Area:** Basemap — sidebar popover styling
**Priority:** Low
**What:** The reset-to-default-colour button icon uses a luminance-based grey that scales proportionally with the swatch background brightness. Land and Sea currently have subtly different icon greys. This may need further fine-tuning as default colours or design preferences evolve.
**Files likely touched:** `src/components/sidebarExact/ExactFields.tsx` (`computeSwatchIconColor` function).

---

## Done

### 6. Collapse all panes during drag reorder

**Area:** Sidebar — pane reorder UX
**What:** All major panes collapse when any pane is dragged for reorder, making targets compact and easy to place. Full open-pane state is restored on drop/cancel.
**Files touched:** `src/components/layout/RightSidebar.tsx`.
