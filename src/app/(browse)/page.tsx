import Link from "next/link";
import { connection } from "next/server";

import { ProductGrid } from "@/components/product-grid";
import { getHomeCatalogue } from "@/server/catalogue";

export default async function HomePage() {
  await connection();
  const { featured, categories } = await getHomeCatalogue();

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Featured products</h1>
      <nav
        id="categories"
        aria-label="Product categories"
        className="mt-6 mb-8 border-b border-stone-200 pb-6"
      >
        {categories.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium capitalize hover:border-accent hover:text-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-700">There are no categories to browse yet.</p>
        )}
      </nav>
      {featured.length > 0 ? (
        <ProductGrid products={featured} headingLevel={2} />
      ) : (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-stone-700">
          There are no featured products to show. Try browsing a category or searching for a product.
        </p>
      )}
    </>
  );
}
