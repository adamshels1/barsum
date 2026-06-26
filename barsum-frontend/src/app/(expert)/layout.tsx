export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #f7971e 0%, #e8a020 50%, #ffd200 100%)",
        position: "relative",
      }}
    >
      <div style={{ position: "fixed", top: "-15%", right: "-8%", width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-8%", width: 180, height: 180, borderRadius: "50%", background: "rgba(0,0,0,0.12)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
