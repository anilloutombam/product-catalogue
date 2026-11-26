import "server-only";

import nodemailer from "nodemailer";
import { z } from "zod";

export type EnquiryEmail = {
  subject: string;
  text: string;
  replyTo: string;
};

const smtpConfig = z
  .object({
    host: z.string().min(1),
    port: z.coerce.number().int().min(1).max(65535),
    secure: z.enum(["true", "false"]).transform((value) => value === "true"),
    user: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
    from: z.email(),
    to: z.email(),
  })
  .refine(({ user, password }) => Boolean(user) === Boolean(password));

function normalizeEmailDomain(address: string) {
  const domainStart = address.lastIndexOf("@") + 1;
  return address.slice(0, domainStart) + address.slice(domainStart).toLowerCase();
}

export async function sendEnquiryEmail(message: EnquiryEmail): Promise<void> {
  const { host, port, secure, user, password, from, to } = smtpConfig.parse({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: process.env.SMTP_PORT ?? "1025",
    secure: process.env.SMTP_SECURE ?? "false",
    user: process.env.SMTP_USER || undefined,
    password: process.env.SMTP_PASS || undefined,
    from: process.env.MAIL_FROM ?? "catalogue@example.test",
    to: process.env.SALES_EMAIL ?? "sales@example.test",
  });

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && password ? { user, pass: password } : undefined,
    requireTLS: Boolean(user) && !secure,
    dnsTimeout: 5_000,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  const { accepted } = await transport.sendMail({ ...message, from, to });
  const salesRecipient = normalizeEmailDomain(to);
  const salesAccepted = accepted.some((recipient) => normalizeEmailDomain(recipient) === salesRecipient);
  if (!salesAccepted) {
    throw new Error("SMTP did not accept the configured sales recipient.");
  }
}
