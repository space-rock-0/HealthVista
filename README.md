# HealthVista — PERN + AI Hospital Management System

A hospital management application built with PostgreSQL, Express, React and Node.js.
It brings patient registration, scheduling, clinical records, laboratory workflows,
pharmacy, billing and role-based dashboards into one application, with Jina AI
assistants and permission-scoped semantic search.

## Live application

| Service                   | URL                                                                            |
| ------------------------- | ------------------------------------------------------------------------------ |
| Application               | [healthvista-vault-cf00.vercel.app](https://healthvista-vault-cf00.vercel.app) |
| Sign in                   | [Open login](https://healthvista-vault-cf00.vercel.app/login)                  |
| Alternate application URL | [healthvista-gamma.vercel.app](https://healthvista-gamma.vercel.app)           |
| API health                | [Check API and database](https://healthvista-api.onrender.com/api/health)      |
| API documentation         | [Swagger UI](https://healthvista-api.onrender.com/api/docs)                    |

The frontend runs on Vercel, the API on Render, PostgreSQL on Neon, and Redis on
Upstash. The API uses Render's free plan: it sleeps when idle, so the first request
can take longer and background jobs pause while it sleeps.

The local test dataset was imported on **8 November 2026**. All **756 application
rows** were verified against the deployed database, including 47 local users,
26 patients, 9 doctors, 40 appointments, 15 bills, 31 lab orders and 18 medical
records. Existing deployed-only accounts were preserved, giving 49 users and
27 patients immediately after import. This was a snapshot import; later local
changes do not synchronize automatically.

See [DEPLOYMENT.md](DEPLOYMENT.md) for provider configuration, migration verification,
backups and remaining integration checks. Account credentials are not published here.

## Features

- **Identity and access:** seven roles, JWT access and refresh tokens, account
  lockout, patient Google sign-in, doctor verification and staff management.
- **Scheduling and reception:** doctor availability, appointment booking and
  rescheduling, QR check-in, walk-in registration and live queue displays.
- **Clinical records:** SOAP notes, prescription safety checks, vitals, allergies,
  medical history, referrals, dependent profiles and document uploads.
- **Laboratory and pharmacy:** test orders, sample collection, result verification,
  critical alerts, inventory, dispensing, batch recalls and expiry tracking.
- **Billing:** consolidated bills, discounts, partial payments, Stripe card
  payments, cash recording, refunds and printable receipts.
- **AI:** patient and doctor assistants, report explanations, SOAP draft assistance,
  a hospital knowledge base and pgvector retrieval filtered by access permissions.
- **Operations:** role dashboards, analytics, global search, append-only audit
  records, in-app notifications, Socket.io updates and BullMQ background jobs.
- **Interface:** English and Urdu, RTL layout, dark mode and print styles.

Supported roles: `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `PHARMACIST`,
`LAB_TECHNICIAN`, `ACCOUNTANT` and `ADMIN`.

## Technology

| Layer          | Technology                                            |
| -------------- | ----------------------------------------------------- |
| Frontend       | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui |
| Client state   | TanStack Query and Zustand                            |
| Backend        | Node.js 22, Express 5, TypeScript and Prisma          |
| Database       | PostgreSQL with pgvector                              |
| Cache and jobs | Redis, BullMQ and Socket.io                           |
| AI             | Jina AI and permission-scoped retrieval               |
| Integrations   | Stripe, Cloudinary, Google OAuth and Twilio           |

## Run locally

Use Node.js 22 and npm. The included [Docker Compose configuration](docker-compose.yml)
provides PostgreSQL 16 with pgvector and Redis.

```bash
docker compose up -d
npm ci

cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

On Windows PowerShell, use `Copy-Item` in place of `cp` if preferred. Fill in the
database URLs, frontend origin and two different random JWT secrets of at least
32 characters in the server environment file. The example files document optional
provider credentials:

- [Server environment example](apps/server/.env.example)
- [Client environment example](apps/client/.env.example)

Apply the existing migrations and start both apps:

```bash
npm run db:deploy
npm run dev
```

Local URLs:

- Frontend: http://localhost:5173
- API: http://localhost:5000
- API documentation: http://localhost:5000/api/docs

For a disposable local test database, the optional demo seed and embedding backfill are:

```bash
npm run db:seed
npm run db:embed
```

The seed creates synthetic data and known demo credentials. Run it only against a
local test database. Embedding generation requires configured Jina credentials.
Keep real `.env` files, database snapshots and credentials out of Git.

## Google sign-in configuration

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials),
open the Web application OAuth client matching the backend's `GOOGLE_CLIENT_ID`.

Authorized JavaScript origins:

```text
https://healthvista-vault-cf00.vercel.app
https://healthvista-gamma.vercel.app
```

Authorized redirect URI:

```text
https://healthvista-api.onrender.com/api/auth/google/callback
```

The backend's `GOOGLE_CALLBACK_URL` already uses this production callback. Preserve
localhost origins and callbacks if local sign-in is still needed. If the OAuth app
is in Testing, add intended users under **Google Auth Platform → Audience → Test users**.

Google sign-in creates patient sessions; staff accounts use password sign-in.

## Payments and provider configuration

The deployed Stripe integration uses **test mode**. The client publishable key and
server secret key must belong to the same Stripe account and mode.

| Setting                       | Location                    |
| ----------------------------- | --------------------------- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Vercel frontend environment |
| `STRIPE_SECRET_KEY`           | Render API environment      |
| `STRIPE_WEBHOOK_SECRET`       | Render API environment      |

Stripe webhook endpoint:

```text
https://healthvista-api.onrender.com/api/payments/webhook/stripe
```

Subscribed events: `payment_intent.succeeded`, `payment_intent.payment_failed`
and `charge.refunded`. Creating a PaymentIntent leaves the application payment
pending; a verified webhook settles it and updates the bill balance.

Cloudinary uploads, Jina features and Twilio SMS use server-side credentials.
Never put secret keys in `VITE_*` variables: those values become public browser code.
Rebuild the frontend after changing its environment variables.

Jina embeddings and chat use separate API hosts. The application sends embeddings
to `api.jina.ai` and `jina-vlm` generation to `api-beta-vlm.jina.ai`, using the same
server-side `JINA_API_KEY`. The knowledge assistant also needs indexed, published
articles; importing database records does not run the embedding backfill. The eight
deployed knowledge-base articles have been indexed.

## Validation and current limits

Deployment validation passed TypeScript checks, lint, the production build,
**292 server tests** and **33 client tests**. Live API checks verified registration,
password login, refresh cookies, profile access, Socket.io, administrator screens,
and migrated doctor/patient dashboards. Stripe webhook signature and duplicate
handling checks passed.

Visual browser verification, full Stripe checkout/refunds, file uploads and SMS
delivery still need application-level testing. Google sign-in requires the OAuth
console settings above. Dependency auditing still reports findings, including
critical Vitest/Tinypool test-tooling advisories; details are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Development commands

| Command              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Build shared code and start frontend and API |
| `npm run dev:client` | Start Vite                                   |
| `npm run dev:server` | Start the API in watch mode                  |
| `npm run build`      | Build shared code, API and frontend          |
| `npm run typecheck`  | Check workspace TypeScript                   |
| `npm run lint`       | Run ESLint                                   |
| `npm test`           | Run server and client tests                  |
| `npm run db:deploy`  | Apply existing Prisma migrations             |
| `npm run db:migrate` | Create and apply a development migration     |
| `npm run db:seed`    | Populate a local test database               |
| `npm run db:embed`   | Backfill embeddings                          |
| `npm run db:studio`  | Open Prisma Studio                           |

BullMQ workers run inside the API process; a separate worker command is not required.
Monitor the Upstash account's command quota. Setting `REDIS_ENABLED=false` disables
caching and background queues; database reads and an in-memory Socket.io adapter
remain available on a single API instance.

## Repository structure and workflow

```text
apps/client/        React frontend
apps/server/        Express API, Prisma schema, migrations and workers
packages/shared/    Shared schemas, types and constants
docs/architecture/ Security implementation notes
DEPLOYMENT.md      Live deployment and migration record
render.yaml        Render configuration template
```

Backend requests flow through routes, controllers, services and Prisma. The frontend
uses TanStack Query for server data and Zustand for client state. AI retrieval filters
records by access permissions before they enter model context. See the
[security implementation notes](docs/architecture/security.md).

The `main` branch is protected against force pushes and deletion, including for
administrators. Pull request conversations must be resolved before merging.
GitHub Actions runs the repository checks; Vercel and Render deploy updates from `main`.
