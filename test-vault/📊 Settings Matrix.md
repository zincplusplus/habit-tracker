# 📊 Settings Matrix Test

This page tests all combinations of settings to ensure they work correctly.

## Boolean Combinations (8 total)

### All True

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "debug": true,
  "showStreaks": true,
  "matchLineLength": true
}
```

### All False

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "debug": false,
  "showStreaks": false,
  "matchLineLength": false
}
```

### Debug Only

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "debug": true,
  "showStreaks": false,
  "matchLineLength": false
}
```

### Streaks Only

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "debug": false,
  "showStreaks": true,
  "matchLineLength": false
}
```

### Match Line Length Only

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "debug": false,
  "showStreaks": false,
  "matchLineLength": true
}
```

## Days to Show Variations

### Minimal (1 day)

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 1,
  "debug": true
}
```

### Week View (7 days)

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 7,
  "debug": true
}
```

### Default (21 days)

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "debug": true
}
```

### Month View (30 days)

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 30,
  "debug": true
}
```

### Year View (365 days)

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 365,
  "debug": true
}
```

## Color Variations

### Hex Color

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 14,
  "color": "#4CAF50",
  "debug": true
}
```

### RGB Color

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 14,
  "color": "rgb(255, 107, 107)",
  "debug": true
}
```

### CSS Color Name

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 14,
  "color": "coral",
  "debug": true
}
```

### Invalid Color (should fallback)

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 14,
  "color": "not-a-color",
  "debug": true
}
```

## Path Variations

### Single File

```habittracker
{
  "path": "test-vault/single-habits/custom-color.md",
  "daysToShow": 14,
  "debug": true
}
```

### Nested Folder

```habittracker
{
  "path": "test-vault/nested/deep",
  "daysToShow": 14,
  "debug": true
}
```

### Mixed Content Folder

```habittracker
{
  "path": "test-vault/mixed-content",
  "daysToShow": 14,
  "debug": true
}
```

## Date Range Tests

### Historical Date

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "lastDisplayedDate": "2024-01-15",
  "debug": true
}
```

### Future Date

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 21,
  "lastDisplayedDate": "2025-12-31",
  "debug": true
}
```

## Test Results ✅

- [ ] All boolean combinations work
- [ ] Days to show affects display correctly
- [ ] Color variations apply properly
- [ ] Invalid colors fallback gracefully
- [ ] Path variations load correctly
- [ ] Date ranges calculate properly
