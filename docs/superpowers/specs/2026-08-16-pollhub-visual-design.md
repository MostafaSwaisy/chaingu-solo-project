# PollHub — Visual Design Plan

Date: 2026-08-16
Scope: visual/interaction design for the existing PollHub MVP (Login,
Register, Poll List, Create Poll, Poll Detail) — no new backend behavior.
Builds on `docs/superpowers/specs/2026-08-16-pollhub-design.md`.

## The brief, pinned down

- **Subject**: a small group votes on something and watches the count
  build in real time. The emotional core isn't "submit a form" — it's the
  moment a tally ticks up and a winner starts to pull ahead.
- **Audience**: friends/small teams deciding something together (what to
  build next, where to eat) — informal, quick, low-stakes.
- **The page's one job**: make casting and watching a vote feel like
  watching a live tally, not filling out a survey.

## Design plan (first pass)

**Color** — a chalkboard-and-chalk palette, not a UI palette:

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1B2B27` | Page background — deep chalkboard green-black |
| `--ink-soft` | `#22362F` | Card/panel surfaces, one step up from the board |
| `--chalk` | `#F4F1E6` | Primary text, chalk-white |
| `--chalk-dim` | `#9FB0A7` | Secondary text, muted sage |
| `--marigold` | `#E8A33D` | Leading option, primary actions, focus accent |
| `--ember` | `#E2603A` | Errors, "you voted here" marker |

**Type** — three roles, none of them a default pairing:

- **Display — Fraunces** (variable serif, high optical-size personality).
  Used only for poll questions and page H1s, set large. This is the one
  place the design gets to feel handwritten/warm.
- **Body — IBM Plex Sans**. Everything else: labels, nav, buttons, body
  copy. Clean and quiet so it doesn't compete with Fraunces.
- **Utility — IBM Plex Mono, `font-variant-numeric: tabular-nums`**. Used
  *exclusively* for numbers: vote counts, percentages, timestamps. This is
  what gives results the feel of a digital tally counter next to the
  handwritten question above it.

**Layout concept** (ASCII wireframes):

Poll List — "the board": a stack of cards, each with a big mono vote
count top-right like a scoreboard, no result reveal (just a quiet hint
bar) so opening a poll still feels like an event:

```
┌─────────────────────────────────────────┐
│ Best color?                        0042 │  <- Fraunces q / mono count
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- quiet muted hint bar
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Pizza topping?                     0008 │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────┘
```

Poll Detail — "the live tally": the question as a large Fraunces
headline; each option a full-width row. Before voting, plain selectable
rows with a chalk outline. After voting, each row's fill bar animates in
(marigold for the leading option, chalk-dim for the rest), with a tally
mark cluster + percentage in mono type at the row's end:

```
Best color?

  ○ Red                                    #||||  75%
  ○ Blue                                   #|      25%
```

(`#||||` above stands in for the tally-mark glyph — see Signature.)

Create Poll — "write the ballot": the question input and each option
input sit on a hand-drawn baseline rule rather than a boxed field; "Add
option" reads as a chalk `+` stub, not a button.

Login/Register are deliberately quiet: a centered single card, same
chalkboard texture, no Fraunces hero moment — this isn't the page the
design should be remembered by.

**Signature** — the tally mark. Vote counts render as grouped hand-drawn
tally strokes (four verticals + a diagonal slash per group of five, then
a remainder), not just a number. On Poll Detail, when a vote is cast, the
new stroke draws itself in (`stroke-dasharray` animation, skipped under
`prefers-reduced-motion`). This is a real vote-counting artifact — not a
UI decoration — and it's the one thing this page should be recognizable
by.

## Self-critique against the generic defaults

Checked against the three current AI-design clusters:

- **Not** cream-background/serif/terracotta — our background is a dark
  chalkboard green, not cream, and the serif (Fraunces) is used narrowly
  for questions only, not the whole page.
- **Not** near-black/single-neon-accent — `--ink` is a warm green-black
  with visible hue, not neutral black, and it pairs with a matte marigold
  rather than an acid/neon accent.
- **Not** broadsheet/hairline-rules/dense columns — layout is airy,
  card-based, generously spaced; no multi-column newspaper density.

Where I caught myself defaulting: my first instinct for "structure"
was numbered option markers (01 / 02 / 03) on Create Poll. Poll options
aren't a sequence — order doesn't carry meaning — so per the brief's own
guidance against decorative numbering, I dropped it. Options are
distinguished by their chalk baseline rule and remove control only.

## Per-page spec

### Shell / navigation
- Slim top bar, fixed, `--ink` background, `--chalk` text, bottom
  hairline in `--ink-soft`.
- Subtle chalkboard grain: a low-opacity (≤4%) SVG noise texture as a
  `background-image` on `body`, applied once globally — not per
  component.
- Nav links get `hover:` and `focus-visible:` states in `--marigold`
  (2px offset ring), never `outline: none` without that replacement.

### Poll List (`PollList.jsx`)
- Cards are `<Link>`-wrapped (not `onClick` + `navigate`, so Cmd/Ctrl/
  middle-click work per guidelines).
- Vote-count tally renders via the new `TallyCount` component.
- Empty state (no polls yet): a single centered line in the app's voice
  — "No polls yet. Start one." — with the same Create Poll entry point,
  not a broken empty list.
- Loading state text ends in an ellipsis: "Loading polls…".
- Long questions truncate with `line-clamp-2`, never overflow the card.

### Poll Detail (`PollDetail.jsx`)
- Vote rows are real `<label>`/`<input type="radio">` pairs (already
  true in the MVP) — label and control share one hit target, meeting the
  44px minimum touch target via row padding.
- Result bars animate `transform: scaleX()` (compositor-friendly, not
  `width`), respect `prefers-reduced-motion` by snapping to final state
  instead of animating.
- Vote count updates are wrapped in `aria-live="polite"` so a screen
  reader announces the new tally without needing to re-focus.
- "You voted here" marker is an `--ember` dot with a visually-hidden
  "(your vote)" label — never color alone as the only signal.
- Vote failure shows an inline message with a next step, in the
  interface's voice: "Vote didn't go through. Try again." — not a raw
  error string leaking to the UI.

### Create Poll (`CreatePoll.jsx`)
- Each input keeps a real `<label>` (already true); add
  `autocomplete="off"` on option fields (not personal data,
  password-manager shouldn't offer to fill them).
- "Add option" and "Remove" are real `<button type="button">`s with
  `hover:`/`focus-visible:` states.
- Submit button label stays task-specific: "Create poll", never generic
  "Submit" or "Continue" (already true — keep it).
- Client-side option count (2–6) is enforced in the UI *and* still
  validated server-side (defense stays server-authoritative, UI just
  hides the impossible states).

### Login / Register
- Inputs get correct `type`/`autocomplete`: `username` field uses
  `autocomplete="username"`, password fields
  `autocomplete="current-password"` / `"new-password"`, email
  `type="email" autocomplete="email"`.
- Errors render inline near the field/form (already true via `role="alert"`)
  and move focus to the first invalid field on submit failure.
- Submit buttons stay enabled until the request starts, then show a
  "Logging in…" / "Creating account…" label instead of disabling
  silently with no feedback.

## New shared pieces (SRP)

- `client/src/styles/tokens.css` — the color/type custom properties
  above. One file, one responsibility: nothing else defines a color or
  font outside it.
- `client/src/components/TallyCount.jsx` — renders a number as grouped
  tally-mark SVG strokes + the mono numeral. Pure presentational
  component; takes `count: number` and nothing else.
- `client/src/utils/groupIntoFives.js` — pure function, `count => { fullGroups, remainder }`,
  the logic `TallyCount` renders from. This is genuine logic (not
  markup), so it gets a unit test the same way `calculateResults` did.
- `client/src/hooks/usePrefersReducedMotion.js` — tiny hook wrapping the
  `prefers-reduced-motion` media query, used by `TallyCount` and the
  Poll Detail result-bar animation so both respect it from one source of
  truth.

No CSS framework is being introduced. Plain CSS with the token file above
is sufficient at this scope (YAGNI) and keeps the dependency surface
unchanged from the current MVP.

## Testing plan (per `Claude.md`: TDD, one behavior per test)

- `groupIntoFives.test.js`: 0 votes → `{ fullGroups: 0, remainder: 0 }`;
  4 votes → `{ fullGroups: 0, remainder: 4 }`; 5 votes → `{ fullGroups: 1,
  remainder: 0 }`; 12 votes → `{ fullGroups: 2, remainder: 2 }`.
- `TallyCount.test.jsx`: renders the correct number of stroke groups for
  a given count; renders the plain numeral without animation classes when
  `usePrefersReducedMotion` reports `true`.
- `usePrefersReducedMotion.test.js`: returns `true`/`false` based on a
  mocked `matchMedia` result.
- Existing `PollDetail.test.jsx` gains one case: the "you voted" marker
  renders an accessible "(your vote)" label, not color alone.
- No new tests needed for pure CSS/token changes — they carry no logic.

## Non-goals

- No dark/light theme toggle — the chalkboard look *is* the theme,
  deliberately, not a dark-mode variant of a light design.
- No animation library dependency — CSS transitions/`stroke-dasharray`
  cover everything specified here.
- No redesign of the API or data model — this is presentation-layer only.

## Spec self-review

- **Placeholders**: none — every token, component, and test case above
  has concrete values.
- **Consistency**: color/type tokens are referenced identically across
  every per-page section; no page contradicts the palette or introduces
  an untokenized color.
- **Scope**: presentation-layer only, single cohesive visual system
  across 5 existing pages — doesn't need further decomposition.
- **Ambiguity**: "chalkboard" is given concrete hex values and font
  names above, not left as a mood word.

## Next step

This is a design spec, not a task breakdown. Once approved, the next
step is a `superpowers:writing-plans` implementation plan — bite-sized,
test-first tasks (tokens file → `groupIntoFives` → `TallyCount` →
`usePrefersReducedMotion` → per-page styling), same TDD discipline as
the original PollHub build.
