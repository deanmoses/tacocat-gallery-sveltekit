# Testing Guide

Best practices and patterns for writing tests in this project.

## Test Organization

### Group Related Functionality

```typescript
describe('ComponentOrModule', () => {
    describe('primaryMethod', () => {
        // All tests for primaryMethod grouped together
    });

    describe('secondaryMethod', () => {
        // All tests for secondaryMethod grouped together
    });
});
```

### Test Naming Convention

Use the `it('should...')` format for test descriptions:

```typescript
// ✅ Good: Clear, descriptive test names
it('should return formatted title when given valid filename', () => { ... });
it('should throw error when input is invalid', () => { ... });
it('should handle async operations correctly', async () => { ... });

// ❌ Bad: Vague or non-descriptive names
it('works', () => { ... });
it('test title function', () => { ... });
it('handles errors', () => { ... });
```

## Helper Functions

### Common Assertions

Extract frequently used assertions into reusable helper functions:

```typescript
function expectApiCalledWith(path: string) {
    expect(mockApi).toHaveBeenCalled();
    expect(mockApi.mock.calls.some((call) => call[0].includes(path))).toBe(true);
}

function expectElementVisible(element: HTMLElement) {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
}
```

### Mock Setup Helpers

Create helper functions for common mock configurations:

```typescript
function mockApiSuccess(response: ApiResponse) {
    mockApi.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
    });
}

function mockApiError(status: number, message: string) {
    mockApi.mockResolvedValueOnce({
        ok: false,
        status,
        json: () => Promise.resolve({ error: message }),
    });
}
```

**Benefits:**

- Reduces code duplication
- Improves test readability
- Centralizes mock configuration
- Makes tests more maintainable

## Async Testing

### Use vi.waitFor() Instead of Delays

```typescript
// ✅ Good: Wait for specific condition
await vi.waitFor(
    () => {
        expect(element).toBeVisible();
    },
    { timeout: TEST_TIMEOUT },
);

// ❌ Bad: Arbitrary delay
await new Promise((resolve) => setTimeout(resolve, 100));
```

### Test Async Error Conditions

```typescript
it('should handle async errors gracefully', async () => {
    // Arrange: Set up error condition
    mockApiError(500, 'Server error');

    // Act: Trigger async operation
    const promise = asyncFunction();

    // Assert: Wait for error handling
    await expect(promise).rejects.toThrow('Server error');
});
```

## Error Testing

### Synchronous Errors

```typescript
it('should throw error for invalid input', () => {
    const invalidInput = 'invalid-input';

    expect(() => {
        processInput(invalidInput);
    }).toThrow(`Invalid input: ${invalidInput}`);
});
```

### Asynchronous Errors

```typescript
it('should reject promise for invalid async operation', async () => {
    const invalidPath = 'invalid-path';

    await expect(asyncOperation(invalidPath)).rejects.toThrow(`Invalid path: ${invalidPath}`);
});
```

## Mocking Strategies

### Consistent Mock Patterns

```typescript
// ✅ Good: Use mockResolvedValueOnce for single-use mocks
mockApi.mockResolvedValueOnce({ ok: true, data: mockData });

// ✅ Good: Use mockResolvedValue for reusable mocks
function mockApiSuccess() {
    mockApi.mockResolvedValue({ ok: true, data: mockData });
}

// ❌ Avoid: Mixing patterns inconsistently
mockApi.mockResolvedValueOnce({ ok: true }); // Sometimes
mockApi.mockResolvedValue({ ok: false }); // Sometimes
```

### Mock Cleanup

```typescript
beforeEach(() => {
    vi.clearAllMocks();
    // Clear any other state as needed
});
```

## Anti-Patterns to Avoid

### 1. Inconsistent Test Structure

Follow the Arrange-Act-Assert (AAA) pattern:

```typescript
// ❌ Bad: Inconsistent arrangement
it('should do something', async () => {
    const data = createData();
    setup(data);
    const result = await processData(data);
    expect(result).toBe(true);
});

// ✅ Good: Clear AAA pattern
it('should do something', async () => {
    // Arrange
    const data = createData();
    setup(data);

    // Act
    const result = await processData(data);

    // Assert
    expect(result).toBe(true);
});
```

### 2. Undocumented "Magic" Numbers

```typescript
// ❌ Bad: Undocumented magic number
const TEST_TIMEOUT = 1000;

// ✅ Good: Documented timeout with explanation
const TEST_TIMEOUT = 1000; // 1 second timeout for async operations
```

### 3. Missing Test Documentation

```typescript
// ❌ Bad: No explanation of what's being tested
it('should handle loading', async () => { ... });

// ✅ Good: Clear test description
it('should show loading spinner while data is being fetched', async () => { ... });
```

### 4. Testing Implementation Details

```typescript
// ❌ Bad: Testing internal implementation
expect(component['privateMethod']).toHaveBeenCalled();

// ✅ Good: Testing public behavior
expect(screen.getByText('Expected output')).toBeInTheDocument();
```

## Testing Templates

### Basic Template

```typescript
it('should EXPECTED_BEHAVIOR when CONDITION', () => {
    // Arrange: Set up test data and environment
    const input = 'test-input';
    const expected = 'expected-output';

    // Act: Execute the functionality
    const result = functionUnderTest(input);

    // Assert: Verify the outcome
    expect(result).toBe(expected);
});
```

### Async Template

```typescript
it('should EXPECTED_BEHAVIOR when CONDITION', async () => {
    // Arrange: Set up test data and mocks
    const input = 'test-input';
    mockApiSuccess(mockResponse);

    // Act: Execute async functionality
    const result = await asyncFunction(input);

    // Assert: Verify the outcome
    expect(result).toBeDefined();
    expect(mockApi).toHaveBeenCalledWith(input);
});
```

### Error Testing Template

```typescript
it('should throw ERROR_TYPE when INVALID_INPUT', () => {
    // Arrange: Set up invalid input
    const invalidInput = 'invalid-input';

    // Act & Assert: Verify error is thrown
    expect(() => {
        functionUnderTest(invalidInput);
    }).toThrow(`Expected error message: ${invalidInput}`);
});
```

### Async Error Testing Template

```typescript
it('should handle async error when CONDITION', async () => {
    // Arrange: Set up error condition
    const input = 'test-input';
    mockApiError(500, 'Server error');

    // Act & Assert: Verify error handling
    await expect(asyncFunction(input)).rejects.toThrow('Server error');
});
```

## End-to-End Testing with Playwright

### Before Writing E2E Tests

**ALWAYS examine the actual DOM structure** before writing Playwright tests. Avoid assumptions about CSS classes, element hierarchy, or component structure.

#### 1. Inspect Components First

Before writing selectors, examine the actual components:

```bash
# Look at page components to understand routing
find src/lib/components/pages -name "*.svelte" | head -5

# Look at site components for UI structure
find src/lib/components/site -name "*.svelte" | head -10

# Check routes for available URLs
ls src/routes/
```

#### 2. Use Browser DevTools

- Navigate to pages manually in browser
- Inspect actual DOM elements and their attributes
- Note CSS classes, `data-*` attributes, ARIA labels
- Test responsive behavior at different viewport sizes

#### 3. Look for Test-Friendly Attributes

Prioritize selectors in this order:

```typescript
// ✅ Best: Test-specific attributes
page.getByTestId('album-thumbnail');
page.getByRole('button', { name: 'Upload Photo' });

// ✅ Good: Semantic attributes
page.getByRole('link', { name: /home/i });
page.getByLabel('Search photos');

// ⚠️ Okay: Stable CSS classes (if semantic attributes unavailable)
page.locator('.album-grid');

// ❌ Avoid: Generic or implementation-specific selectors
page.locator('div.css-xyz123');
page.locator('button:nth-child(3)');
```

#### 4. Verify Routes Exist

Check routing structure before writing navigation tests:

```typescript
// Check actual routes in src/routes/ directory
// Don't assume URLs like '/albums/123' exist without verification
```

### E2E Test Structure

#### Arrange-Act-Assert for E2E

```typescript
test('should navigate through photo gallery', async ({ page }) => {
    // Arrange: Set up initial state
    await page.goto('/');

    // Act: Perform user interactions
    await page.getByRole('link', { name: /albums/i }).click();
    await page.getByTestId('album-thumbnail').first().click();

    // Assert: Verify expected outcomes
    await expect(page).toHaveURL(/\/album\/\d+/);
    await expect(page.getByRole('heading')).toBeVisible();
});
```

#### Wait for Dynamic Content

```typescript
// ✅ Good: Wait for specific content
await page.waitForLoadState('networkidle');
await expect(page.getByTestId('photo-grid')).toBeVisible();

// ✅ Good: Wait for API calls to complete
await page.waitForResponse((response) => response.url().includes('/api/albums'));

// ❌ Bad: Arbitrary waits
await page.waitForTimeout(2000);
```

#### Mobile-Responsive Testing

```typescript
test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Test mobile-specific UI elements
    await expect(page.getByTestId('mobile-menu-toggle')).toBeVisible();
    await expect(page.getByTestId('desktop-nav')).not.toBeVisible();
});
```
