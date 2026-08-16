# 🧪 Habit Tracker Test Dashboard

This vault tests all functionality of the Habit Tracker 21 plugin.

## 📋 Quick Tests

### Basic Functionality

```habittracker
{
  "path": "habits",
  "daysToShow": 21,
  "debug": true
}
```

### Single File Test

```habittracker
{
  "path": "single-habits/minimal-habit.md",
  "daysToShow": 14,
  "debug": true
}
```

### Custom Settings

```habittracker
{
  "path": "habits",
  "daysToShow": 7,
  "color": "#ff6b6b",
  "showStreaks": true,
  "matchLineLength": false,
  "debug": true
}
```

### Empty Folder Test

```habittracker
{
  "path": "empty-folder",
  "debug": true
}
```

### Invalid Path Test

```habittracker
{
  "path": "nonexistent-folder",
  "debug": true
}
```

## 🎯 Test Checklist

### Core Features

- [ ] Habits load and display correctly
- [ ] Clicking toggles habit state
- [ ] Changes save to files
- [ ] External changes update display
- [ ] Streaks calculate correctly
- [ ] Weekend highlighting works

### Settings

- [ ] Path setting works (file and folder)
- [ ] daysToShow affects display
- [ ] Color customization works
- [ ] Debug output appears in console
- [ ] matchLineLength affects width
- [ ] showStreaks toggles streak display

### Error Handling

- [ ] Invalid paths show clear errors
- [ ] Malformed JSON shows helpful messages
- [ ] Recovery works after fixing errors
- [ ] Empty folders handled gracefully

### Performance

- [ ] Large habit lists load quickly
- [ ] Long date ranges render smoothly
- [ ] No lag when toggling habits

## 🐛 Known Issues to Test

1. Date calculation edge cases
2. Timezone handling
3. Memory leak prevention
4. Theme compatibility
