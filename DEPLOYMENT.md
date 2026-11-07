# HealthVista deployment

## Current status — 2026-11-07

The application is NOT deployed yet. Local `npm run build` passed (shared package, Express server, Vite frontend). Upload of application source is blocked by a Windows sandbox setup failure: `helper_unknown_error: setup refresh had errors`. Both local command execution and desktop fallback failed. No application source or secrets have been uploaded. This document and render.yaml are deployment preparation only.

Connected services were verified and these resources were created:

| Provider | Resource | Identifier |
| --- | --- | --- |
| GitHub | space-rock-0/HealthVista | main |
| Vercel | healthvista in Vault / vault-cf00 | prj_gAQXibTKHzJfgPypDDAY0GJ9cJgS |
| Neon | healthvista, Singapore | wild-firefly-68831535 |
| Neon branch | default branch | br-blue-tooth-b3v6k65c |
| Upstash Redis | healthvista, Singapore | 947da247-33ac-42d0-8b2f-90dcd1d389f2 |
| Render | confirmed siddhartha's workspace | tea-dasl1ubncjis73akdhrg |

Neon has the vector extension enabled. Prisma migrations have NOT run. Redis credentials have NOT been installed in an application. Vercel is configured for Node 22, Vite, root directory apps/client, output dist, and public access; no deployment exists. No Render API service has been created.

## Resume source upload first

Restore local command execution before continuing. Inspect the existing local changes; do not overwrite the local .env files. The local folder now has an initialized Git repository but local identity/remote setup failed due to Git ownership checks. Use a command-scoped safe.directory for this exact workspace, rather than a global wildcard. GitHub main now contains this deployment preparation; preserve those commits when importing the application. Do not force push.

Local preparation changes to verify: .env.example files are allowed by .gitignore, .npm-cache and .deployment are excluded, old production Render URL removed from axiosClient, SocketProvider honors VITE_SOCKET_URL, CI uses Node 22 and VITE_API_URL. No real .env file may be committed. Inspect all files selected for upload for private data and credentials.

## Deployment sequence

1. Upload the complete source to this repository, excluding node_modules, caches, build output, local .env files and credentials. Verify the remote commit.
2. Configure the existing Vercel project using the complete source. Root: apps/client; install: npm ci; build: cd ../.. && npm run build -w packages/shared && npm run build -w apps/client; output: dist; Node 22. Verify the actual assigned production frontend origin (F).
3. Configure a Render Node web service in Singapore. Build from repository root: npm ci && npm run build -w packages/shared && npm run build -w apps/server. Pre-deploy: npm run db:deploy. Start: npm run start -w apps/server. HTTP health check: /api/health. The API process already starts the BullMQ workers, so no separate worker is needed initially.
4. Use the smallest always-running Render compute plan, 0.5c-512mb (legacy starter), currently $7/month. This is a proposed configuration; no paid service has been created. Confirm billing is available before applying. Free web services sleep after 15 minutes without traffic and cannot reliably run the in-process reminders and workers. Review workload memory after deployment.
5. Install server environment values privately. Use fresh, different JWT secrets with at least 32 characters. Set DATABASE_URL to the new Neon's pooled connection and DIRECT_URL to the same database's direct connection, both with TLS. Set REDIS_URL to Upstash's TLS Redis URL (rediss://default:PASSWORD@HOST:6379), not its REST URL, and REDIS_ENABLED=true. Existing local Google, Cloudinary, Jina, Stripe and Twilio keys were detected but have not been copied to Render. Never print or commit them.
6. Run all Prisma migrations on this newly created database, using the direct URL. Do not automatically run the existing demo seed: it creates publicly known demo1234 accounts and synthetic hospital data. Provision the first administrator with a private password using a reviewed bootstrap step. Generate data embeddings only after records exist and AI credentials are verified.
7. Capture the actual assigned public API origin (B). Apply the URL matrix below, then deploy both services and inspect terminal deployment states and runtime logs.
8. Verify /api/health, frontend /login route, CORS, patient registration/login, refresh cookies, Socket.io connection, Google OAuth, signed uploads, and Stripe test payments/webhook delivery. Verify reminder workers and Upstash command usage. Do not report integrations as working before testing them.

## Exact production URL matrix

F means the actual assigned Vercel production origin, with https and no trailing slash. B means the actual assigned Render API origin, with https and no trailing slash. Neither production URL has been verified yet. Do not use guessed domains.

| Location | Setting | Required value |
| --- | --- | --- |
| Vercel project environment | VITE_API_URL | B/api |
| Vercel project environment | VITE_SOCKET_URL | B |
| Vercel project environment | VITE_STRIPE_PUBLISHABLE_KEY | Publishable key from the same Stripe account and mode as the backend |
| Render environment | NODE_ENV | production |
| Render environment | CLIENT_URL | F |
| Render environment | CORS_ORIGINS | Only additional explicit trusted frontend origins; empty if none |
| Render environment | GOOGLE_CALLBACK_URL | B/api/auth/google/callback |
| Google Cloud Console, existing Web OAuth client | Authorized JavaScript origins | Add F; preserve localhost for local development if needed |
| Google Cloud Console, same client | Authorized redirect URIs | Add B/api/auth/google/callback |
| Google OAuth consent configuration | Publishing status / test users | If in Testing, add intended sign-in users; complete production publishing/verification as Google requires |
| Stripe Workbench / Developers webhooks | Endpoint URL | B/api/payments/webhook/stripe |
| Stripe webhook event selection | Events | payment_intent.succeeded, payment_intent.payment_failed, charge.refunded |
| Render environment | STRIPE_WEBHOOK_SECRET | Signing secret of that exact deployed endpoint; currently missing locally |
| Render environment | STRIPE_SECRET_KEY | Same Stripe account and test/live mode as frontend key and webhook |
| Render environment | DATABASE_URL / DIRECT_URL | Newly created Neon database, pooled / direct respectively |
| Render environment | REDIS_URL | Newly created Upstash TLS Redis connection URL |
| Render environment | CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | Existing account credentials, privately installed |
| Render environment | JINA_API_KEY | Existing Jina key, privately installed |
| Render environment | TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER | Existing account and authorized sending number |

Twilio is used for outbound SMS here; there is no inbound Twilio webhook URL to change. Trial accounts may require verified recipients and sender permissions. Cloudinary uses signed uploads; no application callback URL change was identified. The Cloudinary upload API host and Jina API host stay provider-owned URLs.

After any VITE_* change, rebuild and redeploy the frontend because Vite embeds these values at build time. After Render environment changes, redeploy the backend. Keep secrets only in the provider's environment settings. Do not paste them in chat.

References: https://render.com/docs/deploys, https://render.com/docs/free, https://render.com/docs/health-checks, https://render.com/docs/configure-environment-variables, https://render.com/pricing, https://vercel.com/docs/deployments.
