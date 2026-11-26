"use client";

import Image from "next/image";
import { useState } from "react";

import { fallbackProductImage } from "@/product-images";

type ProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  eager?: boolean;
};

export function ProductImage({ src, alt, sizes, eager = false }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const showFallback = src === fallbackProductImage || failedSource === src;

  return (
    <Image
      src={showFallback ? fallbackProductImage : src}
      alt={showFallback && alt ? `Image unavailable for ${alt}` : alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : "lazy"}
      unoptimized={showFallback}
      onError={showFallback ? undefined : () => setFailedSource(src)}
      className="object-contain p-4 sm:p-6"
    />
  );
}
