## Critical Fixes (Do Now)
- Fix date mutation bug in streak calculation (Habit.svelte:87)
- Add missing `let` to variable declaration (Habit.svelte:117)
- Clean up event listeners in `onDestroy` to prevent memory leaks
- ✅ Fix daysToShow off-by-one error (already fixed)

## Quality Improvements (Next Sprint)
- Migrate utils.js to TypeScript for better type safety
- Add error boundaries for better user experience
- Optimize reactive computations in Habit component
- Convert manual DOM action bar to Svelte component
- Add keyboard navigation and basic accessibility

## Feature Backlog
- Show streak even if it's starting from before the displayed days
- Pass Today as a variable instead of using new Date()
- Auto switch to new day at midnight
- Allow user to create a habit from the tracker
- Show only habits that have activity in recent period
- Add dashboard for each habit with stats (current streak, avg streak, best streak, avg completion rate etc)
- Batch file operations for better performance with large habit folders

## Nice to Have
- Add comprehensive test suite
- Implement proper CSS design system
- Add RTL language support
- Performance monitoring and optimization
- Add habit templates and quick-create workflows

## Done

- make it work in reading mode
- publish it
- readme/tutorial
- allow user to specify the path
- make it work in portrait mode
- error handling
