# Implementation plan

## Goal and acceptance

Build a React product catalogue on Next.js App Router with a Node.js backend. The reviewer can see five curated home products, follow category links to top-rated and additional items, search, open a product from a tile, and send an enquiry that reaches the sales inbox and shows a **Thank you** message. Include product images and loading, error, empty, and pending states.

Route all product data through the backend. Target a clean-clone walkthrough in under ten minutes with a single Compose command, a browser, and Docker Engine with Compose installed. Use public dependencies, local SMTP, and safe defaults. If the live catalogue is unavailable, the reviewer can launch the same app in explicit fixture mode.

## Architecture

- **UI:** Next.js Server Components render `/`, `/categories/[slug]`, `/search?q=…`, and `/products/[id]`. Use Tailwind CSS for a responsive, accessible UI and a small Client Component for enquiry submission.
- **Catalogue:** A server-only module owns featured selection, ranking, search, and ID lookup. A source adapter fetches Fake Store's product list at request time, validates it with Zod, and normalizes records. Fixture mode supplies deterministic products and local images. Use Next.js image optimization with a narrow upstream allowlist and a local fallback.
- **Enquiries:** `POST /api/products/:id/enquiries` accepts JSON `{ name, email, message? }`. Validate input with Zod, resolve the product server-side, and send a plain-text message to the configured sales recipient. Return `200` with `{ status: "accepted" }` after SMTP acceptance. Use `400` for invalid input, `404` for an unknown product, and `503` for unavailable catalogue or mail. Return stable error codes and actionable messages.
- **Email:** Nodemailer delivers over SMTP. Compose provides a local Mailpit inbox. Keep SMTP private to the Compose network and bind the app and inbox to loopback. Use configured sender and recipient, a validated reply address, and short timeouts.
- **Tests:** Vitest covers catalogue rules, source validation and failures, and enquiry validation and delivery failures. A single Playwright Chromium journey uses fixtures and verifies both **Thank you** and receipt through the Mailpit API.

## Phases

The elapsed bands are planning allocations for the full assignment. Record actual time separately.

| Elapsed | Deliverable |
| --- | --- |
| 0–25 min | Capture the approved plan, assumptions, and actual AI usage. Scaffold the app and tooling, probe Fake Store, and verify build, lint, and types. Stop for review. |
| 25–65 min | Build the source adapter, fixture data, catalogue rules, and backend catalogue tests. |
| 65–105 min | Build the home, category, search, and product pages with images and UI states. |
| 105–135 min | Implement enquiry submission, connect SMTP, and verify success and failure paths. |
| 135–160 min | Add the Playwright customer journey and time the clean-clone SMTP walkthrough. |
| 160–180 min | Review source and docs, record actual time and any cuts, and prepare the submission PR. |

Protect the five customer journeys, local SMTP evidence, backend tests, one browser journey, and the setup walkthrough. Optional work includes a broader browser matrix, caching, admin-managed featured products, and production mail delivery controls.

## Submission

Deliver full source and tests, README setup and stack rationale, DECISIONS.md, and AI_USAGE.md with actual time across planning, building, testing, and review as available. Keep the feature PR open against `main` and include verification details in the PR description. Keep the supplied assignment PDF out of the repository. The candidate replies with the repository URL within three days of receiving the brief and grants access to named reviewers if the repository is private.
