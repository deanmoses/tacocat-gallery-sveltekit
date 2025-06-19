# Command: Move Plan to Backlog

Move the current plan to backlog for future consideration and clear the active plan slot.

_See [@docs/claude.md](../docs/claude.md) for complete workflow._

## Process

1. **Verify Current Plan Exists**: Check that `@plans/current-plan.md` exists
2. **Extract Plan Details**: Get plan title for proper naming
3. **Create Backlog Directory**: Ensure `@plans/backlog/` directory exists
4. **Generate Backlog Name**: Create descriptive filename (e.g., `feature-user-profiles.md`)
5. **Move Plan**: Move current plan to backlog directory with new name
6. **Confirm Move**: Show success message with final location

## Backlog Naming Convention

Format: `brief-description.md`

Examples:

- `feature-user-profiles.md`
- `performance-optimization.md`
- `accessibility-improvements.md`

## Use Cases

Move plans to backlog when:

- **Deprioritized**: Important but not urgent
- **Blocked**: Waiting on external dependencies
- **Scope change**: Too large for current sprint
- **Research needed**: Requires more investigation
- **Future enhancement**: Good idea for later implementation

## Success Criteria

- [ ] Current plan moved to `@plans/backlog/` with descriptive name
- [ ] `@plans/current-plan.md` no longer exists
- [ ] Ready for next `/plan` command
- [ ] Backlogged plan retains all original content

## Backlog Management

Plans in backlog can be:

- **Reactivated**: Copy back to `current-plan.md` when ready
- **Updated**: Modify based on new requirements or insights
- **Archived**: Move to completed if no longer relevant
- **Merged**: Combine with similar backlog items

## Error Handling

If no current plan exists:

- Inform user that no active plan was found
- Suggest using `/plan` to create a new plan

If backlog directory doesn't exist:

- Create it automatically
- Proceed with moving plan

## Follow-up Actions

After moving to backlog:

- Use `/plan` to start new planning cycle
- Periodically review backlog for reactivation opportunities
- Consider grouping related backlog items for future planning
