[![image](https://img.shields.io/github/release/zoreet/habit-tracker.svg)](https://github.com/zoreet/habit-tracker/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# Habit Tracker 21

Introducing "Habit Tracker 21," an innovative plugin designed specifically for Obsidian. Have you ever wanted to develop new habits but struggled to keep yourself accountable? This plugin is your perfect solution.

"Habit Tracker 21" is built on the principle that it takes 21 days to form a new habit. With this tool, tracking your habits becomes a seamless process. It allows you to monitor your progress, providing a clear visualization of your commitment and consistency. It's a great way to motivate yourself as you see the habits you're forming over time.

## How it works

1. Create a folder for all your habits, e.g. `Habits`
2. Create empty files inside that folder for each habit you want to track
3. Enable the habit tracker UI by pasting the following code in your `.md` file:

````markdown
```habittracker
{
	"path": "Habits/"
}
```
````

Make sure to specify the path you're using. You can point to one habit, or all habits that contain that path (including subfolders);

## Parameters

- path [mandatory]: a string containing a path to a folder or specific habit (aka .md file)
- lastDisplayedDate [optional]: the date that is displayed in the chart
  - format: `"YYYY-MM-DD"`
  - default to today
  - example settings
    `{
	"path": "Habits/",
	"lastDisplayedDate": "2023-12-27"
}`

## Example

![Example](docs/assets/ui-demo.png)
