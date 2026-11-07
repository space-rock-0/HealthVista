# HealthVista deployment

## Status — 2026-11-08

The frontend and API are deployed. Application source was imported without
overwriting the deployment preparation history. Local secrets, dependencies,
build output and deployment tooling remain excluded from Git.

| Component | Resource |
| --- | --- |
| Frontend | https://healthvista-vault-cf00.vercel.app |
| Additional frontend alias | https://healthvista-gamma.vercel.app |
| API | https://healthvista-api.onrender.com |
| API health | https://healthvista-api.onrender.com/api/health |
| GitHub | https://github.com/space-rock-0/HealthVista, main |
| Vercel | healthvista, Vault, prj_gAQXibTKHzJfgPypDDAY0GJ9cJgS |
| Render | healthvista-api, srv-dbnmsu95efls73bprpvg, Singapore |
| Render workspace | siddhartha's workspace, tea-dasl1ubncjis73akdhrg |
| Neon | healthvista, wild-firefly-68831535, branch br-blue-tooth-b3v6k65c |
| Upstash Redis | healthvista, 947da247-33ac-42d0-8b2f-90dcd1d389f2 |

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
- VITE_API_URL: https://healthvista-api.onrender.com/api.
- VITE_SOCKET_URL: https://healthvista-api.onrender.com.
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

- Local typecheck, lint, 289 server tests, 33 client tests and production build passed.
- All 13 Prisma migrations applied; vector support is enabled.
- HTTPS API/database health returned success.
- Frontend /, /login and /register returned the SPA; its bundle contains the API origin.
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
- Browser automation could not start because its trusted Node runtime exited.
  Verification used HTTP/API calls; visual rendering and browser cookie behavior
  have not been confirmed.

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
The full dependency audit CI gate remains unsuccessful until those findings are
addressed. No audit threshold was weakened. Remaining moderate/high findings also
need review; this deployment is not a clean security audit.

Twilio delivery, full Stripe checkout/refunds, Cloudinary uploads, and Jina chat or
record-processing flows still need representative application-level tests.

## Provider consoles

- Vercel: https://vercel.com/vault-cf00/healthvista.
- Render: https://dashboard.render.com/web/srv-dbnmsu95efls73bprpvg.
- Google OAuth clients: https://console.cloud.google.com/apis/credentials.
- Stripe test webhooks: https://dashboard.stripe.com/test/webhooks.
