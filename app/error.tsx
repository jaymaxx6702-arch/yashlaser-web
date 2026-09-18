"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="container" style={{ paddingBlock: 64 }}>
      <h1>Temporarily unavailable</h1>
      <p>Your request could not be completed. Please try again.</p>
      <button type="button" className="button button-dark" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
