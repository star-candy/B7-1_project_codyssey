import { CSSProperties } from "react";

const BOARD_WIDTH = 1536;
const BOARD_HEIGHT = 1024;

type SpriteProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  label?: string;
};

export function Sprite({
  x,
  y,
  width,
  height,
  className = "",
  label,
}: SpriteProps) {
  const positionX = BOARD_WIDTH === width ? 0 : (x / (BOARD_WIDTH - width)) * 100;
  const positionY = BOARD_HEIGHT === height ? 0 : (y / (BOARD_HEIGHT - height)) * 100;
  const style: CSSProperties = {
    aspectRatio: `${width} / ${height}`,
    backgroundImage: "url('/assets/lucky-bunny-final-board.png')",
    backgroundSize: `${(BOARD_WIDTH / width) * 100}% ${(BOARD_HEIGHT / height) * 100}%`,
    backgroundPosition: `${positionX}% ${positionY}%`,
  };

  return (
    <span
      className={`design-sprite ${className}`}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
