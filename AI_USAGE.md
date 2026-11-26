# AI usage

The project used OpenAI Codex with GPT-6-family models. The review and follow-up used GPT-6.2 Astra and GPT-6.2 Sol. The exact variants for the initial planning and scaffolding were not recorded. [PLAN.md](PLAN.md) captures the approved plan, and [AGENTS.md](AGENTS.md) contains the repository instructions.

## Key interactions

1. **Choose an architecture.** Codex proposed Vite and Express after reviewing the brief. The author pointed out their App Router experience and asked for Next.js, Fake Store, and Mailpit. The revised design runs the React pages and Node.js handler in one app, with server-side catalogue reads and explicit fixtures.
2. **Verify the catalogue and fixture setup.** The initial browser probe returned 403, while a later Compose container fetched Fake Store successfully. An initial asset download also assumed the API and upstream repository used the same filenames and returned 404. Codex used the original JPEGs with their license and kept the fixture paths local.
3. **Fix issues found in manual testing.** The author found that a submitted search cleared the visible field and that a blank submission could navigate to an empty query. Codex restored the field from the URL, separated the draft from the submitted term, and checked validation, reload, and browser history. The author later found that opening an enquiry could leave the form below the viewport. Codex added focus transfer and conditional scrolling with reduced-motion support. When manual testing still showed the issue, Codex traced it to the stale image on port 3000. The isolated Playwright image contained the fix. Codex rebuilt the local app and strengthened the tests to measure scroll offset and viewport visibility on short desktop and mobile layouts.
4. **Act on independent review and security findings.** A mixed-case sales domain returned 503 even though Mailpit had received the email. The review also found an SVG bypass, category slug collisions, and generic page announcements. The author approved fixes and regression coverage. The audit investigation led to a targeted Nodemailer 10.6.1 upgrade. Its bundled types exposed an obsolete recipient-object branch, which was removed. Both npm audits reported zero findings after the upgrade.
5. **Isolate browser test delivery.** The final review found that fixture mode could still use a separately configured SMTP relay. The browser suite now launches a separate Compose project with loopback ports, fixed test addresses and empty credentials. All six browser tests passed with simulated external relay settings in the shell, and Playwright refused to start when the test app port was already occupied.

## Time spent

| Activity | Approximate duration |
| --- | ---: |
| Requirements analysis and repository setup | 10 min |
| Architecture planning and scaffolding | 15 min |
| Application implementation | 40 min |
| Testing and manual verification | 30 min |
| Code review, corrections and security remediation | 25 min |
| Documentation and submission preparation | 20 min |
| **Total** | **2 hr 20 min** |

Durations are approximate and were reconstructed from development checkpoints. Some implementation, testing and review activities overlapped.
