"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { enquiryLimits, type EnquiryError, type EnquiryResponse } from "@/enquiry";

type Submission = "idle" | "pending" | "accepted" | { error: EnquiryError };

const requestFailure: EnquiryError = {
  code: "REQUEST_FAILED",
  message: "We couldn’t confirm your enquiry. Check your connection and try again.",
};

const fieldClass = "mt-1 block w-full rounded-lg border border-stone-400 bg-white px-3 py-2 aria-invalid:border-red-700 disabled:bg-stone-100";

export function EnquiryForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [submission, setSubmission] = useState<Submission>("idle");
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const pending = submission === "pending";
  const error = typeof submission === "object" ? submission.error : undefined;
  const fields = error?.fields;

  useEffect(() => {
    const form = formRef.current;
    if (!open || !form) return;

    form.focus({ preventScroll: true });
    const { top, bottom, height } = form.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      form.scrollIntoView({
        block: height > window.innerHeight ? "start" : "nearest",
        behavior: reduceMotion ? "instant" : "smooth",
      });
    }
  }, [open]);

  useEffect(() => {
    if (submission === "accepted") confirmation.current?.focus();
  }, [submission]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const form = new FormData(event.currentTarget);
    inFlight.current = true;
    setSubmission("pending");

    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
      });
      const result: EnquiryResponse = await response.json();
      if (response.ok && "status" in result && result.status === "accepted") {
        setSubmission("accepted");
      } else {
        setSubmission({ error: !response.ok && "error" in result ? result.error : requestFailure });
      }
    } catch {
      setSubmission({ error: requestFailure });
    } finally {
      inFlight.current = false;
    }
  }

  if (submission === "accepted") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 ref={confirmation} tabIndex={-1} className="text-xl font-semibold">Thank you</h2>
        <p className="mt-1 text-stone-700">Your enquiry has been sent.</p>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="product-enquiry"
        disabled={pending}
        onClick={(event) => {
          if (open) event.currentTarget.focus({ preventScroll: true });
          setOpen(!open);
        }}
        className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark disabled:opacity-70"
      >
        Enquire
      </button>
      <div id="product-enquiry" hidden={!open} className="mt-5 max-w-lg">
        <form
          ref={formRef}
          tabIndex={-1}
          method="post"
          onSubmit={handleSubmit}
          aria-labelledby="enquiry-contact-heading"
          aria-busy={pending}
        >
          {error && (
            <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error.message}
            </p>
          )}
          <fieldset disabled={pending} className="min-w-0 space-y-4">
            <legend id="enquiry-contact-heading" className="mb-2 text-lg font-semibold">Your contact details</legend>
            <div>
              <label htmlFor="enquiry-name" className="text-sm font-medium">Name</label>
              <input
                id="enquiry-name"
                name="name"
                autoComplete="name"
                required
                maxLength={enquiryLimits.name}
                aria-invalid={Boolean(fields?.name) || undefined}
                aria-describedby={fields?.name ? "enquiry-name-error" : undefined}
                className={fieldClass}
              />
              {fields?.name && <p id="enquiry-name-error" className="mt-1 text-sm text-red-700">{fields.name}</p>}
            </div>
            <div>
              <label htmlFor="enquiry-email" className="text-sm font-medium">Email</label>
              <input
                id="enquiry-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={enquiryLimits.email}
                aria-invalid={Boolean(fields?.email) || undefined}
                aria-describedby={fields?.email ? "enquiry-email-error" : undefined}
                className={fieldClass}
              />
              {fields?.email && <p id="enquiry-email-error" className="mt-1 text-sm text-red-700">{fields.email}</p>}
            </div>
            <div>
              <label htmlFor="enquiry-message" className="text-sm font-medium">
                Message <span className="font-normal text-stone-600">(optional)</span>
              </label>
              <textarea
                id="enquiry-message"
                name="message"
                rows={4}
                maxLength={enquiryLimits.message}
                aria-invalid={Boolean(fields?.message) || undefined}
                aria-describedby={fields?.message ? "enquiry-message-error" : undefined}
                className={fieldClass}
              />
              {fields?.message && <p id="enquiry-message-error" className="mt-1 text-sm text-red-700">{fields.message}</p>}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-dark disabled:opacity-70"
            >
              Send enquiry
            </button>
          </fieldset>
        </form>
        {pending && <p role="status" className="mt-3 text-sm text-stone-700">Sending your enquiry…</p>}
      </div>
    </>
  );
}
