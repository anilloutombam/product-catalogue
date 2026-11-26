import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const mailpit = "http://127.0.0.1:8125";

test("retries a failed enquiry and verifies SMTP receipt in Mailpit", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const marker = `enquiry${randomUUID().replaceAll("-", "")}`;
  const email = `${marker}@example.test`;
  const customer = "Test Reviewer";
  const question = `Does this drive include a cable? ${marker}`;
  const delivery = Promise.withResolvers<void>();
  let attempts = 0;

  await page.route("**/api/products/9/enquiries", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({
        status: 503,
        json: {
          error: { code: "DELIVERY_UNAVAILABLE", message: "We couldn’t send your enquiry. Please try again." },
        },
      });
      return;
    }
    await delivery.promise;
    await route.continue();
  });

  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Search products" });
  await search.fill("drive");
  await search.press("Enter");
  await page.getByRole("link", { name: /^Portable external drive/ }).click();
  const enquire = page.getByRole("button", { name: "Enquire" });
  await enquire.focus();
  const scrollBeforeOpening = await page.evaluate(() => window.scrollY);
  await enquire.press("Enter");

  const form = page.getByRole("form", { name: "Your contact details" });
  const name = form.getByLabel("Name", { exact: true });
  const emailField = form.getByLabel("Email", { exact: true });
  const message = form.getByLabel("Message (optional)");
  const submit = form.getByRole("button", { name: "Send enquiry" });
  const thanks = page.getByRole("heading", { name: "Thank you" });

  await expect(form).toBeFocused();
  await expect(form).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBeforeOpening);
  await page.keyboard.press("Tab");
  await expect(name).toBeFocused();

  await name.fill(customer);
  await emailField.fill(email);
  await message.fill(question);
  await submit.click();
  await expect(form.getByRole("alert")).toHaveText("We couldn’t send your enquiry. Please try again.");
  await expect(name).toHaveValue(customer);
  await expect(emailField).toHaveValue(email);
  await expect(message).toHaveValue(question);
  await expect(thanks).toHaveCount(0);

  try {
    await submit.click();
    await expect(submit).toBeDisabled();
    await expect(page.getByText("Sending your enquiry…")).toBeVisible();
    await expect(thanks).toHaveCount(0);
    await expect.poll(() => attempts).toBe(2);
    await form.evaluate((element: HTMLFormElement) => element.requestSubmit());
  } finally {
    delivery.resolve();
  }

  await expect(thanks).toBeVisible();
  await expect(thanks).toBeFocused();
  expect(attempts).toBe(2);

  async function findMessages() {
    const response = await request.get(`${mailpit}/api/v1/search`, { params: { query: marker } });
    expect(response.ok()).toBe(true);
    const { messages }: { messages: { ID: string }[] } = await response.json();
    return messages;
  }

  await expect.poll(async () => (await findMessages()).length).toBe(1);
  const [{ ID }] = await findMessages();
  const receipt = await request.get(`${mailpit}/api/v1/message/${ID}`);
  expect(receipt.ok()).toBe(true);
  const delivered = await receipt.json();
  expect(delivered).toMatchObject({
    Subject: "Product enquiry: Portable external drive",
    From: { Address: "catalogue-e2e@example.test" },
    To: [{ Address: "Sales-E2E@example.test" }],
    ReplyTo: [{ Address: email }],
  });
  expect(delivered.Text).toContain("Product ID: 9");
  expect(delivered.Text).toContain("Product: Portable external drive");
  expect(delivered.Text).toContain(`Customer name: ${customer}`);
  expect(delivered.Text).toContain(`Customer email: ${email}`);
  expect(delivered.Text).toContain(question);
});

for (const { label, viewport, mobile, reducedMotion } of [
  { label: "short desktop", viewport: { width: 1280, height: 420 }, mobile: false, reducedMotion: "no-preference" },
  { label: "mobile", viewport: { width: 390, height: 640 }, mobile: true, reducedMotion: "no-preference" },
  { label: "mobile with reduced motion", viewport: { width: 390, height: 640 }, mobile: true, reducedMotion: "reduce" },
] as const) {
  test.describe(label, () => {
    test.use({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion });

    test("scrolls to the enquiry heading and first field when they start below the viewport", async ({ page }) => {
      if (reducedMotion === "reduce") {
        await page.addInitScript(() => {
          const scrollIntoView = Element.prototype.scrollIntoView;
          Element.prototype.scrollIntoView = function (options) {
            if (this instanceof HTMLFormElement && typeof options === "object") {
              this.dataset.scrollBehavior = options.behavior;
            }
            scrollIntoView.call(this, options);
          };
        });
      }

      await page.goto("/products/9");
      const enquire = page.getByRole("button", { name: "Enquire" });
      const form = page.getByRole("form", { name: "Your contact details" });
      await expect(form).toBeHidden();

      // Position the button low enough that even the start of the revealed form will be offscreen.
      const before = await enquire.evaluate((button) => {
        window.scrollBy({ top: button.getBoundingClientRect().bottom - window.innerHeight + 12, behavior: "instant" });
        const { left, width, top, height, bottom } = button.getBoundingClientRect();
        const panel = document.getElementById("product-enquiry")!;
        return {
          x: left + width / 2,
          y: top + height / 2,
          scrollY: window.scrollY,
          buttonBottom: bottom,
          formTop: bottom + Number.parseFloat(getComputedStyle(panel).marginTop),
          viewportBottom: window.innerHeight,
        };
      });
      expect(before.buttonBottom).toBeLessThanOrEqual(before.viewportBottom);
      expect(before.formTop).toBeGreaterThan(before.viewportBottom);

      // Use viewport coordinates so the browser driver cannot scroll the element into view for us.
      if (mobile) await page.touchscreen.tap(before.x, before.y);
      else await page.mouse.click(before.x, before.y);

      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before.scrollY);
      await expect(form.getByText("Your contact details", { exact: true })).toBeInViewport({ ratio: 1 });
      await expect(form.getByLabel("Name", { exact: true })).toBeInViewport({ ratio: 1 });
      await expect(form).toBeFocused();
      if (reducedMotion === "reduce") {
        await expect(form).toHaveAttribute("data-scroll-behavior", "instant");
      }

      await enquire.click();
      await expect(form).toBeHidden();
      await expect(enquire).toBeFocused();
    });
  });
}
