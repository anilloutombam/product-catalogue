import { expect, test, type Locator } from "@playwright/test";

function productPaths(section: Locator) {
  return section.locator('a[href^="/products/"]').evaluateAll(
    (links) => links.map((link) => link.getAttribute("href")),
  );
}

test("browses, searches and opens a product using the catalogue layout", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(page).toHaveTitle("Product catalogue");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Featured products", level: 1 })).toBeVisible();
  await expect.poll(() => productPaths(main))
    .toEqual(["/products/1", "/products/9", "/products/2", "/products/10", "/products/3"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(main).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(main.getByRole("link", { name: "Electronics" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/categories\/electronics$/);
  const topRated = main.getByRole("region", { name: "Top-rated products" });
  const additional = main.getByRole("region", { name: "Additional products" });
  await expect.poll(() => productPaths(topRated)).toEqual(["/products/9", "/products/11", "/products/12"]);
  await expect.poll(() => productPaths(additional)).toEqual(["/products/10"]);

  const search = page.getByRole("searchbox", { name: "Search products" });
  await search.fill("  dRiVe  ");
  await search.press("Enter");
  await expect(main.getByRole("status")).toHaveText("4 products matching “dRiVe”");
  await main.getByRole("link", { name: /^Portable external drive/ }).click();
  await expect(page).toHaveURL(/\/products\/9$/);
  await expect(main.getByRole("heading", { name: "Portable external drive", level: 1 })).toBeVisible();
  await expect(main.getByRole("button", { name: "Enquire" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test("handles direct URLs, empty searches and missing catalogue entries", async ({ page }) => {
  await page.goto("/categories/mens-clothing");
  await expect(page).toHaveTitle("Men's clothing | Product catalogue");
  await expect(page.getByRole("heading", { name: "Men's clothing", level: 1 })).toBeVisible();
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb.getByRole("link", { name: "Catalogue" })).toHaveAttribute("href", "/");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Men's clothing");

  await page.goto("/products/2");
  await expect(page).toHaveTitle("Raglan cotton tee | Product catalogue");
  const productImage = page.getByRole("img", { name: "Raglan cotton tee" });
  await expect.poll(() => productImage.evaluate((image: HTMLImageElement) => {
    if (!image.currentSrc || image.naturalWidth === 0) return false;
    const source = new URL(image.currentSrc);
    return source.origin === location.origin && source.pathname === "/_next/image";
  })).toBe(true);
  await expect(page.getByRole("heading", { name: "Raglan cotton tee", level: 1 })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: "Catalogue" })).toHaveAttribute("href", "/");
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Raglan cotton tee");
  const categoryLink = breadcrumb.getByRole("link", { name: "Men's clothing" });
  await categoryLink.focus();
  await categoryLink.press("Enter");
  await expect(page).toHaveURL(/\/categories\/mens-clothing$/);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Men's clothing");

  await page.goto("/search?q=cotton");
  const searchStatus = page.getByRole("main").getByRole("status");
  await expect(searchStatus).toHaveText("2 products matching “cotton”");
  await expect(page).toHaveTitle("Search results for “cotton” | Product catalogue");
  await page.goto("/search?q=telescope");
  await expect(searchStatus).toHaveText("0 products matching “telescope”");
  for (const path of ["/search?q=", "/search?q=%20%20"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByText("Enter a search term to find products.")).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search products" })).toHaveValue("");
  }

  for (const path of ["/products/999", "/categories/unknown"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found", level: 1 })).toBeVisible();
  }
});

test("trims and submits the draft through client-side navigation and preserves search history", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search products" });
  const originalDocument = await page.evaluate(() => performance.timeOrigin);

  await search.fill("  cotton  ");
  await expect(page).toHaveURL("/");
  await expect(search).toHaveValue("  cotton  ");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  const searchStatus = page.getByRole("main").getByRole("status");
  await expect(searchStatus).toHaveText("2 products matching “cotton”");
  await expect(search).toHaveValue("cotton");
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(originalDocument);

  await page.reload();
  await expect(search).toHaveValue("cotton");

  await search.fill("  drive  ");
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/search\?q=drive$/);
  await expect(page).toHaveTitle("Search results for “drive” | Product catalogue");
  await expect(searchStatus).toHaveText("4 products matching “drive”");
  await expect(search).toHaveValue("drive");

  await search.fill("unsubmitted draft");
  await page.goBack();
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  await expect(search).toHaveValue("cotton");

  await page.goForward();
  await expect(page).toHaveURL(/\/search\?q=drive$/);
  await expect(search).toHaveValue("drive");
});

test("keeps the current search when an empty or whitespace draft is submitted", async ({ page }) => {
  await page.goto("/search?q=cotton");
  const search = page.getByRole("searchbox", { name: "Search products" });
  const button = page.getByRole("button", { name: "Search" });
  const alert = page.getByRole("search").getByRole("alert");

  await search.clear();
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  await button.click();
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  await expect(alert).toHaveText("Enter a search term.");
  await expect(search).toHaveAttribute("aria-invalid", "true");
  await expect(search).toHaveAccessibleDescription("Enter a search term.");
  await expect(search).toBeFocused();

  await search.fill("   ");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  await expect(page.getByRole("main").getByRole("status")).toHaveText("2 products matching “cotton”");
  await expect(alert).toBeVisible();

  await search.fill("drive");
  await expect(page).toHaveURL(/\/search\?q=cotton$/);
  await expect(alert).toHaveCount(0);
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=drive$/);
});

test("shows the local fallback when an optimized product image fails", async ({ page }) => {
  await page.route("**/_next/image?*", (route) => route.abort());
  await page.goto("/products/1");

  const image = page.getByRole("img", { name: "Image unavailable for Canvas daypack" });
  await expect(image).toHaveAttribute("src", "/catalogue-fixtures/placeholder.png");
  await expect.poll(() => image.evaluate((element: HTMLImageElement) =>
    element.complete && element.naturalWidth > 0 &&
    new URL(element.currentSrc).pathname === "/catalogue-fixtures/placeholder.png"
  )).toBe(true);
});
