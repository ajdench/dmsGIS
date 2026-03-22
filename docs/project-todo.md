# Project Todo

User-derived task list for dmsGIS. Items reflect product decisions and feature intentions — not implementation-level bugs (see `sidebar-parity-bugs.md` for those).

---

## Open

### 1. Wire Point controls to Cities popover

**Area:** Labels pane — Cities row
**What:** The Cities label row shows accompanying point markers alongside city name text. The Cities popover currently exposes Text and Border controls only. Add a Point section to control the accompanying point (colour, size, opacity) independently of the label text.
**Why:** Cities points are visible map elements; without controls they are unmanageable from the sidebar.
**Files likely touched:** `src/features/labels/labelPanelFields.ts`, `src/store/appStore.ts` (if new basemap keys needed), map runtime layer config.

---

## Done

*(none yet)*
