# Command: Complete Current Plan

Archive the current plan as completed and clear the active plan slot.

_See [@docs/claude.md](../docs/claude.md) for complete workflow._

## Process

1. **Verify Current Plan Exists**: Check that `@plans/current-plan.md` exists
2. **Extract Plan Details**: Get plan title and creation date for proper naming
3. **Create Completed Directory**: Ensure `@plans/completed/` directory exists
4. **Generate Archive Name**: Create descriptive filename with date (e.g., `2025-01-19-feature-user-profiles.md`)
5. **Move Plan**: Move current plan to completed directory with new name
6. **Confirm Completion**: Show success message with final location

## Archive Naming Convention

Format: `YYYY-MM-DD-brief-description.md`

Examples:

- `2025-01-19-feature-user-profiles.md`
- `2025-01-19-bug-fix-image-upload.md`
- `2025-01-19-refactor-state-machine.md`

## Success Criteria

- [ ] Current plan moved to `@plans/completed/` with descriptive name
- [ ] `@plans/current-plan.md` no longer exists
- [ ] Ready for next `/plan` command
- [ ] Archived plan retains all original content and status

## Error Handling

If no current plan exists:

- Inform user that no active plan was found
- Suggest using `/plan` to create a new plan

If completed directory doesn't exist:

- Create it automatically
- Proceed with archiving

## Follow-up Actions

After completion, suggest:

- Review lessons learned from completed plan
- Use `/plan` to start next planning cycle
- Update project documentation if needed
