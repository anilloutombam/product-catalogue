import Link from "next/link";

import { formatPrice } from "@/components/format-price";
import { ProductImage } from "@/components/product-image";
import type { Product } from "@/server/product";

export function ProductCard({
  product,
  headingLevel,
}: {
  product: Product;
  headingLevel: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white hover:border-accent"
    >
      <div className="relative aspect-[4/3] border-b border-stone-100">
        <ProductImage
          src={product.imageUrl}
          alt=""
          sizes="(max-width: 639px) 50vw, (max-width: 1279px) 33vw, 230px"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between gap-3 p-3 sm:p-4">
        <Heading className="wrap-anywhere text-sm leading-snug font-semibold group-hover:text-accent sm:text-base">
          {product.title}
        </Heading>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <p className="text-sm font-semibold sm:text-base">{formatPrice(product.priceCents)}</p>
          <p className="text-xs whitespace-nowrap text-stone-600">
            <span className="sr-only">Rating </span>{product.rating} / 5
          </p>
        </div>
      </div>
    </Link>
  );
}
