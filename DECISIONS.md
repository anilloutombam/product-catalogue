# Decisions and assumptions

## Application boundaries

- Server Components call the catalogue service directly. The product source handles upstream validation and normalization, the catalogue service owns ranking and search, and the enquiry service calls a separate SMTP transport. This keeps provider changes local. A second client could add thin read endpoints later.
- The Next.js lint preset currently uses ESLint 9 because several preset plugins declare support through that version. The locked lint dependencies require Node.js 22.13 or newer on the 22 line. Node.js 24 is also supported.

## Catalogue

- The owner chooses five featured IDs and their display order. Missing upstream IDs are logged and skipped. Within a category, show up to three top-rated products in descending rating order, with ID breaking ties. Reserve at least one additional product when the category contains two or more.
- Reject distinct upstream category names that normalize to the same slug because Fake Store supplies names without separate category IDs.
- Search matches trimmed, case-insensitive substrings in titles and descriptions. The submitted term lives in the URL so reload and history restore it. Blank submissions are blocked, and a direct empty query shows a prompt. Announce updated counts in a live region separately from document titles because the router announcement can run before the title updates.
- Allow trusted raster image paths through the same-origin image optimizer. Use a local placeholder for unsupported paths or failed image requests. SVG URLs use the placeholder because Next.js can otherwise pass them directly to the browser.
- Stream loading states on home and search. Resolve category and product lookups before rendering so direct requests for missing entries return HTTP 404. Page content and metadata share the request-scoped lookup.
- Default to Fake Store and switch to fixtures by explicit configuration. During setup the browser-based probe returned 403 and a sandboxed shell could not resolve the hostname. A later direct shell request and the Compose app container both received 200. Fixture mode avoids relying on that access during tests.

## Enquiry and delivery

- Accept up to 16 KiB of JSON. Require a name and a validated email with an optional message. Resolve the product by the route ID on the server. Send plain-text email to the configured sales recipient, with a single validated Reply-To.
- Confirm after SMTP accepts the sales recipient. Compare email domains case-insensitively and preserve the mailbox local part. Keep contact data out of application logs. Preserve form values on failure and suppress repeat submissions while a request is active.
- Pin Nodemailer 10.6.1 after npm audit reported 15 advisories against 8.0.11. The enquiry does not expose raw content or address lists, but it uses the affected SMTP reply parser. Version 10.1.4 is the first release that clears those advisories. The selected 10.6.1 release includes TypeScript declarations. [Raw content advisory](https://github.com/advisories/GHSA-p6gq-j5cr-w38f) · [SMTP reply advisory](https://github.com/advisories/GHSA-4g23-2xm8-66gc)
- Keep a five-second SMTP setup deadline and a separate ten-second socket inactivity timeout. In Nodemailer v10 the setup deadline covers DNS, TCP, greeting, and TLS. A slow external relay may hit the deadline sooner. [Nodemailer timeout release notes](https://github.com/nodemailer/nodemailer/releases/tag/v10.1.0)
- Run browser tests against a separate fixture app and Mailpit with loopback-only published ports. Fixed test addresses and empty credentials keep the tests independent of any configured relay. The mixed-case test address also exercises SMTP recipient normalization.

## Production considerations

Check live catalogue reliability and introduce enquiry abuse controls before a public deployment. If duplicate delivery after an uncertain SMTP response becomes a problem, address it alongside durable enquiry storage.
