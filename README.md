# Habit Tracker 21
Introducing "Habit Tracker 21," an innovative plugin designed specifically for Obsidian. Have you ever wanted to develop new habits but struggled to keep yourself accountable? This plugin is your perfect solution.

"Habit Tracker 21" is built on the principle that it takes 21 days to form a new habit. With this tool, tracking your habits becomes a seamless process. It allows you to monitor your progress, providing a clear visualization of your commitment and consistency. It's a great way to motivate yourself as you see the habits you're forming over time.

## How it works
1. Create a folder for all your habits, e.g. `Habits`
2. Create empty files inside that folder for each habit you want to track
3. Enable the habit tracker UI. I like to past the following in by daily todo template

~~~markdown
```habittracker
{
	"path": "Habits/"
}
```
~~~

Make sure to specify the path you're using. You can point to one habit, or all habits that contain that path (including subfolders);

## Example
![Example](docs/assets/ui-demo.png)