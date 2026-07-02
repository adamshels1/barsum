interface CoinIconProps {
  size?: number;
  style?: React.CSSProperties;
}

export function CoinIcon({ size = 14, style }: CoinIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/barscoin.png"
      alt=""
      width={size}
      height={size}
      style={{ display: "inline-block", verticalAlign: "-15%", objectFit: "contain", ...style }}
    />
  );
}
