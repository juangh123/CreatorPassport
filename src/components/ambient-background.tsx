export function AmbientBackground() {
  return (
    <>
      <div className="ambient-glow" />
      <div className="noise-bg" />
      <div className="fixed inset-0 min-h-screen bg-grid-dark z-[-2] opacity-30" />
    </>
  );
}
