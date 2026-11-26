import "server-only";

import type { Product } from "@/server/product";
import { loadProducts } from "@/server/product-source";

const featuredProductIds = ["1", "9", "2", "10", "3"];
const maximumTopRated = 3;

export async function getHomeCatalogue() {
  const products = await loadProducts();
  const productsById = new Map(products.map((product) => [product.id, product]));
  const categoriesBySlug = new Map(
    products.map(({ category }) => [category.slug, category]),
  );
  const missingIds = featuredProductIds.filter((id) => !productsById.has(id));
  if (missingIds.length > 0) {
    console.warn("[catalogue] Curated products are missing", { missingIds });
  }

  const featured = featuredProductIds
    .map((id) => productsById.get(id))
    .filter((product) => product !== undefined);
  const categories = Array.from(categoriesBySlug.values()).sort((first, second) =>
    first.slug.localeCompare(second.slug, "en"),
  );

  return { featured, categories };
}

export async function getCategoryCatalogue(slug: string) {
  const products = await loadProducts();
  const matchingProducts = products.filter((product) => product.category.slug === slug);
  const category = matchingProducts[0]?.category;
  if (!category) return undefined;

  matchingProducts.sort(
    (first, second) =>
      second.rating - first.rating ||
      first.id.localeCompare(second.id, "en", { numeric: true }),
  );
  const topRatedCount = Math.min(maximumTopRated, Math.max(1, matchingProducts.length - 1));

  return {
    category,
    topRated: matchingProducts.slice(0, topRatedCount),
    additional: matchingProducts.slice(topRatedCount),
  };
}

export async function searchProducts(query: string): Promise<readonly Product[]> {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const products = await loadProducts();
  return products.filter(
    ({ title, description }) =>
      title.toLowerCase().includes(term) || description.toLowerCase().includes(term),
  );
}

export async function getProduct(id: string) {
  const products = await loadProducts();
  return products.find((product) => product.id === id);
}
