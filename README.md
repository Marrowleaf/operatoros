# OperatorOS

OperatorOS is a control plane for an AI-run internet business.

This repo currently ships one proof business:
**OperatorOS Studio** — an AI-operated landing page studio that can intake a brief, generate a bounded quote, create a draft page, track revisions, gate risky actions behind approvals, and replay what happened.

## Current live shape
- public landing page
- pricing and FAQ pages
- public brief form
- quote generation inside package policy
- SQLite-backed project store
- capability-token project portals and preview URLs
- generated landing page previews
- public project portal for revisions and payment instructions
- owner dashboard for projects, approvals, and replay
- delivery approval gate for higher-risk projects
- app-native owner login session
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
- SQLite-backed persistence using Node's built-in `node:sqlite`
- signed HttpOnly cookie sessions for owner access
- nginx reverse proxy
- systemd service for persistence on the host

## Project structure
- `app/` — Next.js routes and pages
- `src/lib/` — workflow logic, storage, auth, draft generation, action ledger
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

## Owner access
These routes are intended for the operator/owner side:
- `/owner/login`
- `/projects`
- `/projects/[id]`
- `/approvals`
- `/runs/[id]`

Set:
- `OWNER_PASSWORD=...`

Owner APIs accept either:
- a valid signed owner session cookie, or
- the existing trusted reverse-proxy owner header for defense-in-depth compatibility

## Deployment
See:
- `DEPLOY_TODAY.md`
- `deploy/operatoros.service`
- `deploy/nginx-operatoros.conf`

## Important current limitations
- payment is still a manual confirmation flow
- owner auth is single-password auth, not multi-user RBAC
- raw-IP HTTP deployment is live; proper domain + HTTPS is still a next step

## Next high-value upgrades
1. add HTTPS and a real domain
2. wire real checkout
3. upgrade owner auth to multi-user / roles
4. add notifications/email events
5. normalize the SQLite schema beyond the current app-state snapshot
