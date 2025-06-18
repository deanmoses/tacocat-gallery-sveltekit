# State Machine Testing Guide

Testing patterns for state machines. For general testing best practices, see [Testing Guide](./testing.md).

## Testing State Transitions

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

## Edge Case Testing

### Testing Invalid State Transitions

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

### Testing State Persistence

Verify that state persists correctly across operations:

```typescript
it('should maintain state data when transitioning between states', () => {
    // Arrange: Set up state with data
    const itemPath = '/test/path/';
    const testData = { id: 1, name: 'test' };
    stateStore.set(itemPath, { status: StateStatus.LOADED, data: testData });

    // Act: Trigger state transition that should preserve data
    stateMachine.refresh(itemPath);

    // Assert: Verify data is preserved
    expectStateStatus(itemPath, StateStatus.LOADING);
    expect(stateStore.get(itemPath)?.data).toEqual(testData);
});
```

## State Machine Templates

### State Transition Template

```typescript
it('should go STATE_A > STATE_B > STATE_C when CONDITIONS', async () => {
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

### State Machine Error Template

```typescript
it('should transition to ERROR state when API fails', async () => {
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

### State Machine Edge Case Template

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
