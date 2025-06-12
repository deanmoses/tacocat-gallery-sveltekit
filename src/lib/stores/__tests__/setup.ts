// This file will be run before each test file
import { vi, beforeEach } from 'vitest';

// Mock fetch globally
(global as any).fetch = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
}); 