# PIVOT

> Before you lift it, know if it fits.

PIVOT is an AR path planner for SPECS. Give it an object's dimensions and it shows, in the room, a short sequence of ghost poses (tilt, rotate, slide) that get it through a tight doorway, with the tightest step marked. Most AR furniture apps only answer "does it fit in this spot?"; PIVOT answers "can it get there?".

Built for the Learn AR with SPECS challenge.

## Status

Foundation only: the planner core (oriented box vs doorway, pose search) with tests, plus architecture and plan. The Lens Studio project comes next. See [`docs/PLAN.md`](docs/PLAN.md).

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Step-by-step plan](docs/PLAN.md)

## Develop

```
npm install
npm test
npm run typecheck
```

## License

MIT
