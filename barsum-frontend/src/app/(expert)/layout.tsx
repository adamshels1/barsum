import { PushEnable } from "@/components/PushEnable";

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #4776e6 0%, #6a3de8 60%, #8e54e9 100%)",
        position: "relative",
      }}
    >
      <div style={{ position: "fixed", top: "-15%", right: "-8%", width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.18)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", left: "-8%", width: 180, height: 180, borderRadius: "50%", background: "rgba(0,0,0,0.12)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      <PushEnable subtitle="Узнавайте сразу, когда ребёнок присылает чтение на проверку" />
    </div>
  );
}
