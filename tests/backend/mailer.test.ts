import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendEnquiryEmail } from "@/server/mailer";

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) };
});

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport } }));

const message = {
  subject: "Product enquiry: Canvas daypack",
  replyTo: "reviewer@example.test",
  text: "A product question.",
};

beforeEach(() => {
  for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS"]) {
    vi.stubEnv(key, undefined);
  }
  vi.stubEnv("MAIL_FROM", "catalogue@example.test");
  vi.stubEnv("SALES_EMAIL", "sales@example.test");
  sendMail.mockReset();
  createTransport.mockClear();
});

afterEach(() => vi.unstubAllEnvs());

describe("SMTP delivery", () => {
  it("uses the server-configured sender and recipient and checks acceptance", async () => {
    vi.stubEnv("SMTP_HOST", "mailpit");
    sendMail.mockResolvedValue({ accepted: ["sales@example.test"] });

    await expect(sendEnquiryEmail(message)).resolves.toBeUndefined();
    expect(createTransport).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      host: "mailpit",
      port: 1025,
      secure: false,
    }));
    expect(sendMail).toHaveBeenCalledExactlyOnceWith({
      ...message,
      from: "catalogue@example.test",
      to: "sales@example.test",
    });
  });

  it("treats a missing sales recipient in the acceptance result as a failure", async () => {
    sendMail.mockResolvedValue({ accepted: [], rejected: ["sales@example.test"] });

    await expect(sendEnquiryEmail(message)).rejects.toThrow("SMTP did not accept");
  });

  it("accepts SMTP domain normalization and preserves local-part case", async () => {
    vi.stubEnv("SALES_EMAIL", "Sales@EXAMPLE.TEST");
    sendMail.mockResolvedValueOnce({ accepted: ["Sales@example.test"] });
    sendMail.mockResolvedValueOnce({ accepted: ["sales@example.test"] });

    await expect(sendEnquiryEmail(message)).resolves.toBeUndefined();
    await expect(sendEnquiryEmail(message)).rejects.toThrow("SMTP did not accept");
  });

  it("allows blank credentials for the local unauthenticated transport", async () => {
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASS", "");
    sendMail.mockResolvedValue({ accepted: ["sales@example.test"] });

    await sendEnquiryEmail(message);
    expect(createTransport).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      auth: undefined,
      requireTLS: false,
    }));
  });

  it("rejects incomplete credentials before creating a transport", async () => {
    vi.stubEnv("SMTP_USER", "smtp-user");
    vi.stubEnv("SMTP_PASS", "");

    await expect(sendEnquiryEmail(message)).rejects.toThrow();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("requires TLS for authenticated SMTP without implicit TLS", async () => {
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_USER", "smtp-user");
    vi.stubEnv("SMTP_PASS", "smtp-password");
    sendMail.mockResolvedValue({ accepted: ["sales@example.test"] });

    await sendEnquiryEmail(message);
    expect(createTransport).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      port: 587,
      requireTLS: true,
      auth: { user: "smtp-user", pass: "smtp-password" },
    }));
  });
});
