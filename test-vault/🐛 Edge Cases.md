# 🐛 Edge Cases & Error Handling Tests

This page tests error conditions and edge cases to ensure robust behavior.

## Invalid JSON Tests

### Missing Comma

```habittracker
{
  "path": "test-vault/habits"
  "daysToShow": 21
}
```

### Trailing Comma

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
}
```

### Missing Quotes

```habittracker
{
  path: "habits",
  daysToShow: 21
}
```

### Invalid JSON Structure

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": "not-a-number",
  "debug": "not-a-boolean"
}
```

### Empty JSON

```habittracker
{}
```

### Completely Invalid

```habittracker
this is not json at all!
```

## Path Edge Cases

### Non-existent Path

```habittracker
{
  "path": "test-vault/folder-that-does-not-exist",
  "debug": true
}
```

### Empty String Path

```habittracker
{
  "path": "",
  "debug": true
}
```

### Special Characters in Path

```habittracker
{
  "path": "test-vault/habits/special-chars-habit-名前.md",
  "debug": true
}
```

### Path with Spaces

```habittracker
{
  "path": "test-vault/habits/Long Habit Name That Tests UI Wrapping.md",
  "debug": true
}
```

## Extreme Values

### Zero Days

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 0,
  "debug": true
}
```

### Negative Days

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": -5,
  "debug": true
}
```

### Huge Number of Days

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 999,
  "debug": true
}
```

### Very Old Date

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "lastDisplayedDate": "1900-01-01",
  "debug": true
}
```

### Invalid Date Format

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "lastDisplayedDate": "not-a-date",
  "debug": true
}
```

## File System Edge Cases

### Broken Habit Files

```habittracker
{
  "path": "test-vault/broken-habits",
  "debug": true
}
```

### Empty Folder

```habittracker
{
  "path": "test-vault/empty-folder",
  "debug": true
}
```

### Permission Issues (if applicable)

```habittracker
{
  "path": "test-vault//system/protected/folder",
  "debug": true
}
```

## Unicode & Encoding Tests

### Unicode Habit Names

```habittracker
{
  "path": "test-vault/single-habits/special-chars-habit-名前.md",
  "debug": true
}
```

### Emoji in Settings

```habittracker
{
  "path": "test-vault/habits",
  "color": "🔴",
  "debug": true
}
```

## Recovery Tests

These test the plugin's ability to recover from errors:

### Fix Path After Error

1. First, cause error with invalid path:

```habittracker
{
  "path": "test-vault/invalid-path",
  "debug": true
}
```

2. Then fix the path (edit the block above):

```habittracker
{
  "path": "test-vault/habits",
  "debug": true
}
```

### Fix JSON After Error

1. First, cause JSON error:

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21
  // missing comma above
}
```

2. Then fix the JSON syntax

## Performance Edge Cases

### Very Long Habit Names

```habittracker
{
  "path": "test-vault/habits/Long Habit Name That Tests UI Wrapping.md",
  "debug": true
}
```

### Many Small Date Ranges

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 1,
  "debug": true
}
```

## Expected Behaviors ✅

- [ ] Invalid JSON shows clear error messages
- [ ] Invalid paths show helpful guidance
- [ ] Extreme values are handled gracefully
- [ ] Unicode content displays correctly
- [ ] Plugin recovers after fixing errors
- [ ] No crashes or data corruption
- [ ] Memory usage stays reasonable
- [ ] Error messages are user-friendly

## Notes

Record any unexpected behaviors or bugs discovered during testing:

- [ ] Bug 1:
- [ ] Bug 2:
- [ ] Bug 3:
