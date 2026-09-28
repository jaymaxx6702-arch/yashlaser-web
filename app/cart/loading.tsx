export default function Loading() {
  return (
    <main id="main-content" className="container section" aria-busy="true">
      <p className="eyebrow">Yash Laser</p>
      <h1>Loading…</h1>
      <p className="muted">Preparing your next step.</p>
      <div className="loading-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
