# AI Assistant Workflow Guidelines

Guidelines for AI development assistants working on this project.

## AI Assistant Development Workflow

### When Making Changes to Live Code

1. **Read and understand** the existing code first
2. **Make the requested changes**
3. **Run linter**: `npm run lint:fix`
4. **If previous step passes, run type checker**: `npm run check`
5. **If previous step passes, run unit tests**: `npm run test:unit`
6. **Fix any issues** found in the failing step
7. **Re-run the failing step** to confirm the fix, then continue to the next step
8. **Report completion** only after all steps pass

### When Adding or Editing Tests

1. **Read and understand** the code to be tested, if it exists yet
2. **Write the test code**
3. **Run the specific test file**: `npm run test:unit src/path/to/file.test.ts`
4. **If previous step passes, run linter**: `npm run lint:fix`
5. **If previous step passes, run type checker**: `npm run check`
6. **If previous step passes, run all tests**: `npm run test:unit`
7. **Fix any issues** found in the failing step. Assume first that the test is buggy, not the code it's testing. Exhaust that possibility first.
8. **Re-run the failing step** to confirm the fix, then continue on to the next step
9. **Report completion** only after all steps pass

## AI Assistants Must Avoid These Common Mistakes

### Test Execution is MANDATORY

- **ALWAYS run unit tests after making code changes** before telling the user you're done
- If tests fail, fix the issues before reporting completion
- Never say "I'm done" or "the task is complete" without running tests first

### Do NOT Fix Link Errors Yourself

- Instead of fixing lint errors yourself, first try `npm run lint:fix`
