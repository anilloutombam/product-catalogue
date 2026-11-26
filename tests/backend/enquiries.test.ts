import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/products/[id]/enquiries/route";
import { enquiryLimits } from "@/enquiry";
import { fixtureProducts } from "@/fixtures/products";
import { composeEnquiryEmail, enquirySchema } from "@/server/enquiries";
import { sendEnquiryEmail } from "@/server/mailer";

vi.mock("server-only", () => ({}));
vi.mock("@/server/mailer", () => ({ sendEnquiryEmail: vi.fn() }));

const sender = { name: "Test Reviewer", email: "reviewer@example.test" };
const deliver = vi.mocked(sendEnquiryEmail);

function postEnquiry(input: string, id = "1", contentType = "application/json") {
  return POST(
    new Request(`http://localhost/api/products/${id}/enquiries`, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: input,
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  vi.stubEnv("CATALOGUE_SOURCE", "fixture");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  deliver.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("enquiry validation and composition", () => {
  it("trims contact details and accepts an omitted message", () => {
    expect(enquirySchema.parse({
      name: "  Test Reviewer  ",
      email: "  reviewer@example.test  ",
    })).toEqual(sender);
  });

  it.each([
    "invalid",
    "Reviewer <reviewer@example.test>",
    "reviewer@example.test, other@example.test",
    "reviewer@example.test\r\nBcc: other@example.test",
    "reviewer@example.test\n",
  ])("rejects an invalid or unsafe Reply-To value", (email) => {
    expect(enquirySchema.safeParse({ ...sender, email }).success).toBe(false);
  });

  it("checks the name and message limits", () => {
    expect(enquirySchema.safeParse({ ...sender, name: "  " }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...sender, name: "A".repeat(enquiryLimits.name + 1) }).success).toBe(false);
    expect(enquirySchema.safeParse({
      ...sender,
      message: "A".repeat(enquiryLimits.message + 1),
    }).success).toBe(false);
  });

  it("composes a plain-text message with the catalogue product and validated customer", () => {
    const product = { ...fixtureProducts[0], title: "Canvas\ndaypack" };
    const email = composeEnquiryEmail(product, { ...sender, message: "Is it in stock?\nThanks." });

    expect(email).toEqual({
      subject: "Product enquiry: Canvas daypack",
      replyTo: sender.email,
      text: [
        "Product: Canvas\ndaypack",
        "Product ID: 1",
        "Category: Men's clothing",
        "",
        "Customer name: Test Reviewer",
        "Customer email: reviewer@example.test",
        "",
        "Message:",
        "Is it in stock?\nThanks.",
      ].join("\n"),
    });
    expect(composeEnquiryEmail(product, sender).text).not.toContain("Message:");
  });
});

describe("POST product enquiry", () => {
  it("uses the route ID and trusted product data, and waits for delivery", async () => {
    let acceptDelivery!: () => void;
    deliver.mockReturnValue(new Promise<void>((resolve) => { acceptDelivery = resolve; }));
    const response = postEnquiry(JSON.stringify({
      ...sender,
      message: "A product question.",
      productId: "9",
      title: "Untrusted product",
      to: "untrusted@example.test",
    }));

    try {
      await vi.waitFor(() => expect(deliver).toHaveBeenCalledExactlyOnceWith(
        composeEnquiryEmail(fixtureProducts[0], { ...sender, message: "A product question." }),
      ));
      await expect(Promise.race([response, Promise.resolve("pending")])).resolves.toBe("pending");
    } finally {
      acceptDelivery();
    }

    const accepted = await response;
    expect(accepted.status).toBe(200);
    await expect(accepted.json()).resolves.toEqual({ status: "accepted" });
  });

  it("returns field errors for invalid details and sends no mail", async () => {
    const response = await postEnquiry(JSON.stringify({ name: "", email: "invalid" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "INVALID_ENQUIRY",
        fields: { name: "Enter your name.", email: "Enter a valid email address." },
      },
    });
    expect(deliver).not.toHaveBeenCalled();
  });

  it.each([
    { input: "{", contentType: "application/json", status: 400, code: "INVALID_JSON" },
    { input: " ".repeat(16_385), contentType: "application/json", status: 413, code: "ENQUIRY_TOO_LARGE" },
    { input: JSON.stringify(sender), contentType: "text/plain", status: 415, code: "UNSUPPORTED_MEDIA_TYPE" },
  ])("rejects $code before attempting delivery", async ({ input, contentType, status, code }) => {
    const response = await postEnquiry(input, "1", contentType);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ error: { code } });
    expect(deliver).not.toHaveBeenCalled();
  });

  it("returns not found for a product that does not exist", async () => {
    const response = await postEnquiry(JSON.stringify(sender), "999");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "PRODUCT_NOT_FOUND" } });
    expect(deliver).not.toHaveBeenCalled();
  });

  it("reports an upstream failure without attempting delivery", async () => {
    vi.stubEnv("CATALOGUE_SOURCE", "fake-store");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    const response = await postEnquiry(JSON.stringify(sender));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "CATALOGUE_UNAVAILABLE" } });
    expect(deliver).not.toHaveBeenCalled();
  });

  it("reports an SMTP failure without logging or returning the customer's data", async () => {
    deliver.mockRejectedValue(new Error(`SMTP detail for ${sender.email}`));

    const response = await postEnquiry(JSON.stringify(sender));

    expect(response.status).toBe(503);
    const body = await response.text();
    expect(JSON.parse(body)).toMatchObject({ error: { code: "DELIVERY_UNAVAILABLE" } });
    expect(body).not.toContain(sender.email);
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[enquiry] SMTP delivery failed");
  });
});
