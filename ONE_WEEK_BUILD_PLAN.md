# OperatorOS — One-Week Build Plan

## Goal
Ship a working v0 that lets an AI run a **real landing page studio** with guardrails:
- capture a real lead
- create a project
- generate a quote inside policy
- take payment intent
- generate a landing page draft
- log every action
- allow owner approval / pause

## Rule for week 1
Do **not** build the full platform.
Build the smallest system that proves:
> an AI can run a real internet service workflow while OperatorOS keeps it bounded.

---

## Day 1 — Core repo + data model
### Deliverables
- Next.js app boots
- Postgres + Prisma wired
- core schema exists
- seeded demo policy + packages

### Build
- init Next.js + TypeScript + Prisma
- create tables:
  - customers
  - leads
  - projects
  - actions
  - approvals
  - incidents
  - policies
- seed pricing bands and action limits

### Done means
- app runs locally
- database migrates
- seed command creates default policy

---

## Day 2 — Lead intake + quoting
### Deliverables
- public brief form
- lead creates project
- quote generator returns allowed package/price

### Build
- `/brief` page
- API route for lead submission
- quote engine with hard package rules
- simple owner dashboard list of leads/projects

### Constraints
- no custom freeform pricing
- if request exceeds scope, return escalation state

### Done means
- submit a real brief
- project is created
- quote is generated and visible

---

## Day 3 — Action ledger + operator runtime stub
### Deliverables
- append-only action log
- operator run model
- replayable event timeline

### Build
- `recordAction()` helper
- action types:
  - lead_received
  - quote_generated
  - approval_requested
  - page_generated
  - preview_deployed
  - customer_message_sent
- run/project timeline UI

### Done means
- every meaningful action appears in timeline with input/output JSON

---

## Day 4 — Page generation pipeline
### Deliverables
- template-based landing page generation
- project brief converted into page config
- preview HTML generated

### Build
- one polished landing page template
- AI prompt -> structured page config JSON
- render JSON into HTML/React preview
- save artifacts per project

### Constraints
- no arbitrary code generation
- template/components only

### Done means
- brief produces a real preview page

---

## Day 5 — Approval system + kill switch
### Deliverables
- owner can approve/reject blocked actions
- owner can pause operator
- incidents can auto-pause the run

### Build
- approval queue page
- action policy checks
- incident triggers:
  - quote outside range
  - repeated failures
  - hallucinated payment/delivery claim marker
- pause/resume toggle

### Done means
- risky action gets blocked
- owner can intervene cleanly

---

## Day 6 — Payments + revision loop
### Deliverables
- payment link generation
- revision request flow
- AI updates draft after revision

### Build
- Stripe test payment link route
- customer revision form/message thread
- project memory storing accepted/rejected changes
- regenerate preview after revision

### Constraints
- payment links only for approved quote amount
- refund flow can be stubbed as approval-required

### Done means
- accepted quote -> payment link -> revised preview flow works

---

## Day 7 — Launchable polish
### Deliverables
- landing page copy live
- pricing page live
- owner dashboard usable
- end-to-end demo script complete

### Build
- polish homepage
- add transparency copy
- test happy-path flow end-to-end
- create demo seed project
- deploy MVP

### Done means
A stranger could:
1. submit a brief
2. receive a quote
3. pay
4. get a generated landing page draft
5. request revision
6. receive updated version

---

## Week 1 non-goals
Do **not** build these yet:
- multi-business support
- email inbox sync
- full autonomous outbound
- freelancer hiring
- production-grade analytics
- full billing engine
- multi-agent architecture
- social autoposting

---

## Exact MVP stack
- **Frontend:** Next.js App Router + TypeScript + Tailwind
- **DB:** Postgres + Prisma
- **Auth:** simple owner-only auth or password gate for v0
- **AI:** provider-agnostic wrapper
- **Payments:** Stripe test mode
- **Deploy previews:** Vercel preview or local generated static artifacts
- **Queue:** simple server actions / cron / lightweight job runner for v0

---

## Highest-risk assumptions to validate immediately
1. AI can generate a good enough landing page from a short brief
2. customers will tolerate AI-operated service if results are good
3. template-constrained generation is enough for first paid jobs
4. action ledger + approvals are sufficient guardrails for week 1

---

## Success metric for the week
By end of week 1, you should have:
- one deployed MVP
- one demo customer flow working end-to-end
- one replayable operator timeline
- one approval/kill-switch flow working

If that works, **then** expand into email, better memory, and more autonomous execution.