import "server-only";

import { z } from "zod";

import { enquiryLimits, type EnquiryError, type EnquiryResponse } from "@/enquiry";
import { getProduct } from "@/server/catalogue";
import { sendEnquiryEmail, type EnquiryEmail } from "@/server/mailer";
import type { Product } from "@/server/product";

const emailError = "Enter a valid email address.";

export const enquirySchema = z.object({
  name: z.string({ error: "Enter your name." })
    .trim()
    .min(1, "Enter your name.")
    .max(enquiryLimits.name, `Use ${enquiryLimits.name} characters or fewer for your name.`),
  email: z.string({ error: emailError })
    .refine((value) => !/[\r\n]/.test(value), emailError)
    .trim()
    .max(enquiryLimits.email, emailError)
    .pipe(z.email({ error: emailError })),
  message: z.string({ error: "Enter your message as text." })
    .trim()
    .max(enquiryLimits.message, `Use ${enquiryLimits.message} characters or fewer for your message.`)
    .optional(),
});

export function composeEnquiryEmail(
  product: Product,
  enquiry: z.infer<typeof enquirySchema>,
): EnquiryEmail {
  const lines = [
    `Product: ${product.title}`,
    `Product ID: ${product.id}`,
    `Category: ${product.category.name}`,
    "",
    `Customer name: ${enquiry.name}`,
    `Customer email: ${enquiry.email}`,
  ];
  if (enquiry.message) lines.push("", "Message:", enquiry.message);

  return {
    subject: `Product enquiry: ${product.title.replace(/[\r\n]+/g, " ")}`,
    replyTo: enquiry.email,
    text: lines.join("\n"),
  };
}

type EnquiryOutcome = {
  status: 200 | 400 | 404 | 503;
  body: EnquiryResponse;
};

function failure(
  status: 400 | 404 | 503,
  code: string,
  message: string,
  fields?: EnquiryError["fields"],
): EnquiryOutcome {
  return { status, body: { error: { code, message, fields } } };
}

export async function submitEnquiry(id: string, input: unknown): Promise<EnquiryOutcome> {
  const validation = enquirySchema.safeParse(input);
  if (!validation.success) {
    const { fieldErrors } = z.flattenError(validation.error);
    return failure(400, "INVALID_ENQUIRY", "Check your enquiry details and try again.", {
      name: fieldErrors.name?.[0],
      email: fieldErrors.email?.[0],
      message: fieldErrors.message?.[0],
    });
  }

  let product;
  try {
    product = await getProduct(id);
  } catch {
    console.warn("[enquiry] Catalogue lookup failed");
    return failure(503, "CATALOGUE_UNAVAILABLE", "We couldn’t check this product. Please try again.");
  }
  if (!product) {
    return failure(404, "PRODUCT_NOT_FOUND", "This product is no longer available. Browse the catalogue for another product.");
  }

  try {
    await sendEnquiryEmail(composeEnquiryEmail(product, validation.data));
  } catch {
    console.warn("[enquiry] SMTP delivery failed");
    return failure(503, "DELIVERY_UNAVAILABLE", "We couldn’t send your enquiry. Please try again.");
  }

  return { status: 200, body: { status: "accepted" } };
}
