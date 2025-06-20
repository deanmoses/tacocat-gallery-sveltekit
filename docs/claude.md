# Workflow for Developing With Claude

How to use the [Claude Code](https://www.anthropic.com/claude-code) AI developer assistant with this project.

While you are always free to just start talking to Claude, the commands below guide Claude to adhere to this project's development process.

The basic idea is that when you're ready to do a software development task (like building a new feature or writing a test) you follow this workflow:

1. Use [`/plan`](#plan---plan-the-work) to create a plan for doing some work
2. Use [`/implement`](#implement---do-the-work) to do the work
3. Use [`/review`](#implement---do-the-work) to verify it was correctly built
4. Use [`/complete`](#complete---mark-the-work-as-done) to archive completed plan or [`/backlog`](#backlog---defer-the-work) if not completed

## Commands

### `/plan` - Plan the work

- Uses "ultrathink" for comprehensive analysis
- Selects appropriate [plan template](#plan-templates)
- Creates detailed implementation plan using the template
- Saves to `plans/current-plan.md`

### `/implement` - Do the work

- Executes current plan incrementally
- Follows mandatory [AI Assistant Workflow](ai_assistant_workflow.md)
- Updates plan progress in real-time
- Small, focused commits

### `/review` - Verify the work is correct

- Verifies work against the initial plan
- Checks code quality standards
- Validates test coverage
- Confirms performance benchmarks

### `/complete` - Mark the work as done

- Archives current plan to `plans/completed/`
- Clears active plan slot

### `/backlog` - Defer the work

- Moves current plan to `plans/backlog/`
- Clears active plan slot

## Plan Templates

The system will choose from different planning templates depending on the type of work you ask for

### Feature Plan (`feature-plan.md`)

- Comprehensive feature development
- Architecture design and components
- Testing strategy and acceptance criteria
- Performance and security considerations

### Bug Fix Plan (`bug-fix-plan.md`)

- Root cause analysis
- Impact assessment
- Fix strategy and implementation steps
- Prevention measures

### Refactor Plan (`refactor-plan.md`)

- Current state problems
- Target architecture
- Phased migration strategy
- Risk management

## File Structure

```
plans/
├── current-plan.md # Active plan
├── completed/      # Done plans
├── backlog/        # Future plans
└── templates/      # Plan templates
```
