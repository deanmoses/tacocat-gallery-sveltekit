# Command: Plan New Feature or Task

Ultrathink through creating a comprehensive plan for the requested task.

_See [@docs/claude.md](../docs/claude.md) for complete workflow._

## Planning Process

1. **Check for Existing Plan**: First check if @plans/current-plan.md already exists

    **If current plan exists:**

    - Show current plan status and progress
    - Offer options to user:
        - Use `/complete` to archive the current plan as completed
        - Use `/backlog` to move current plan to backlog for later
        - Create timestamped backup and proceed with new plan
    - **STOP** and wait for user decision before proceeding

2. **Understand Requirements**: Thoroughly analyze what is being requested
3. **Choose Template**: Select appropriate template from @plans/templates/
    - Feature development: use feature-plan.md
    - Bug fixing: use bug-fix-plan.md
    - Refactoring: use refactor-plan.md
4. **Create Detailed Plan**: Use extended thinking to consider all aspects
5. **Save Plan**: Store as @plans/current-plan.md for tracking

## Key Considerations

- **Architecture Impact**: How does this affect existing components?
- **Testing Strategy**: What testing is needed to verify success?
- **Performance Impact**: Bundle size, runtime performance, etc.
- **Dependencies**: What other work or decisions are needed?
- **Risk Assessment**: What could go wrong and how to mitigate?
- **Timeline**: Realistic estimates for each phase

## Output Format

Create a comprehensive plan following the appropriate template with:

- Clear acceptance criteria for each step
- Specific implementation details
- Testing requirements aligned with @docs/testing.md
- Performance considerations per @docs/performance_optimization.md
- Integration with existing codebase patterns from @CLAUDE.md

After creating the plan, save it to @plans/current-plan.md and provide a summary of the key points and next steps.
