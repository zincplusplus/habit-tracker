[![image](https://img.shields.io/github/release/zoreet/habit-tracker.svg)](https://github.com/zoreet/habit-tracker/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# Habit Tracker 21

Introducing "Habit Tracker 21," an innovative plugin designed specifically for Obsidian. Have you ever wanted to develop new habits but struggled to keep yourself accountable? This plugin is your perfect solution.

"Habit Tracker 21" is built on the principle that it takes 21 days to form a new habit. With this tool, tracking your habits becomes a seamless process. It allows you to monitor your progress, providing a clear visualization of your commitment and consistency. It's a great way to motivate yourself as you see the habits you're forming over time.

## How it works

1. Create a `Habits` folder for all your habits (you can also configure the folder)
2. Create empty files inside that folder for each habit you want to track
3. Enable the habit tracker UI by pasting the following code fence into your `.md` file:

````markdown
```habittracker

```
````

## Parameters

All parameters are optional.

They can be placed inside curly braces inside the habit tracker code fence like this:

````markdown
```habittracker
{
  "path": "CustomHabitsLocation/",
  "daysToShow": 7,
  "showEmptyHabits": false
}
```
````

- `path: string`
  - Path to where your habit files are (or where your habit file is) stored.
  - default: `'Habits/'`
- `lastDisplayedDate: string`
  - Last date that is displayed in the table.
  - default: `new Date()` (today)
- `daysToShow: number`
  - Number of dates to display in the chart.
  - default: `21`
- `dateToHighlight: string | undefined`
  - Date to highlight (e.g. the day of the current file)
  - default: `undefined`
- `showWeekdays: boolean`
  - Show weekday letters instead of date numbers
  - default: `false`
- `showNewHabitButton: string`
  - Show a button to add a new habit file
  - default: `true`
- `showEmptyHabits: string`
  - Show habits that are not checked in the
  - default: `true`

## Example

![Example](docs/assets/ui-demo.png)
