# Habit Tracker 21 [![GitHub release](https://img.shields.io/github/release/zincplusplus/habit-tracker.svg)](https://github.com/zincplusplus/habit-tracker/releases) [![Downloads](https://img.shields.io/github/downloads/zincplusplus/habit-tracker/total.svg)](https://github.com/zincplusplus/habit-tracker/releases) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://makeapullrequest.com)

A minimalist, elegant habit tracker for [Obsidian](https://obsidian.md) that helps you build lasting habits with clear progress visualization.

Transform your [Obsidian](https://obsidian.md) vault into a habit-building powerhouse. Track daily habits with an intuitive grid interface, customize your tracking experience, and watch your consistency streaks grow over time.

![Habit Tracker Demo](screenshots/ui-demo.png)

<a href="https://www.buymeacoffee.com/zincplusplus" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## ✨ Features

- **Minimalist Look** - Elegant, clean interface with nothing but essential functionality. Matches your theme effortlessly using Obsidian CSS variables
- **Maximum configurability** - You can tweak and customize pretty much every aspect of Habit Tracker 21 to make it just right for you
- **Easy to setup** - Matches your theme effortlessly using Obsidian CSS variables and includes sensible defaults for all tracker properties
- **Smart Folder Support** - Track individual files or entire habit folders
- **Debug Mode** - Comprehensive debugging gives you all the info you need to figure it out

## 🚀 Quick Start

1. Install the plugin from **[Obsidian's Community Plugins](obsidian://show-plugin?id=habit-tracker-21)**
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

## ⚙️ Configuration

### Global Settings

Access via **Settings > Community plugins > Habit Tracker** to set defaults for all trackers:

- **Default Path** - Choose from dropdown of vault folders
- **Days to Show** - Number input (default: 21)
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

## 🔧 All Settings

| Setting             | Type    | Default | Description                                                                      |
| ------------------- | ------- | ------- | -------------------------------------------------------------------------------- |
| `path`              | string  | "/"     | Path to habit folder or file. Defaults to root folder if left empty              |
| `daysToShow`        | number  | 21      | Number of days to display                                                        |
| `lastDisplayedDate` | string  | today   | Last date shown in grid (format: "YYYY-MM-DD"). If left empty, defaults to today |
| `debug`             | boolean | false   | Enable debug console output                                                      |
| `matchLineLength`   | boolean | false   | Match readable line width                                                        |

## 📖 Usage Examples

### Multiple Habits (Most popular)

Track all habits in a folder:

````markdown
```habittracker
{
  "path": "Habits"
}
```
````

### Single Habit

Track one specific habit file:

````markdown
```habittracker
{
  "path": "Habits/Exercise.md"
}
```
````

### Custom Time Range

Show last 30 days:

````markdown
```habittracker
{
  "path": "Habits",
  "daysToShow": 30
}
```
````

### View Past Date Range

Show habits ending on a specific date:

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

Enable detailed logging:

````markdown
```habittracker
{
  "path": "Habits",
  "debug": true
}
```
````

## 🆘 Troubleshooting

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

**Debug Output**
Enable debug mode to see detailed logging in the browser console (F12).

## 🛠️ Development

### Installation

```bash
git clone https://github.com/zincplusplus/habit-tracker
cd habit-tracker
npm install
npm run dev
```

### Contributing

PRs welcome! Please:

- Follow existing code style
- Update documentation

<a href="https://www.buymeacoffee.com/zincplusplus" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ for the Obsidian community**
