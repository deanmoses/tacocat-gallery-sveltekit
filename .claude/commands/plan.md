# Command: Plan New Feature or Task

Ultrathink through creating a comprehensive plan for the requested task.

## Planning Process

1. **Understand Requirements**: Thoroughly analyze what is being requested
2. **Choose Template**: Select appropriate template from @plans/templates/
    - Feature development: use feature-plan.md
    - Bug fixing: use bug-fix-plan.md
    - Refactoring: use refactor-plan.md
3. **Create Detailed Plan**: Use extended thinking to consider all aspects
4. **Save Plan**: Store as @plans/current-plan.md for tracking

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
