"use client";

import Lottie from "lottie-react";
import mascotWaveAnimation from "../../public/lotties/mascot-wave.json";

interface MascotWaveProps {
  size?: number;
  animate?: boolean;
}

export function MascotWave({ size = 200, animate = true }: MascotWaveProps) {
  return (
    <Lottie
      animationData={mascotWaveAnimation}
      loop={1}
      autoplay={animate}
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        mixBlendMode: "screen",
      }}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
