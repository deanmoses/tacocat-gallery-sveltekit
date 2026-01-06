---
description: Run comprehensive pre-commit / pre-PR review for this project
---

# Pre-commit / Pre-PR Review

You are helping the user prepare a commit or pull request by guiding them through a comprehensive quality checklist.

## Your Role

Guide the user through each step of the checklist systematically. For each step:

1. Explain what needs to be done
2. Execute the required checks/commands
3. Report the results clearly
4. Only proceed to the next step after current step passes or user acknowledges issues

## Checklist Steps

### 1. Issue Compliance Verification

- Ask the user if there's a GitHub issue number they're working on
- Use `gh issue view <number>` to fetch the issue details
- Review ALL requirements in the issue
- Verify 100% completion of specified requirements
- If any requirement cannot be met, STOP and discuss with user before proceeding

### 2. Initial Quality Gate

- Run `npm run precommit` (format + lint + typecheck + unit tests)
- Report any errors found
- If errors, STOP and require fixes before proceeding

### 3. Agent Reviews

Run these 4 specialized agents on all new/modified code:

**Documentation Review:**

- Use the Task tool with subagent_type="documentation-reviewer"
- Check: pattern compliance against `CLAUDE.md`, documentation gaps, clarity issues

**Svelte 5 Review:**

- Use the Task tool with subagent_type="svelte5-reviewer" on Svelte files and .svelte.ts files
- Check: runes correctness, reactivity patterns, SvelteKit conventions, project-specific patterns from `docs/Svelte.md`

**Clean Code Review:**

- Use the Task tool with subagent_type="clean-code-reviewer"
- Check: single responsibility, meaningful names, small functions, DRY violations

**Code Smell Detection:**

- Use the Task tool with subagent_type="code-smell-detector"
- Identify maintainability hints and readability improvements

Each agent returns a table in this format:

```markdown
| ID  | Finding             | Location                 | Severity |
| --- | ------------------- | ------------------------ | -------- |
| SV1 | $effect vs $derived | src/lib/stores/foo.ts:42 | Major    |
| SV2 | Missing cleanup     | src/lib/stores/bar.ts:15 | Minor    |
```

ID prefixes by agent: DOC, SV, CLEAN, SMELL

### 4. After all agents return

Each agent gave you a table. Build a single consolidated table from all agent results, adding these columns:

1. **Scope**: PR (this PR's changes) or Pre-existing (not modified by this PR)
2. **Architect's Take**: what a distinguished architect would say
3. **Recommendation**: Fix / File Issue / Won't Fix

Display the consolidated table to the user and summarize which issues you think should actually be addressed.

**Do NOT:**

- Summarize away individual issues into vague categories
- Say "there are some minor issues but they're not important"

### 5. User review loop

Wait for user to respond to you about the findings. React to the user, fix things, offer advice.

After each set of things fixed, ask user if there is anything else to address. Once the user is satisfied, move on.

### 6. Post-Fix Quality Gate

- Run `npm run precommit` again to verify fixes didn't break anything
- If errors, STOP and require fixes before proceeding

### 7. E2E Tests

- Run `npm run test:e2e` to execute E2E tests
- Report pass/fail status
- If failures exist, STOP and require fixes before proceeding

### 8. Build Verification

- Run `npm run build` to verify the production build succeeds
- Report any build errors or warnings
- If build fails, STOP and require fixes before proceeding

## Success Criteria

All steps must pass before PR creation:

- All issue requirements completed (if applicable)
- `npm run precommit` passes (format + lint + typecheck + unit tests)
- Agent reviews completed, findings addressed or acknowledged
- `npm run test:e2e` passes
- `npm run build` succeeds

## Final Output

After completing all steps:

1. Display final summary by recommendation count
2. List any items that still need addressing
3. Provide recommendation: Ready/Not ready for PR

## Important Notes

- **Fail Fast**: Stop at first major issue - don't continue if critical problems exist
- **Follow the Docs**: All code should follow patterns in `CLAUDE.md`
- **Issue Compliance**: 100% requirement completion is mandatory when working on an issue
- **Complete Visibility**: Never hide issues. Surface everything, let the user decide.
