# OperatorOS

OperatorOS is a control plane for an AI-run internet business.

This repo currently ships one proof business:
**OperatorOS Studio** — an AI-operated landing page studio that can intake a brief, generate a bounded quote, create a draft page, take checkout, track revisions, gate risky actions behind approvals, and replay what happened.

## Current live shape
- public landing page
- pricing and FAQ pages
- public brief form
- quote generation inside package policy
- normalized SQLite-backed project store
- capability-token project portals and preview URLs
- generated landing page previews
- public project portal for revisions and payment checkout
- sandbox checkout today, Stripe-ready checkout when `STRIPE_SECRET_KEY` is configured
- multi-user operator auth with roles (`owner`, `operator`, `reviewer`)
- owner dashboard for projects, approvals, and replay
- delivery approval gate for higher-risk projects
- HTTPS deployment on a live public domain

## Core ideas
- the AI is the operator
- humans set goals and guardrails
- risky actions are blocked or approval-gated
- important workflow actions are logged and replayable
- the first business proves the control-plane model

## Tech stack
- Next.js 15 app router
- TypeScript
- SQLite-backed persistence using Node's built-in `node:sqlite`
- signed HttpOnly cookie sessions for operator access
- nginx reverse proxy
- systemd service for persistence on the host
- Let's Encrypt TLS via certbot

## Project structure
- `app/` — Next.js routes and pages
- `src/lib/` — workflow logic, storage, auth, payments, draft generation, action ledger
- `src/policies/` — quote rules and risk evaluation
- `src/templates/landing-page/` — constrained page template used for draft generation
- `tests/` — focused workflow tests
- `deploy/` — systemd and nginx deployment templates

## Local development
```bash
npm install
cp .env.example .env.local
npm test
npm run build
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/owner/login`

## Data storage
By default the app stores state in:
- `data/operatoros.db`

Recommended production setting:
- `OPERATOROS_DATABASE_PATH=/var/lib/operatoros/operatoros-db.sqlite`

Legacy migration support:
- if `OPERATOROS_DATA_PATH` points to the old JSON snapshot and no sqlite DB exists yet,
  OperatorOS will import that snapshot into a sibling `.sqlite` file on first boot.

## Operator auth and roles
Set either:
- `OPERATOROS_USERS_JSON=[{"username":"operatoros","password":"...","role":"owner"}]`

Or use the legacy single-password fallback:
- `OWNER_PASSWORD=...`

Roles:
- `owner` — full control
- `operator` — project operations
- `reviewer` — approvals and replay

## Payments
- If `STRIPE_SECRET_KEY` is configured, checkout sessions are created against Stripe Checkout.
- If `STRIPE_WEBHOOK_SECRET` is also configured, Stripe checkout completion can be confirmed server-to-server via webhook.
- If `OPERATOROS_ALLOW_SANDBOX_PAYMENTS=1` is explicitly set, OperatorOS exposes the built-in sandbox checkout flow for demos/tests.
- Otherwise live checkout fails closed until a real payment provider is configured.

## Deployment
See:
- `DEPLOY_TODAY.md`
- `deploy/operatoros.service`
- `deploy/nginx-operatoros.conf`

## Important current limitations
- real checkout needs live Stripe credentials
- roles are environment-configured, not app-managed yet
- live domain is currently an sslip.io bootstrap domain rather than a branded domain

## Next high-value upgrades
1. switch from sslip.io bootstrap domain to a branded domain
2. configure live Stripe keys and webhook handling
3. add app-managed operator users and password rotation
4. expand normalized schema and analytics/reporting
