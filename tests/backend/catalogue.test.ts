import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCategoryCatalogue,
  getHomeCatalogue,
  getProduct,
  searchProducts,
} from "@/server/catalogue";

vi.mock("server-only", () => ({}));

function mockLiveElectronics(ids: number[]) {
  vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
  const payload = ids.map((id) => ({
    id,
    title: `Product ${id}`,
    description: "Sample product.",
    category: "Electronics",
    price: 10,
    rating: { rate: 4 },
  }));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
}

beforeEach(() => {
  vi.stubEnv("CATALOGUE_SOURCE", "fixture");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("catalogue behavior", () => {
  it("returns exactly five featured products in curated order and unique categories", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { featured, categories } = await getHomeCatalogue();

    expect(featured.map(({ id }) => id)).toEqual(["1", "9", "2", "10", "3"]);
    expect(categories).toEqual([
      { slug: "electronics", name: "Electronics" },
      { slug: "mens-clothing", name: "Men's clothing" },
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("splits the requested category by rating, breaking ties by ID", async () => {
    const category = await getCategoryCatalogue("mens-clothing");

    expect(category?.category.slug).toBe("mens-clothing");
    expect(category?.topRated.map(({ id }) => id)).toEqual(["2", "3", "4"]);
    expect(category?.additional.map(({ id }) => id)).toEqual(["1"]);
  });

  it.each([
    { ids: [9], expectedAdditional: [] },
    { ids: [10, 9], expectedAdditional: ["10"] },
  ])("reserves additional products when the category contains $ids", async ({
    ids,
    expectedAdditional,
  }) => {
    mockLiveElectronics(ids);

    const category = await getCategoryCatalogue("electronics");

    expect(category?.topRated.map(({ id }) => id)).toEqual(["9"]);
    expect(category?.additional.map(({ id }) => id)).toEqual(expectedAdditional);
  });

  it("warns and returns available selections if curated products disappear upstream", async () => {
    mockLiveElectronics([11, 9, 2]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { featured } = await getHomeCatalogue();

    expect(featured.map(({ id }) => id)).toEqual(["9", "2"]);
    expect(warn).toHaveBeenCalledExactlyOnceWith("[catalogue] Curated products are missing", {
      missingIds: ["1", "10", "3"],
    });
  });

  it("distinguishes an unknown category or product from a match", async () => {
    await expect(getCategoryCatalogue("unknown")).resolves.toBeUndefined();
    await expect(getProduct("99")).resolves.toBeUndefined();
    await expect(getProduct("9")).resolves.toMatchObject({
      id: "9",
      title: "Portable external drive",
    });
  });

  it("matches a trimmed, case-insensitive substring in titles and descriptions", async () => {
    const results = await searchProducts("  dRiVe  ");

    expect(results.map(({ id }) => id)).toEqual(["9", "10", "11", "12"]);
  });

  it("returns an empty result for a valid search with no matches", async () => {
    await expect(searchProducts("telescope")).resolves.toEqual([]);
  });

  it("returns an empty result for blank search without loading the catalogue", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    const fetchProducts = vi.fn();
    vi.stubGlobal("fetch", fetchProducts);

    await expect(searchProducts("  ")).resolves.toEqual([]);
    expect(fetchProducts).not.toHaveBeenCalled();
  });
});
