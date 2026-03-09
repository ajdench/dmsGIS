export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__title">dmsGIS</div>
        <div className="topbar__subtitle">
          DMS healthcare facility geographic information service
        </div>
      </div>
      <div className="topbar__actions">
        <button className="button button--ghost">Open</button>
        <button className="button button--ghost">Save</button>
        <button className="button button--ghost">Export</button>
        <button className="button button--primary">Reset</button>
      </div>
    </header>
  );
}
