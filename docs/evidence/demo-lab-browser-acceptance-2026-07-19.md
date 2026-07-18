# Isolated Demo Lab browser acceptance

- Date: 2026-07-19
- Surface: `/demo`
- Acceptance viewport: 390 × 844, fresh headless Chrome profile, `zh-TW`

## Product boundary

The Demo Lab is an isolated submission surface for the compressed longitudinal
story. It does not call the OpenAI API, Cloud Tasks, Firestore, the protected
live routes, or Chloe's private phone session. Every simulated Agent trace is
explicitly `provider: mock` while still passing the same record, journey state,
Agent trace, memory, and event schemas used by the local product contracts.

The story is a thirty-day illustration-practice habit, not the one-night Build
Week sprint. It advances through Days 1, 2, 3, 4, 5, 8, 14, and 30 and shows:

- first check-in;
- one delay and then repeated delay;
- Commitment Recovery and a smaller action;
- tentative strategy memory;
- progress evidence and specific feedback;
- Progress Witness continuity;
- goal/method recalibration without discarding the North Star;
- a final resume point and safe four-Agent trace.

## Browser acceptance

- HTTP status: 200.
- Meaningful first-screen content: passed.
- Honest `no API` and `no private phone session` boundary: visible.
- One `Run full 30-day story` control: present and clickable.
- Day 30 reached after one click: passed.
- Journey displayed Recovery and Calibration events: passed.
- Developer displayed `mock:simulation-day-*` traces and the no-API label:
  passed.
- Framework error overlay: zero.
- Browser console errors: zero.
- The 390-pixel mobile long screenshot was visually inspected; the boundary,
  Day 30 status, Developer trace, acceptance list, and browser-only footer were
  readable.

## Verification

- Demo Lab focused tests: 2 passed.
- Full test files: 32 passed, 5 skipped.
- Full tests: 125 passed, 9 skipped.
- ESLint: passed.
- TypeScript: passed.
- Production build: passed; `/demo` generated as a static route.
- `git diff --check`: passed.
