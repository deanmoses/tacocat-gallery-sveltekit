# Claude Workflow

How to use the [Claude Code](https://www.anthropic.com/claude-code) AI developer assistant with this project.

## Custom Commands

### `/plan` - Planning Phase

- Checks for existing current plan first
- Uses "ultrathink" for comprehensive analysis
- Selects appropriate template from `plans/templates/`
- Creates detailed implementation plan
- Saves to `plans/current-plan.md`

### `/implement` - Implementation Phase

- Executes current plan incrementally
- Follows mandatory [AI Assistant Workflow](ai_assistant_workflow.md)
- Updates plan progress in real-time
- Small, focused commits

### `/review` - Review Phase

- Verifies against plan requirements
- Checks code quality standards
- Validates test coverage
- Confirms performance benchmarks

### `/complete` - Plan Completion

- Archives current plan to `plans/completed/`
- Auto-generates descriptive filename with date
- Clears active plan slot for next cycle
- Maintains completion history

### `/backlog` - Plan Deferral

- Moves current plan to `plans/backlog/`
- Handles deprioritized or blocked plans
- Preserves plan for future reactivation
- Clears active plan slot

## Plan Templates

### Feature Plan (`plans/templates/feature-plan.md`)

- Comprehensive feature development
- Architecture design and components
- Testing strategy and acceptance criteria
- Performance and security considerations

### Bug Fix Plan (`plans/templates/bug-fix-plan.md`)

- Root cause analysis
- Impact assessment
- Fix strategy and implementation steps
- Prevention measures

### Refactor Plan (`plans/templates/refactor-plan.md`)

- Current state problems
- Target architecture
- Phased migration strategy
- Risk management

## Plan Organization

```
plans/
├── current-plan.md          # Active plan
├── completed/               # Done plans
├── backlog/                 # Future plans
└── templates/               # Plan templates
```

## Plan Lifecycle

1. **Create**: `/plan` → `current-plan.md`
2. **Execute**: `/implement` with progress tracking
3. **Verify**: `/review` against requirements
4. **Archive**: `/complete` → `completed/` OR `/backlog` → `backlog/`

## Key Principles

- **Incremental**: Small, testable steps
- **Documented**: All decisions tracked in plans
- **Tested**: Comprehensive testing at each step
- **Reviewed**: Systematic verification against requirements
- **Managed**: Clear plan lifecycle with proper archiving

See [docs/claude.md](claude.md) for complete Claude Code configuration details.
