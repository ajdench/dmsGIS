import type { PrototypePane } from './types';

export const PROTOTYPE_PANES: PrototypePane[] = [
  {
    id: 'basemap',
    title: 'Basemap',
    subtitle: 'Nested panes for grouped controls',
    sections: [
      {
        id: 'land',
        title: 'Land',
        badge: '84%',
        content: (
          <div className="prototype-control-stack">
            <label className="prototype-inline-field">
              <span>Visible</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="prototype-field">
              <span>Colour</span>
              <input type="color" defaultValue="#ecf0e6" />
            </label>
            <label className="prototype-field">
              <span>Opacity</span>
              <input type="range" min="0" max="100" defaultValue="84" />
            </label>
          </div>
        ),
      },
      {
        id: 'sea',
        title: 'Sea',
        badge: '78%',
        content: (
          <div className="prototype-control-stack">
            <label className="prototype-inline-field">
              <span>Visible</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="prototype-field">
              <span>Colour</span>
              <input type="color" defaultValue="#d9e7f5" />
            </label>
            <label className="prototype-field">
              <span>Opacity</span>
              <input type="range" min="0" max="100" defaultValue="78" />
            </label>
          </div>
        ),
      },
    ],
  },
  {
    id: 'facilities',
    title: 'Facilities',
    subtitle: 'PMC stays as a first-class sub-pane',
    sections: [
      {
        id: 'pmc',
        title: 'PMC',
        badge: '7 regions',
        content: (
          <div className="prototype-control-stack">
            <label className="prototype-field">
              <span>Shape</span>
              <select defaultValue="circle">
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="diamond">Diamond</option>
                <option value="triangle">Triangle</option>
              </select>
            </label>
            <label className="prototype-field">
              <span>Global size</span>
              <input type="range" min="1" max="12" step="0.5" defaultValue="4" />
            </label>
            <label className="prototype-field">
              <span>Search facilities</span>
              <input type="text" defaultValue="" placeholder="Search facilities..." />
            </label>
          </div>
        ),
      },
      {
        id: 'filters',
        title: 'Filters',
        badge: 'Prototype',
        content: (
          <div className="prototype-checklist">
            <label className="prototype-inline-field">
              <span>Populated only</span>
              <input type="checkbox" />
            </label>
            <label className="prototype-inline-field">
              <span>Show selected board</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="prototype-inline-field">
              <span>Sync tooltip paging</span>
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        ),
      },
    ],
  },
  {
    id: 'labels',
    title: 'Labels',
    subtitle: 'Same accordion treatment as top-level panes',
    sections: [
      {
        id: 'country-labels',
        title: 'Country labels',
        badge: 'Off',
        content: (
          <div className="prototype-control-stack">
            <label className="prototype-inline-field">
              <span>Visible</span>
              <input type="checkbox" />
            </label>
            <label className="prototype-field">
              <span>Colour</span>
              <input type="color" defaultValue="#0f172a" />
            </label>
          </div>
        ),
      },
      {
        id: 'major-cities',
        title: 'Major cities',
        badge: 'On',
        content: (
          <div className="prototype-control-stack">
            <label className="prototype-inline-field">
              <span>Visible</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="prototype-field">
              <span>Opacity</span>
              <input type="range" min="0" max="100" defaultValue="65" />
            </label>
          </div>
        ),
      },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    subtitle: 'Future families can slot in as sub-panes',
    sections: [
      {
        id: 'board-boundaries',
        title: 'Board boundaries',
        badge: '3 layers',
        content: (
          <div className="prototype-checklist">
            <label className="prototype-inline-field">
              <span>Care board boundaries</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="prototype-inline-field">
              <span>PMC populated boards</span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="prototype-inline-field">
              <span>PMC unpopulated boards</span>
              <input type="checkbox" />
            </label>
          </div>
        ),
      },
      {
        id: 'scenario-regions',
        title: 'Scenario regions',
        badge: 'Extensible',
        content: (
          <div className="prototype-note">
            This is where future NHS regions, scenario overlays, or manual region
            groupings could live without changing the parent sidebar structure.
          </div>
        ),
      },
    ],
  },
];
