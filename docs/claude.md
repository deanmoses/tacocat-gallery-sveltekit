# Claude Code Configuration Guide

How to use the [Claude Code](https://www.anthropic.com/claude-code) AI developer assistant with this project.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Configuration Files](#configuration-files)
- [Plan Management](#plan-management)
- [Custom Commands](#custom-commands)
- [Best Practices](#best-practices)
- [Team Workflows](#team-workflows)
- [Troubleshooting](#troubleshooting)

## Overview

This project is optimally configured for Claude Code with:

- **Project Memory**: `CLAUDE.md` with comprehensive project context
- **Team Settings**: Shared configuration in `.claude/settings.json`
- **Personal Settings**: Individual preferences in `.claude/settings.local.json`
- **Plan Management**: Structured planning workflows in `plans/` directory
- **Custom Commands**: Reusable workflows in `.claude/commands/`
- **Documentation Integration**: All docs linked via `mdc:` format in Cursor rules

## Setup

### Initial Setup for New Team Members

1. **Install Claude Code**: Follow the [official installation guide](https://docs.anthropic.com/en/docs/claude-code)

2. **Set Up Project**: as described in [README.md](/README.md)

3. **Verify Configuration**:

    ```bash
    ls -la .claude/
    # Should show: settings.json, commands/, templates/
    ```

4. **Start Claude Code**:
    ```bash
    claude
    ```

The project's `CLAUDE.md` and `.claude/settings.json` will automatically load, providing immediate context.

## Configuration Files

### `.claude/settings.json` (Team Shared)

Shared configuration tracked in git

### `.claude/settings.local.json` (Personal)

Individual developer settings (gitignored)

### `CLAUDE.md` (Project Memory)

Contains comprehensive project context including:

- Commands and tech stack
- Project structure
- Code style guidelines
- Dependencies and deployment info

## Plan Management

### Directory Structure

```
plans/
├── current-plan.md          # Active implementation plan
├── completed/               # Archive of completed plans
│   ├── 2025-01-bundle-optimization.md
│   └── 2025-01-testing-improvements.md
└── templates/               # Team plan templates
    ├── feature-plan.md      # Feature implementation
    ├── bug-fix-plan.md      # Bug fix planning
    └── refactor-plan.md     # Refactoring plans
```

### Plan Workflow

1. **Create Plan**: Use `/plan` command or manually create in `plans/`
2. **Use Extended Thinking**: Include "ultrathink" in complex planning requests
3. **Store Active Plan**: Save as `plans/current-plan.md`
4. **Track Progress**: Update plan with completion status
5. **Archive Completed**: Move to `plans/completed/` with descriptive name

### Plan Template Example

```markdown
# Feature: [Feature Name]

## Context

Brief description of the feature and why it's needed.

## Goals

- [ ] Primary objective
- [ ] Secondary objective

## Implementation Steps

1. [ ] Step 1 with specific details
2. [ ] Step 2 with acceptance criteria
3. [ ] Step 3 with testing requirements

## Testing Strategy

- Unit tests: [specific requirements]
- E2E tests: [specific scenarios]
- Performance: [specific metrics]

## Definition of Done

- [ ] Code implemented and reviewed
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Performance benchmarks met

## Notes

Any additional context or considerations.
```

## Custom Commands

### Available Commands

Access via `/` in Claude Code:

#### `/plan` - Planning Workflow

Initiates structured planning with extended thinking for complex features.

#### `/implement` - Implementation Workflow

Executes current plan with progress tracking and testing integration.

#### `/review` - Code Review Workflow

Reviews changes against plan requirements and project standards.

### Creating Custom Commands

1. Create `.md` file in `.claude/commands/`
2. Use clear, actionable prompts
3. Include project-specific context
4. Test with team before committing

Example command structure:

```markdown
# Command: Feature Implementation

Please implement the feature described in @plans/current-plan.md following these steps:

1. **Analyze Requirements**: Review the plan and understand all acceptance criteria
2. **Code Implementation**: Write code following project conventions in @CLAUDE.md
3. **Testing**: Create comprehensive tests as specified in @docs/testing.md
4. **Documentation**: Update relevant docs if needed
5. **Verification**: Run full test suite and verify all requirements met

Use "think hard" for complex implementation decisions.

After completion, update the plan with progress and any discovered issues.
```

## Best Practices

### Planning Phase

1. **Use Extended Thinking**: Include "ultrathink" for complex problems
2. **Be Specific**: Detailed requirements prevent scope creep
3. **Include Acceptance Criteria**: Clear definition of done
4. **Consider Edge Cases**: Think through error scenarios
5. **Plan Testing**: Include test strategy in initial plan

### Implementation Phase

1. **Follow AI Assistant Workflow**: Always run lint → typecheck → unit tests → E2E tests
2. **Small Increments**: Break large features into smaller, testable chunks
3. **Update Plans**: Keep current plan synchronized with actual progress
4. **Commit Frequently**: Small commits with clear messages

### Team Collaboration

1. **Shared Commands**: Use team commands in `.claude/commands/`
2. **Plan Reviews**: Review plans before implementation
3. **Archive Completed Work**: Maintain history in `plans/completed/`
4. **Document Learnings**: Update this guide with new insights

## Team Workflows

### Feature Development

1. **Planning Session**: Use `/plan` to create comprehensive feature plan
2. **Team Review**: Review plan before implementation begins
3. **Implementation**: Use `/implement` with progress tracking
4. **Code Review**: Standard pull request process + `/review` command
5. **Archive**: Move completed plan to archive with lessons learned

### Bug Fixes

1. **Investigation**: Use Claude to analyze bug reports and logs
2. **Root Cause**: Identify underlying cause with "think hard"
3. **Fix Planning**: Create focused plan using bug-fix template
4. **Implementation**: Fix with comprehensive test coverage
5. **Verification**: Ensure fix resolves issue without regressions

### Refactoring

1. **Assessment**: Evaluate current code with Claude's analysis
2. **Strategy**: Plan refactoring approach with "ultrathink"
3. **Incremental Changes**: Small, testable refactoring steps
4. **Validation**: Ensure functionality preserved throughout
5. **Documentation**: Update architecture docs if needed

## Integration with Existing Tools

### Testing Integration

Claude Code works seamlessly with the project's testing setup:

```bash
# Commands automatically available in Claude
npm run test:unit
npm run test:e2e
npm run test        # runs both
```

See [@docs/testing.md](mdc:docs/testing.md) for testing guidelines.

### Deployment Integration

Claude can assist with deployment tasks:

```bash
# Available deployment commands
npm run deploy-staging
npm run deploy-prod
```

### Development Workflow

Claude integrates with standard development commands:

```bash
npm run dev         # Start development server
npm run build       # Production build
npm run lint:fix    # Fix linting issues
npm run check       # TypeScript checking
```

## Troubleshooting

### Common Issues

#### Permission Denied Errors

- Check `.claude/settings.json` for required permissions
- Verify commands are in the allowed list
- Personal overrides in `.claude/settings.local.json`

#### Context Too Large

- Use plan mode (Shift+Tab twice) for large operations
- Break complex tasks into smaller plans
- Use focused documentation imports in memory

#### Commands Not Available

- Verify `.claude/commands/` directory exists
- Check command file format (must be `.md`)
- Restart Claude Code to reload commands

#### Plan Not Loading

- Verify plan file exists in `plans/` directory
- Check file permissions and git tracking
- Use absolute references like `@plans/current-plan.md`

### Getting Help

1. **Documentation**: Check [official Claude Code docs](https://docs.anthropic.com/en/docs/claude-code)
2. **Team Commands**: Use `/help` or check `.claude/commands/`
3. **Project Context**: Review `CLAUDE.md` for project-specific guidance
4. **Community**: Check [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) for examples

### Optimization Tips

1. **Use Plan Mode**: Shift+Tab twice for complex operations
2. **Extended Thinking**: "ultrathink" for architectural decisions
3. **Custom Commands**: Create project-specific workflows
4. **Memory Management**: Regular cleanup of old conversations
5. **Git Worktrees**: Use multiple worktrees for parallel development

---

This configuration leverages Claude Code's capabilities while maintaining team consistency and project quality standards.
