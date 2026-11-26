import "server-only";

import { z } from "zod";

import { fixtureProducts } from "@/fixtures/products";
import { fallbackProductImage } from "@/product-images";
import type { Product } from "@/server/product";

const fakeStoreOrigin = "https://fakestoreapi.com";

function categorySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const fakeStoreProduct = z.object({
  id: z.int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  category: z.string().trim().refine((name) => categorySlug(name).length > 0),
  price: z.number().nonnegative().max(Number.MAX_SAFE_INTEGER / 100),
  rating: z.object({ rate: z.number().min(0).max(5) }),
  image: z.string().nullish(),
});

const fakeStoreCatalogue = z.array(fakeStoreProduct)
  .refine(
    (products) => new Set(products.map((product) => product.id)).size === products.length,
    "Product IDs must be unique.",
  )
  .refine((products) => {
    const namesBySlug = new Map<string, string>();
    for (const { category } of products) {
      const slug = categorySlug(category);
      const existing = namesBySlug.get(slug);
      if (existing !== undefined && existing !== category) return false;
      namesBySlug.set(slug, category);
    }
    return true;
  }, "Distinct category names must have unique slugs.");

function normalizeImage(image: string | null | undefined) {
  const url = image ? URL.parse(image) : null;
  if (
    url?.origin === fakeStoreOrigin &&
    url.pathname.startsWith("/img/") &&
    /\.(?:avif|gif|jpe?g|png|webp)$/i.test(url.pathname) &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash
  ) {
    return url.href;
  }
  return fallbackProductImage;
}

export class CatalogueUnavailableError extends Error {
  constructor(cause: unknown) {
    super("The product catalogue is temporarily unavailable.", { cause });
    this.name = "CatalogueUnavailableError";
  }
}

export async function loadProducts(): Promise<readonly Product[]> {
  const mode = process.env.CATALOGUE_SOURCE ?? "fake-store";
  if (mode === "fixture") return fixtureProducts;
  if (mode !== "fake-store") {
    throw new Error('CATALOGUE_SOURCE must be "fake-store" or "fixture".');
  }

  try {
    const response = await fetch(`${fakeStoreOrigin}/products`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Fake Store returned HTTP ${response.status}.`);

    const products = fakeStoreCatalogue.parse(await response.json());
    return products.map(({ id, title, description, category, price, rating, image }) => ({
      id: String(id),
      title,
      description,
      category: { slug: categorySlug(category), name: category },
      priceCents: Math.round(price * 100),
      rating: rating.rate,
      imageUrl: normalizeImage(image),
    }));
  } catch (error) {
    throw new CatalogueUnavailableError(error);
  }
}
