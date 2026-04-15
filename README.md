# Interactive Habit Tracker [![Obsidian](https://img.shields.io/badge/Obsidian-6d28d9)](https://obsidian.md)

A minimalist, elegant habit tracker for [Obsidian](https://obsidian.md) that helps you build lasting habits with clear progress visualization.

Transform your [Obsidian](https://obsidian.md) vault into a habit-building powerhouse. Track daily habits with an intuitive grid interface, customize your tracking experience, and watch your consistency streaks grow over time.

> **Fork note:** This is a fork of [Habit Tracker 21](https://github.com/zincplusplus/habit-tracker) with additional features: custom habit order, numeric habits, and group filtering.

## Features

- **Minimalist Look** - Elegant, clean interface with nothing but essential functionality. Matches your theme effortlessly using Obsidian CSS variables
- **Maximum configurability** - You can tweak and customize pretty much every aspect of the tracker to make it just right for you
- **Easy to setup** - Matches your theme effortlessly using Obsidian CSS variables and includes sensible defaults for all tracker properties
- **Smart Folder Support** - Track individual files or entire habit folders
- **Flexible Streak Counting** - Optional gap tolerance (`maxGap`) keeps streaks intact across short breaks while counting only days you actually completed
- **Daily Note Integration** - Click any date in the header to jump straight to your daily note for that day
- **Custom Habit Order** - Set a custom display order for habits with a single frontmatter field
- **Numeric Habits** - Track quantities (reps, minutes, glasses of water) instead of binary ticks
- **Group Filtering** - Organise habits into groups and show only relevant ones per tracker
- **Debug Mode** - Comprehensive debugging gives you all the info you need to figure it out

## Quick Start

1. Install the plugin (plugin id: `interactive-habit-tracker`)
2. **Create your habits folder** (e.g., `Habits/`)
3. **Add habit files** like `Exercise.md`, `Reading.md` for each habit you want to track
4. **Insert tracker** in your Daily notes template, or any other file:

````markdown
```habittracker
{
  "path": "Habits"
}
```
````

That's it! Click the grid to log your daily habits.

## Customization

### Custom Habit Titles

By default, habit titles use the filename (e.g., `Exercise.md` → "Exercise"). Customize titles by adding frontmatter to your habit files:

```markdown
---
title: "Morning Workout 💪"
entries: []
---
```

### Custom Habit Colors

Personalize individual habits with custom colors:

```markdown
---
title: "Morning Workout 💪"
color: "#4CAF50"
entries: []
---
```

Examples:
- `color: "#FF5722"` (hex colors)
- `color: "rgb(76, 175, 80)"` (RGB values)
- `color: "green"` (CSS color names)

Invalid colors are ignored and the default theme color is used.

### Custom Habit Order

Control the display order of habits within a folder using the `order` frontmatter field. Habits sort ascending by order value; habits without an `order` field fall to the end (alphabetical as tiebreaker):

```markdown
---
title: "Morning Workout 💪"
order: 1
entries: []
---
```

```markdown
---
title: "Evening Read"
order: 2
entries: []
---
```

Habits with no `order` set will always appear after all ordered habits.

### Numeric Habits

Instead of a binary tick, numeric habits let you record a quantity (reps, minutes, pages, glasses of water). Set a `range` in frontmatter; clicking a cell opens a number input:

```markdown
---
title: "Push-ups"
range: [1, 100]
streak_threshold: 20
entries: []
---
```

- **`range: [min, max]`** — activates numeric mode; the habit title displays as "Push-ups (1–100)"
- **`streak_threshold`** *(optional)* — minimum value that counts toward a streak (defaults to `range[0]`)
- Values below `streak_threshold` are recorded but shown without a streak highlight
- The recorded value is displayed inside each cell

Entries are stored as `{date, value}` objects and managed automatically when you interact with the grid.

### Group Filtering

Assign habits to one or more groups via frontmatter, then filter by group in your tracker codeblock.

**Habit frontmatter:**

```markdown
---
title: "Morning Run"
group: morning
entries: []
---
```

```markdown
---
title: "Vitamins"
group: [morning, health]
entries: []
---
```

**Tracker codeblock — show only a group:**

````markdown
```habittracker
{
  "path": "Habits",
  "group": "morning"
}
```
````

**Show habits in any of several groups:**

````markdown
```habittracker
{
  "path": "Habits",
  "group": ["morning", "health"]
}
```
````

**Exclude a group:**

````markdown
```habittracker
{
  "path": "Habits",
  "excludeGroup": "archived"
}
```
````

**Combine `group` and `excludeGroup`:**

````markdown
```habittracker
{
  "path": "Habits",
  "group": "health",
  "excludeGroup": "archived"
}
```
````

### Streak Gap Tolerance

By default, a single missed day breaks a streak. Use `maxGap` to keep a streak visually intact across short gaps:

```markdown
---
title: "Morning Workout 💪"
maxGap: 1
entries: []
---
```

- The streak bar renders continuously across gap days (shown at reduced opacity)
- The streak **count** reflects only actual ticked days — gap days are not counted
- `maxGap: 1` allows 1 missed day, `maxGap: 2` allows 2, and so on

**Examples by habit frequency:**

| Habit | Frequency | `maxGap` | Why |
| ----- | --------- | -------- | --- |
| Workout | 3× per week | `3` | Allows up to 3 rest days between sessions |
| Call a friend | Weekly | `6` | One call per week, any day |
| Car service | Monthly | `30` | Up to 30 days between occurrences |

## Configuration

### Global Settings

Access via **Settings > Community plugins > Interactive Habit Tracker** to set defaults for all trackers:

- **Default Path** - Choose from dropdown of vault folders
- **Days to Show** - Number input (default: 21)
- **Show Streaks** - Toggle streak indicators and counts on/off (default: on)
- **Open daily note on date click** - Click a date in the header row to open the corresponding daily note (default: on)
- **Debug Mode** - Toggle debug output on/off
- **Match Line Length** - Fit tracker to readable line width

### Per-Tracker Settings

Override global settings in individual code blocks:

````markdown
```habittracker
{
  "path": "Habits",
  "daysToShow": 30,
  "lastDisplayedDate": "2024-01-15",
  "debug": true,
  "matchLineLength": false
}
```
````

## All Settings

### Per-Tracker Settings (code block)

| Setting             | Type              | Default | Description                                                                      |
| ------------------- | ----------------- | ------- | -------------------------------------------------------------------------------- |
| `path`              | string            | "/"     | Path to habit folder or file                                                     |
| `firstDisplayedDate`| string            | auto    | First date shown in grid (format: "YYYY-MM-DD")                                  |
| `lastDisplayedDate` | string            | today   | Last date shown in grid (format: "YYYY-MM-DD")                                   |
| `daysToShow`        | number            | 21      | Number of days to display                                                        |
| `color`             | string            | ""      | Custom color for this tracker (hex, RGB, or CSS color name)                      |
| `showStreaks`        | boolean           | true    | Display streak indicators and counts                                             |
| `debug`             | boolean           | false   | Enable debug console output                                                      |
| `matchLineLength`   | boolean           | false   | Match readable line width                                                        |
| `group`             | string \| array   | —       | Show only habits belonging to this group (or any group in array)                 |
| `excludeGroup`      | string \| array   | —       | Hide habits belonging to this group (can be combined with `group`)               |

### Per-Habit Settings (frontmatter)

| Setting            | Type            | Default        | Description                                                                                  |
| ------------------ | --------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `title`            | string          | ""             | Custom display name. Falls back to filename if not set                                       |
| `color`            | string          | ""             | Custom color for this habit (hex, RGB, or CSS color name)                                    |
| `order`            | number          | —              | Display order (ascending). Habits without `order` appear last, sorted alphabetically         |
| `maxGap`           | number          | 0              | Allow up to N consecutive missed days within a streak                                        |
| `group`            | string \| array | —              | Group(s) this habit belongs to                                                               |
| `range`            | [number, number]| —              | Activates numeric mode. Sets `[min, max]` for the input                                      |
| `streak_threshold` | number          | `range[0]`     | Minimum value that counts toward a streak (numeric habits only)                              |
| `entries`          | array           | []             | Completed dates (binary) or `{date, value}` objects (numeric). Managed automatically        |

## Usage Examples

### Multiple Habits (Most popular)

````markdown
```habittracker
{
  "path": "Habits"
}
```
````

### Single Habit

````markdown
```habittracker
{
  "path": "Habits/Exercise.md"
}
```
````

### Custom Time Range

````markdown
```habittracker
{
  "path": "Habits",
  "daysToShow": 30
}
```
````

### Morning Routine Tracker

Show only habits tagged `morning`:

````markdown
```habittracker
{
  "path": "Habits",
  "group": "morning"
}
```
````

### Numeric Habit — Push-ups

```markdown
---
title: "Push-ups"
range: [1, 100]
streak_threshold: 20
entries: []
---
```

### Ordered Habits

```markdown
---
title: "Wake up early"
order: 1
entries: []
---
```

```markdown
---
title: "Exercise"
order: 2
entries: []
---
```

### View Past Date Range

````markdown
```habittracker
{
  "path": "Habits",
  "lastDisplayedDate": "2024-01-15",
  "daysToShow": 30
}
```
````

### Debug Mode

````markdown
```habittracker
{
  "path": "Habits",
  "debug": true
}
```
````

## Troubleshooting

### Common Issues

**"Path is required" error**
- Set a default path in plugin settings, or specify `"path"` in your tracker

**Tracker shows "No habits found"**
- Check the path exists in your vault
- Ensure folder contains `.md` files (subfolders are ignored)

**Settings not updating**
- Trackers auto-refresh when global settings change
- For JSON errors, check syntax (commas, quotes, braces)
- If issues persist, try force reload (Ctrl+R) or restart Obsidian

**Clicking a date does nothing**
- Ensure **Open daily note on date click** is enabled in plugin settings
- Ensure either the **Daily Notes** core plugin or the **Periodic Notes** community plugin is enabled

**Debug Output**
Enable debug mode to see detailed logging in the browser console (F12).

## Development

### Installation

```bash
git clone https://github.com/koray-eren/interactive-habit-tracker
cd interactive-habit-tracker
npm install
npm run dev
```

### Tests

```bash
npm test          # run once
npm run test:watch # watch mode
```

### Contributing

PRs welcome! Please:

- Follow existing code style
- Update documentation

<a href="https://buymeacoffee.com/koray.e" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ for the Obsidian community**
