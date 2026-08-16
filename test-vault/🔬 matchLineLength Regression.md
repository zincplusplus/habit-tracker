# 🔬 matchLineLength Regression Test

This page isolates the width behavior controlled by `matchLineLength`.

**What to compare:** check this page on `master`, on the `fix/adaptive-width-solution` PR, and on the fixed branch.

- **matchLineLength ON** → tracker should grow to fill the readable line width (capped there). PR #91 improves this case.
- **matchLineLength OFF** → tracker should be **compact / content-sized** (only as wide as the name column + date cells). On master this is `fit-content`. PR #91 regresses this: it stretches full-bleed and the name column balloons to absorb the slack.

> Toggle Obsidian's **Settings → Editor → Readable line length** on and off while viewing — the `is-readable-line-width` class only applies when it's on, and the line-width cap depends on it.

---

## 1. OFF + few columns (regression most visible here)

With only 7 days and `matchLineLength: false`, the widget should hug its content. If it spans the full note width with a huge empty name column, that's the regression.

```habittracker
{
  "path": "habits",
  "daysToShow": 7,
  "matchLineLength": false,
  "debug": true
}
```

## 2. ON + few columns (should fill to readable line width)

```habittracker
{
  "path": "habits",
  "daysToShow": 7,
  "matchLineLength": true,
  "debug": true
}
```

## 3. OFF + many columns

More cells means the content is naturally wider — the OFF case should still be content-sized, just larger. Watch the name column: it should stay snug, not stretch.

```habittracker
{
  "path": "habits",
  "daysToShow": 60,
  "matchLineLength": false,
  "debug": true
}
```

## 4. ON + many columns (overflow / horizontal scroll)

When content exceeds the line width, this should cap at the readable line width and scroll horizontally inside the container — not overflow the page.

```habittracker
{
  "path": "habits",
  "daysToShow": 60,
  "matchLineLength": true,
  "debug": true
}
```

## 5. OFF + single habit

A single short habit name with `matchLineLength: false` is the clearest case: the widget should be tiny. Any full-width stretch here is the bug.

```habittracker
{
  "path": "single-habits/minimal-habit.md",
  "daysToShow": 7,
  "matchLineLength": false,
  "debug": true
}
```

---

## ✅ Pass criteria

- [ ] **OFF cases (1, 3, 5)** render compact — width hugs content, name column does not balloon.
- [ ] **ON cases (2, 4)** fill up to the readable line width and cap there.
- [ ] Case 4 scrolls horizontally inside the container instead of overflowing the note.
- [ ] No `-2px` border misalignment on the right edge in any case.
- [ ] Name column never collapses below a readable minimum (`min-width: 40px`).
