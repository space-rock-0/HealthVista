# HealthVista deployment

## Status — 2026-11-09

The frontend and API are deployed. Application source was imported without
overwriting the deployment preparation history. Local secrets, dependencies,
build output and deployment tooling remain excluded from Git.

| Component                 | Resource                                                          |
| ------------------------- | ----------------------------------------------------------------- |
| Frontend                  | https://healthvista-vault-cf00.vercel.app                         |
| Additional frontend alias | https://healthvista-gamma.vercel.app                              |
| API                       | https://healthvista-api.onrender.com                              |
| API health through site   | https://healthvista-vault-cf00.vercel.app/api/health              |
| GitHub                    | https://github.com/space-rock-0/HealthVista, main                 |
| Vercel                    | healthvista, Vault, prj_gAQXibTKHzJfgPypDDAY0GJ9cJgS              |
| Render                    | healthvista-api, srv-dbnmsu95efls73bprpvg, Singapore              |
| Render workspace          | siddhartha's workspace, tea-dasl1ubncjis73akdhrg                  |
| Neon                      | healthvista, wild-firefly-68831535, branch br-blue-tooth-b3v6k65c |
| Upstash Redis             | healthvista, 947da247-33ac-42d0-8b2f-90dcd1d389f2                 |

The user selected Render Free. The API sleeps while idle and background jobs pause
while it sleeps. No paid API compute plan was created. Migrations run before the
API starts because the free service does not support pre-deploy commands.

Production configuration was applied through connected provider tools.
render.yaml is a configuration template; this service was created directly,
not through an active Blueprint. The deployed service uses Render's default
TCP health check; /api/health was verified separately over HTTPS.

## Build and runtime configuration

- Node 22 on Vercel and Render.
- Vercel root: apps/client; install: npm ci; output: dist.
- Vercel build: cd ../.. && npm run build -w packages/shared && npm run build -w apps/client.
- Render build: npm ci && npm run build -w packages/shared && npm run build -w apps/server.
- Render start: npm run db:deploy && exec node apps/server/dist/server.js.
- Both providers deploy source updates from main automatically.
- VITE_API_URL: /api, forwarded by Vercel to the Render API.
- VITE_SOCKET_URL: empty, using the application origin and proxied HTTP polling.
- CLIENT_URL: https://healthvista-vault-cf00.vercel.app.
- CORS_ORIGINS also allows https://healthvista-gamma.vercel.app.
- DATABASE_URL uses Neon's pooled endpoint; DIRECT_URL uses its direct endpoint.
- REDIS_URL uses Upstash's TLS Redis connection, with REDIS_ENABLED=true.
- Distinct random production JWT secrets were generated.
- Existing Google, Cloudinary, Jina, Stripe and Twilio credentials were installed
  privately in Render. The Stripe publishable key is configured in Vercel.
- The Stripe test-mode webhook signing secret was installed in Render.

Keep environment values in provider settings. Rebuild the frontend after VITE_*
changes. Render environment changes create deployments; wait for the resulting
deployment to become live before verifying the change.

## Verification completed

- Local typecheck, lint, 292 server tests, 33 client tests and production build passed.
- All 13 Prisma migrations applied; vector support is enabled.
- HTTPS API/database health returned success.
- Frontend /, /login and /register returned the SPA; production API requests use the same-origin /api proxy.
- Credentialed CORS permits the primary frontend and excludes an untrusted origin.
- A disposable patient verified registration, login, profile retrieval, secure
  refresh cookies, session refresh, authenticated Socket.io and logout.
- The requested first administrator was provisioned with the supplied credentials.
  Administrator login, dashboard, user management, settings and logout passed.
- Cloudinary API ping, Jina embedding generation, Stripe test-mode credential access,
  and Twilio account status checks passed. No SMS or card charge was issued.
- Stripe's test-mode webhook was registered at
  https://healthvista-api.onrender.com/api/payments/webhook/stripe for
  payment_intent.succeeded, payment_intent.payment_failed and charge.refunded.
- Unsigned webhook requests returned 400; signed verification events and duplicate
  replay returned 200. Full checkout/payment flows were not exercised.
- Headless Edge verified production administrator login, profile retrieval, a secure
  HttpOnly first-party refresh cookie, token refresh and persistence after reload.
  The dashboard rendered the imported data (49 users and 12 departments), with
  healthy database and cache indicators and no browser script or API failures.
- Both frontend aliases returned successful API/database health through /api/health.
- All seven GitHub CI jobs passed for application commit 20dee3a, including server
  and client coverage, Prisma checks, dependency audit and secret scanning:
  https://github.com/space-rock-0/HealthVista/actions/runs/42517054709.

The application demo seed was not run. Administrator credentials are not stored in
this document or Git. Change the supplied demo password in account settings before
using the public deployment beyond testing.

## Google sign-in: external configuration required

The API uses the correct production callback, but Google returned
redirect_uri_mismatch. In the existing Google Web OAuth client, add:

- Authorized JavaScript origin: https://healthvista-vault-cf00.vercel.app.
- Additional origin if used: https://healthvista-gamma.vercel.app.
- Authorized redirect URI: https://healthvista-api.onrender.com/api/auth/google/callback.

Preserve localhost entries if needed. Ensure the consent screen permits intended
users, then test a complete Google sign-in. GOOGLE_CALLBACK_URL is already configured.

## Remaining validation and dependency findings

Compatible security updates reduced npm audit findings from 35 to 12. Two critical
findings remain in Vitest/Tinypool test tooling; npm proposes a major Vitest upgrade.
These historical findings were resolved on 2026-11-09: Vitest and its coverage
provider were upgraded to 5.1.0, Prisma's merge dependency was patched, and the
shadcn CLI dependency was removed while its exact CSS and MIT license were retained
locally. The current audit reports zero vulnerabilities. CI now blocks high and
critical findings rather than only critical findings.

Twilio delivery, full Stripe checkout/refunds, Cloudinary uploads, and other AI
record-processing flows still need representative application-level tests.

## Provider consoles

- Vercel: https://vercel.com/vault-cf00/healthvista.
- Render: https://dashboard.render.com/web/srv-dbnmsu95efls73bprpvg.
- Google OAuth clients: https://console.cloud.google.com/apis/credentials.
- Stripe test webhooks: https://dashboard.stripe.com/test/webhooks.

## Local test-data import — 2026-11-08

The user requested importing the current local database, with local values taking
priority on conflicts. A consistent local snapshot containing 756 application rows
was merged into the deployed database. The deployed-only administrator and test
patient were retained. There were no overlapping email addresses. Local hospital
settings replaced the initial deployed settings. Local password hashes, identifiers,
relationships, clinical records, billing, lab, inventory and chat data were retained.
The deployed Prisma migration history was preserved.

The import was rehearsed inside a transaction and rolled back before the committed
run. All 756 local rows were checked against their deployed counterparts before
commit. Foreign keys were validated and their original settings restored. The
existing audit protections stayed enabled.

| Data            | Imported local count | Deployed count immediately after import |
| --------------- | -------------------: | --------------------------------------: |
| Users           |                   47 |                                      49 |
| Patients        |                   26 |                                      27 |
| Doctors         |                    9 |                                       9 |
| Appointments    |                   40 |                                      40 |
| Bills           |                   15 |                                      15 |
| Lab orders      |                   31 |                                      31 |
| Medical records |                   18 |                                      18 |
| Prescriptions   |                   31 |                                      31 |
| Medicines       |                   12 |                                      12 |
| Chat messages   |                   44 |                                      44 |

Live API checks confirmed the imported lists and hospital settings. Existing
deployed administrator access, imported doctor/patient passwords and all three
dashboards passed. Derived caches were invalidated without clearing sessions or
background-job queues. This is a point-in-time import, not continuous local-to-cloud
synchronization. Cloudinary records retain their existing provider URLs; file bytes
were not duplicated.

Rollback backup: Neon branch backup-before-local-import-20261108,
br-wandering-sunset-b38iwyeu, with no compute endpoint. Private source/target snapshots
and verification reports are under the ignored local directory
.deployment/data-import-2026-11-07T18-52-18-055Z. These backups contain account and test
data and must stay out of Git and shared artifacts.

## AI assistant repair — 2026-11-08

The existing Jina API key was valid. The provider sent jina-vlm chat requests to
the Search Foundation host, which rejected that model with HTTP 422. Generation
now uses https://api-beta-vlm.jina.ai/v1/chat/completions, while embeddings continue
to use https://api.jina.ai/v1/embeddings. The same server-side key is used for both.
JSON-only prompting was tightened and regression tests cover endpoint routing and
rejection of generated programs. Code commit af0a7af became live in Render deploy
dep-dbnnguqvcj2c738kd0bg.

The imported source records also had no document_chunks search index. Backfill
created 114 chunks from all eight published knowledge-base articles and 106 eligible
patient sources: 30 signed consultation notes, 31 issued prescriptions, 27 verified
lab reports and 18 extracted medical records. The existing pipeline strips PII
before embedding. Source records and account credentials were preserved.

Stale AI answer caches were cleared without clearing sessions or job queues. Live
knowledge-base requests generated a visiting-hours answer with article citations
and fallback=false; a repeated request verified the answer cache. A live imported
patient generated a prescription answer with two citations scoped to their own
records and fallback=false. Requesting an unrelated patient's records returned 403.
All 325 local tests, typecheck, lint and the production build passed before deployment.
