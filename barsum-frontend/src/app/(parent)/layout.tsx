export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)",
        position: "relative",
      }}
    >
      <div style={{ position: "fixed", top: "-15%", right: "-8%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-8%", width: 200, height: 200, borderRadius: "50%", background: "rgba(0,0,0,0.15)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
