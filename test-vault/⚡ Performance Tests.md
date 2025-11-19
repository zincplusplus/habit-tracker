# ⚡ Performance Tests

This page tests performance with large data sets and extreme configurations.

## Large Habit Collection

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 365,
  "debug": false,
  "showStreaks": true
}
```

## Stress Test - Many Days

```habittracker
{
  "path": "test-vault/single-habits/long-streak.md",
  "daysToShow": 365,
  "debug": false
}
```

## Minimal Performance Test

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 1,
  "debug": false,
  "showStreaks": false,
  "matchLineLength": false
}
```

## Maximum Settings Test

```habittracker
{
  "path": "test-vault/habits",
  "daysToShow": 1000,
  "debug": true,
  "showStreaks": true,
  "matchLineLength": true,
  "color": "#ff0000"
}
```

## Performance Metrics to Monitor

### Loading Time

- [ ] < 100ms for 5 habits, 21 days
- [ ] < 500ms for 20 habits, 90 days
- [ ] < 2s for 50 habits, 365 days

### Memory Usage

- [ ] No significant memory leaks
- [ ] Reasonable memory consumption
- [ ] Cleanup on component destroy

### Responsiveness

- [ ] Smooth scrolling
- [ ] Quick habit toggling
- [ ] No UI blocking

### Large Data Sets

- [ ] 100+ habits load correctly
- [ ] 1000+ day ranges work
- [ ] 10,000+ entries per habit

## Performance Notes

Record performance observations here:

- Loading time with different configurations
- Memory usage patterns
- Any noticeable lag or delays
- Browser/device specific issues

## Optimization Opportunities

Areas identified for potential optimization:

1. **Date Calculations**:
2. **Reactivity**:
3. **DOM Updates**:
4. **File I/O**:
