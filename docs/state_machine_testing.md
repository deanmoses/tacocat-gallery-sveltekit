# State Machine Testing Guide

Some best practices for testing state machines.

## Table of Contents

- [Test Organization](#test-organization)
- [Helper Functions](#helper-functions)
- [State Machine Testing Patterns](#state-machine-testing-patterns)
- [Async Testing](#async-testing)
- [Error Testing](#error-testing)
- [Mocking Strategies](#mocking-strategies)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Testing Templates](#testing-templates)

## Test Organization

### Group Related Functionality

```typescript
describe('StateMachine', () => {
    describe('primaryMethod', () => {
        // All tests for primaryMethod grouped together
    });

    describe('secondaryMethod', () => {
        // All tests for secondaryMethod grouped together
    });
});
```

**Benefits:**

- Clear organization and navigation
- Logical grouping of related test scenarios
- Easy to find specific functionality tests

## Helper Functions

### Common Assertions

Extract frequently used assertions into reusable helper functions:

```typescript
function expectStateStatus(path: string, expectedStatus: StateStatus) {
    expect(stateStore.get(path)?.status).toBe(expectedStatus);
}

function expectApiCalledWithPath(path: string) {
    expect(mockApi).toHaveBeenCalled();
    expect(mockApi.mock.calls.some((call) => call[0].includes(path))).toBe(true);
}
```

### Mock Setup Helpers

Create helper functions for common mock configurations:

```typescript
function mockStorageSuccess(data: DataType | undefined) {
    vi.mocked(getFromStorage).mockResolvedValueOnce(data);
}

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

## State Machine Testing Patterns

### State Transition Testing

Test state transitions explicitly, verifying both intermediate and final states:

```typescript
it('should go INITIAL > LOADING > LOADED when successful', async () => {
    // Arrange: Set up test data and mocks
    const itemPath = '/test/path/';
    const mockData = createMockData(itemPath);
    mockStorageSuccess(mockData);
    mockApiSuccess(mockData);

    // Act: Trigger the state transition
    stateMachine.fetch(itemPath);

    // Assert: Verify initial loading state
    expectStateStatus(itemPath, StateStatus.LOADING);

    // Wait: For async operations to complete
    await vi.waitFor(
        () => {
            expectStateStatus(itemPath, StateStatus.LOADED);
        },
        { timeout: TEST_TIMEOUT },
    );

    // Assert: Verify final state and side effects
    const loadedItem = stateStore.get(itemPath)?.data;
    expect(loadedItem).toBeDefined();
    expect(loadedItem?.path).toBe(itemPath);

    // Verify API calls were made
    expectApiCalledWithPath(itemPath);
});
```

### Edge Case Testing

Test scenarios where state transitions should not occur:

```typescript
it('should do nothing if already in LOADING state', () => {
    // Arrange: Set up item in loading state
    const itemPath = '/test/path/';
    stateStore.set(itemPath, { status: StateStatus.LOADING });

    // Act: Attempt to fetch again
    stateMachine.fetch(itemPath);

    // Assert: Verify no additional API calls
    expect(mockApi).not.toHaveBeenCalled();
    expect(mockStorage).not.toHaveBeenCalled();

    // Verify state remains unchanged
    expectStateStatus(itemPath, StateStatus.LOADING);
});
```

## Async Testing

### Use vi.waitFor() Instead of Delays

```typescript
// ✅ Good: Wait for specific condition
await vi.waitFor(
    () => {
        expectStateStatus(itemPath, StateStatus.LOADED);
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
    stateMachine.fetch(itemPath);

    // Assert: Wait for error state
    await vi.waitFor(
        () => {
            expectStateStatus(itemPath, StateStatus.ERROR);
        },
        { timeout: TEST_TIMEOUT },
    );
});
```

## Error Testing

### Synchronous Errors

```typescript
it('should throw error for invalid input', () => {
    const invalidInput = 'invalid-input';

    expect(() => {
        stateMachine.process(invalidInput);
    }).toThrow(`Invalid input: ${invalidInput}`);
});
```

### Asynchronous Errors

```typescript
it('should reject promise for invalid async operation', async () => {
    const invalidPath = 'invalid-path';

    await expect(stateMachine.asyncOperation(invalidPath)).rejects.toThrow(`Invalid path: ${invalidPath}`);
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
    stateStore.clear();
});
```

## Anti-Patterns to Avoid

### 1. Inconsistent Test Structure

```typescript
// ❌ Bad: Inconsistent arrangement
it('should do something', async () => {
    const path = '/test/';
    const data = createData(path);
    stateStore.set(path, { status: StateStatus.LOADED, data });
    const result = await stateMachine.check(path);
    expect(result).toBe(true);
});

// ✅ Good: Clear AAA pattern
it('should do something', async () => {
    // Arrange
    const path = '/test/';
    const data = createData(path);
    stateStore.set(path, { status: StateStatus.LOADED, data });

    // Act
    const result = await stateMachine.check(path);

    // Assert
    expect(result).toBe(true);
});
```

### 2. Magic Numbers

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
it('should transition from NOT_LOADED to LOADING to LOADED when data is found in cache and server', async () => { ... });
```

### 4. Testing Implementation Details

```typescript
// ❌ Bad: Testing internal implementation
expect(stateMachine['privateMethod']).toHaveBeenCalled();

// ✅ Good: Testing public behavior
expect(stateStore.get(path)?.status).toBe(StateStatus.LOADED);
```

## Testing Templates

### State Transition Template

```typescript
>it('should go STATE_A > STATE_B > STATE_C when CONDITIONS', async () => {
    // Arrange: Set up initial state and mocks
    const itemPath = '/test/path/';
    mockStorageSuccess(mockData);
    mockApiSuccess(mockData);

    // Act: Trigger the transitions
    stateMachine.fetch(itemPath);

    // Assert: Verify intermediate state(s)
    expectStateStatus(itemPath, StateStatus.LOADING);

    // Wait: For async operations
    await vi.waitFor(
        () => {
            expectStateStatus(itemPath, StateStatus.LOADED);
        },
        { timeout: TEST_TIMEOUT },
    );

    // Assert: Verify final state and side effects
    expectApiCalledWithPath(itemPath);
    expect(mockStorage).toHaveBeenCalledWith(itemPath, mockData);
});
```

### Error Testing Template

```typescript
it('should throw ERROR_TYPE when INVALID_INPUT', () => {
    // Arrange: Set up invalid input
    const invalidInput = 'invalid-input';

    // Act & Assert: Verify error is thrown
    expect(() => {
        stateMachine.process(invalidInput);
    }).toThrow(`Expected error message: ${invalidInput}`);
});
```

### Async Error Testing Template

```typescript
it('should handle async error when CONDITION', async () => {
    // Arrange: Set up error condition
    const itemPath = '/test/path/';
    mockApiError(500, 'Server error');

    // Act: Trigger async operation
    stateMachine.fetch(itemPath);

    // Assert: Wait for error state
    await vi.waitFor(
        () => {
            expectStateStatus(itemPath, StateStatus.ERROR);
        },
        { timeout: TEST_TIMEOUT },
    );
});
```

### Edge Case Testing Template

```typescript
it('should do nothing when already in STATE', () => {
    // Arrange: Set up item in specific state
    const itemPath = '/test/path/';
    stateStore.set(itemPath, { status: StateStatus.LOADING });

    // Act: Attempt to trigger operation
    stateMachine.fetch(itemPath);

    // Assert: Verify no side effects
    expect(mockApi).not.toHaveBeenCalled();
    expect(mockStorage).not.toHaveBeenCalled();
    expectStateStatus(itemPath, StateStatus.LOADING);
});
```
