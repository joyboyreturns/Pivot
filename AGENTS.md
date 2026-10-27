# AGENTS.md

Instructions for any coding agent working in this repo.

## Authorship

All commits and PRs must appear as the repo owner only (`joyboyreturns`). Add no co-author trailers, session links, or "generated with" lines, and mention no tool or model names in code, docs, or commit messages. Use the repo-local git identity. See `CLAUDE.md`.

## What this project is

PIVOT is a SPECS Lens that shows whether a bulky object can get through a doorway and how to turn it. Read `docs/ARCHITECTURE.md` and `docs/PLAN.md` first.

## Hard rules

1. `src/planner` stays pure TypeScript: no Lens Studio or Node imports, so it runs in both.
2. Planning logic lives in `src/planner`, never in the Lens scripts; the Lens layer only displays a `Plan`.
3. Units are metres and degrees everywhere.
4. The planner is deterministic: same input, same plan.
5. No screen-style UI in the Lens: ghost objects, a bottleneck marker and a hand pinch only.
6. Never commit secrets or Lens Studio cache folders.

## Workflow

- `npm install`, `npm test`, `npm run typecheck` must pass before committing.
- Add a test with every planner change.
- Follow the step order in `docs/PLAN.md`; cut first: room scanning, object recognition, full six-axis planning.
- If a decision is the owner's (rules, scope cuts, submission), stop and ask.
