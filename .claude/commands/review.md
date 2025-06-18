# Command: Code Review

Perform comprehensive code review against plan requirements and project standards.

## Review Process

1. **Load Context**: Review the relevant plan and project standards
2. **Analyze Changes**: Examine all modified files and their purpose
3. **Verify Requirements**: Ensure all plan objectives are met
4. **Check Quality**: Validate against project standards
5. **Test Verification**: Confirm all tests pass and coverage is adequate

## Review Checklist

### Plan Compliance

- [ ] All plan objectives achieved
- [ ] Acceptance criteria satisfied
- [ ] Scope matches original plan
- [ ] Performance requirements met
- [ ] Security considerations addressed

### Code Quality

- [ ] Follows patterns from @CLAUDE.md
- [ ] TypeScript properly used throughout
- [ ] Component architecture aligns with @docs/component_architecture.md
- [ ] Performance optimizations per @docs/performance_optimization.md
- [ ] No magic numbers or hardcoded values
- [ ] Proper error handling implemented

### Testing Standards

- [ ] Tests follow @docs/testing.md guidelines
- [ ] Adequate test coverage for new functionality
- [ ] Tests are clear and maintainable
- [ ] E2E tests cover user workflows (if applicable)
- [ ] Bundle size impact acceptable
- [ ] Performance benchmarks met

### Documentation

- [ ] Code is self-documenting with clear naming
- [ ] Complex logic has explanatory comments
- [ ] API changes documented (if applicable)
- [ ] README or docs updated (if needed)

### Technical Review

### Architecture

- [ ] Changes align with existing architecture
- [ ] New components follow established patterns
- [ ] Dependencies are justified and minimal
- [ ] State management patterns consistent

### Performance

- [ ] Bundle size impact measured and acceptable
- [ ] No performance regressions introduced
- [ ] Lazy loading used appropriately
- [ ] Critical path optimized

### Security

- [ ] Input validation implemented
- [ ] No sensitive data exposed
- [ ] Authentication/authorization respected
- [ ] Dependencies are secure and up-to-date

### Maintainability

- [ ] Code is readable and well-structured
- [ ] Complex logic is broken into smaller functions
- [ ] Consistent naming conventions
- [ ] Minimal cognitive complexity

## Testing Verification

Run the complete AI Assistant Workflow:

1. **Lint Check**: `npm run lint`
2. **Type Check**: `npm run check`
3. **Unit Tests**: `npm run test:unit`
4. **E2E Tests**: `npm run test:e2e`

All tests must pass for review approval.

## Review Outcome

### Approved ✅

- All checklist items satisfied
- Plan objectives completely met
- Tests pass and coverage adequate
- Code quality meets project standards

### Needs Changes ❌

- Specific issues identified and documented
- Clear guidance on required changes
- Re-review required after changes

### Conditional Approval ⚠️

- Minor issues that can be addressed in follow-up
- Must be tracked as separate tasks
- Overall objectives achieved

## Documentation Updates

If the review identifies areas for improvement:

- [ ] Update coding standards documentation
- [ ] Add lessons learned to @docs/claude.md
- [ ] Update project patterns documentation
- [ ] Create new guidelines for similar future work

## Follow-up Actions

After review completion:

- [ ] Archive completed plan to @plans/completed/
- [ ] Update project documentation with lessons learned
- [ ] Note any technical debt for future addressing
- [ ] Celebrate successful implementation! 🎉
