import Image from "next/image";

type PixelAssetProps = {
  src: string;
  width: number;
  height: number;
  className?: string;
  alt?: string;
};

export function PixelAsset({
  src,
  width,
  height,
  className = "",
  alt = "",
}: PixelAssetProps) {
  return (
    <Image
      className={`pixel-asset ${className}`}
      src={src}
      width={width}
      height={height}
      alt={alt}
      unoptimized
    />
  );
}
