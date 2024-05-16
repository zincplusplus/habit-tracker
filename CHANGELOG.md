# Changelog

## 2.0.0

chore: UI was rewritten as a Svelte component
feat: show current day as green and add the option to mark an additional day (e.g. the current journal files day)
feat: add button that allows to add a new habit file
feat: check for habit updates every 5 seconds (great for obsidian sync)
feat: add option to hide habits that do not have activity in shown time frame

## 1.4.0

feat: track how many times the plugin is loaded at every version; it's important to see that people actually stick with using it, and that they adopt new versions, so I can decide how much time to invest in this project. I'm using bit.ly for this and all I care about is page views

## 1.3.0

feat: Streaks - track and display the number of consecutive days a habit has been completed

## 1.2.1

fix: daysToShow is converted to a number if the user passes it as a string

## 1.2.0

feat: the new `daysToShow` parameter allows users to display as many dates as they want
feat: Refresh default settings on each instantiation of the plugin to ensure `lastDisplayedDate` is updated to current time (
#19)
fix: habit names will take exactly as much space as they need

## 1.1.5

fix: user's timezone is considered when creating date ids for ticks

## 1.1.4

fix: create date with user's timezone

## 1.1.3

feat: highlight weekend dates
fix: no hover for header

## 1.1.2 - not working

fix: create date with user's timezone

## 1.1.1

fix: allow path to start with number
fix: allow filename to contain `,` or `&`
fix: make habit title an anchor

## 1.1.0

- feat: Implement navigation to document on habit name click
- feat: Allow user to specify last displayed date with the new `lastDisplayedDate` setting, defaults to today

## 1.0.3

- fix: show that a streak stars even before the displayed dates

## 1.0.2

- fix: make it work in reading mode

## 1.0.1

- fix: empty habit files are now working

## 1.0.0

- Hello world

---

Generated with git log --oneline --decorate
