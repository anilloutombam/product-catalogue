# Project instructions

- Read PLAN.md and DECISIONS.md before changing scope or architecture. Complete the approved phase and verify its exit criteria before moving on.
- Use TypeScript and the Next.js App Router. Keep catalogue reads on the server and pass normalized products to the UI. Keep Route Handlers thin and reserve them for HTTP entry points the app uses.
- Keep Fake Store and SMTP details in server modules. Validate upstream data and enquiry input with Zod. Use explicit fixture mode for repeatable checks and local fixture images for offline operation.
- Use Tailwind CSS with semantic HTML, visible keyboard focus, labels, and accessible status messages. Handle loading, failure, and empty states.
- Use Vitest for backend tests and Playwright for the critical browser journey. Test with deterministic inputs. Verify SMTP receipt in Mailpit.
- Run `npm run lint`, `npm run typecheck`, and `npm run build` before reporting a phase complete. Run the tests relevant to the change and report any checks that could not run.
- Keep secrets, customer contact data, generated test reports, and the supplied assignment PDF out of Git. Put safe configuration examples in .env.example. Keep local app and inbox ports bound to loopback.
- Record engineering decisions in DECISIONS.md and actual AI interactions and corrections in AI_USAGE.md. Record time only when observed or supplied by the author.
