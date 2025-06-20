# Command: Implement the Plan

Execute the current plan with systematic progress tracking and testing integration.

_See [@docs/claude.md](../docs/claude.md) for complete workflow._

## Implementation Process

1. **Load Current Plan**: Review @plans/current-plan.md thoroughly
2. **Understand Context**: Reference @CLAUDE.md for project conventions
3. **Identify Next Steps**: Find uncompleted tasks in the plan
4. **Execute Incrementally**: Implement one major step at a time
5. **Follow AI Assistant Workflow**: After each step, run the complete testing workflow

## AI Assistant Workflow (MANDATORY)

After each implementation step:

1. **Lint**: `npm run lint:fix`
2. **Type Check**: `npm run check`
3. **Unit Tests**: `npm run test:unit`
4. **E2E Tests**: `npm run test:e2e` (if applicable)
5. **Fix Issues**: Address any failures before proceeding

## Implementation Guidelines

### Code Quality

- Follow existing patterns in the codebase
- Use TypeScript for all new code
- Follow component architecture patterns from @docs/component_architecture.md
- Maintain performance standards per @docs/performance_optimization.md

### Testing Requirements

- Write tests according to @docs/testing.md guidelines
- Ensure new functionality has appropriate test coverage
- Update existing tests if behavior changes
- Run bundle size test to verify performance impact

### Progress Tracking

- Update the current plan with completion status after each step
- Mark completed tasks with ✅
- Note any issues or deviations discovered
- Update estimates if timeline changes

## Step-by-Step Process

1. **Analyze Plan**: Understand all requirements and acceptance criteria
2. **Implement Step**: Focus on one logical unit of work
3. **Test Step**: Run full AI Assistant Workflow
4. **Update Plan**: Mark progress and note any issues
5. **Commit Changes**: Small, focused commits with clear messages
6. **Repeat**: Continue with next step

## Quality Checks

Before marking any step complete:

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Performance benchmarks met (if applicable)
- [ ] Documentation updated (if needed)

## Communication

If you encounter:

- **Blockers**: Note in plan and explain the issue
- **Scope Changes**: Update plan and explain reasoning
- **Technical Decisions**: Document rationale in plan notes
- **Performance Issues**: Measure impact and propose solutions

## Completion Criteria

The implementation is complete when:

- [ ] All plan objectives achieved
- [ ] All acceptance criteria met
- [ ] Full test suite passes
- [ ] Performance requirements satisfied
- [ ] Documentation updated
- [ ] Plan marked as complete and archived

After completion, move the plan to @plans/completed/ with a descriptive filename and date.
