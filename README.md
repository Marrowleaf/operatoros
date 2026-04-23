# OperatorOS

OperatorOS is a control plane for an AI-run internet business.

This repo currently ships one proof business:
**OperatorOS Studio** — an AI-operated landing page studio that can intake a brief, generate a bounded quote, create a draft page, track revisions, gate risky actions behind approvals, and replay what happened.

## Current live shape
- public landing page
- pricing and FAQ pages
- public brief form
- quote generation inside package policy
- persistent file-backed project store
- capability-token project portals and preview URLs
- generated landing page previews
- public project portal for revisions and payment instructions
- owner dashboard for projects, approvals, and replay
- delivery approval gate for higher-risk projects
- nginx + systemd deployment on a single server

## Core ideas
- the AI is the operator
- humans set goals and guardrails
- risky actions are blocked or approval-gated
- important workflow actions are logged and replayable
- the first business proves the control-plane model

## Tech stack
- Next.js 15 app router
- TypeScript
- local JSON-backed persistence for the current MVP
- nginx reverse proxy
- systemd service for persistence on the host

## Project structure
- `app/` — Next.js routes and pages
- `src/lib/` — workflow logic, storage, draft generation, action ledger
- `src/policies/` — quote rules and risk evaluation
- `src/templates/landing-page/` — constrained page template used for draft generation
- `tests/` — focused workflow tests
- `deploy/` — systemd and nginx deployment templates

## Local development
```bash
npm install
npm test
npm run build
npm run dev
```

Open:
- `http://localhost:3000`

## Data storage
By default the app stores state in:
- `data/operatoros-db.json`

For server deployment you should set:
- `OPERATOROS_DATA_PATH=/var/lib/operatoros/operatoros-db.json`

This keeps live data outside the git working tree.

## Owner routes
These routes are intended for the operator/owner side:
- `/projects`
- `/projects/[id]`
- `/approvals`
- `/runs/[id]`

In the current deployment they are protected at the nginx layer.

## Deployment
See:
- `DEPLOY_TODAY.md`
- `deploy/operatoros.service`
- `deploy/nginx-operatoros.conf`

## Important current limitations
- payment is still a manual confirmation flow
- storage is file-backed, not yet SQLite/Postgres
- owner auth is currently proxy-level basic auth
- raw-IP HTTP deployment is live; proper domain + HTTPS is still a next step

## Next high-value upgrades
1. move persistence to SQLite/Postgres
2. add app-native owner auth
3. wire real checkout
4. add domain + HTTPS
5. add notifications/email events
