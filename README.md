# OperatorOS

OperatorOS is the control plane for an AI-run internet business.

This repo starts with one proof business:
**OperatorOS Studio** — an AI-operated landing page studio.

## v0 goals
- capture leads
- generate bounded quotes
- record every action in an audit ledger
- create projects
- generate landing page drafts from a brief
- queue risky actions for approval
- let the owner pause/resume the operator

## Core ideas
- the AI is the operator
- humans set goals and guardrails
- risky actions are blocked or approval-gated
- every important action is logged and replayable

## Initial structure
- `app/` Next.js routes and pages
- `src/lib/` core business logic
- `src/policies/` hard constraints and policy evaluation
- `src/templates/landing-page/` constrained page generation templates
- `prisma/` schema and seed data
- `tests/` placeholders for the TDD cycle

## Next steps
1. install dependencies
2. create `.env` with `DATABASE_URL`
3. run `pnpm db:push`
4. run `pnpm db:seed`
5. start implementing the one-week build plan
