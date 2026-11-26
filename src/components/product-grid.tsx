import { ProductCard } from "@/components/product-card";
import type { Product } from "@/server/product";

export function ProductGrid({
  products,
  headingLevel,
}: {
  products: readonly Product[];
  headingLevel: 2 | 3;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-5">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
