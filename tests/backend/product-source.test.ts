import { access } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fallbackProductImage } from "@/product-images";
import { CatalogueUnavailableError, loadProducts } from "@/server/product-source";

vi.mock("server-only", () => ({}));

const liveProduct = {
  id: 1,
  title: " Daypack ",
  description: " Canvas bag. ",
  category: " Men's Clothing ",
  price: 19.99,
  rating: { rate: 4.25, count: 50 },
  image: "https://fakestoreapi.com/img/daypack.png",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("loadProducts", () => {
  it("loads and normalizes Fake Store products by default", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", undefined);
    const fetchProducts = vi.fn().mockResolvedValue(Response.json([liveProduct]));
    vi.stubGlobal("fetch", fetchProducts);

    await expect(loadProducts()).resolves.toEqual([
      {
        id: "1",
        title: "Daypack",
        description: "Canvas bag.",
        category: { slug: "mens-clothing", name: "Men's Clothing" },
        priceCents: 1999,
        rating: 4.25,
        imageUrl: liveProduct.image,
      },
    ]);
    expect(fetchProducts).toHaveBeenCalledExactlyOnceWith("https://fakestoreapi.com/products", {
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
  });

  it("uses fixtures without making any network requests", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fixture");
    const fetchProducts = vi.fn();
    vi.stubGlobal("fetch", fetchProducts);

    const products = await loadProducts();

    expect(products).toHaveLength(8);
    expect(products.every(({ imageUrl }) => imageUrl.startsWith("/catalogue-fixtures/"))).toBe(true);
    await Promise.all(products.map(({ imageUrl }) => access(`public${imageUrl}`)));
    await access(`public${fallbackProductImage}`);
    expect(await loadProducts()).toEqual(products);
    expect(fetchProducts).not.toHaveBeenCalled();
  });

  it("reports an invalid source setting before making a network request", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fixtures");
    const fetchProducts = vi.fn();
    vi.stubGlobal("fetch", fetchProducts);

    await expect(loadProducts()).rejects.toThrow("CATALOGUE_SOURCE");
    expect(fetchProducts).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    null,
    "not a URL",
    "http://fakestoreapi.com/img/daypack.png",
    "https://fakestoreapi.com:444/img/daypack.png",
    "https://another.example/img/daypack.png",
    "https://fakestoreapi.com/products/1",
    "https://fakestoreapi.com/img/daypack.png?redirect=true",
    "https://fakestoreapi.com/img/daypack.svg",
    "https://fakestoreapi.com/img/daypack.SVG",
    "https://fakestoreapi.com/img/daypack.%73vg",
  ])("provides a local fallback for an unapproved or missing image (%s)", async (image) => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([{ ...liveProduct, image }])));

    await expect(loadProducts()).resolves.toMatchObject([{ imageUrl: fallbackProductImage }]);
  });

  it("allows an empty response", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));

    await expect(loadProducts()).resolves.toEqual([]);
  });

  it("rejects distinct category names that normalize to the same slug", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([
      { ...liveProduct, category: "A/V" },
      { ...liveProduct, id: 2, category: "A V" },
    ])));

    await expect(loadProducts()).rejects.toMatchObject({
      name: "CatalogueUnavailableError",
      cause: { issues: [expect.objectContaining({
        message: "Distinct category names must have unique slugs.",
      })] },
    });
  });

  it.each([
    { name: "an unexpected payload", body: { products: [] } },
    { name: "an invalid product", body: [{ ...liveProduct, price: "19.99" }] },
    { name: "duplicate IDs", body: [liveProduct, liveProduct] },
  ])("reports $name as a catalogue outage", async ({ body }) => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));

    await expect(loadProducts()).rejects.toBeInstanceOf(CatalogueUnavailableError);
  });

  it("reports a non-success status as a catalogue outage", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(loadProducts()).rejects.toMatchObject({
      name: "CatalogueUnavailableError",
      cause: { message: "Fake Store returned HTTP 503." },
    });
  });

  it("reports an upstream timeout as a catalogue outage", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    const timeout = new DOMException("Timed out.", "TimeoutError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));

    await expect(loadProducts()).rejects.toMatchObject({
      name: "CatalogueUnavailableError",
      cause: timeout,
    });
  });
});
