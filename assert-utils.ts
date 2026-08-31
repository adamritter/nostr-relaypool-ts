// assert-utils.ts
import * as assert from "assert";

export function assertEqual(actual: any, expected: any, message?: string): void {
  assert.deepStrictEqual(actual, expected, message);
}

export function assertNotEqual(actual: any, expected: any, message?: string): void {
  assert.notDeepStrictEqual(actual, expected, message);
}

export function assertTrue(condition: any, message?: string): void {
  assert.ok(condition, message);
}

export function assertFalse(condition: any, message?: string): void {
  assert.ok(!condition, message);
}

export function assertDefined(value: any, message?: string): void {
  assert.notStrictEqual(value, undefined, message);
}

export function assertUndefined(value: any, message?: string): void {
  assert.strictEqual(value, undefined, message);
}

export function assertThrows(fn: Function, error?: Function | RegExp | string, message?: string): void {
  assert.throws(fn, error, message);
}

export function assertGreaterThanOrEqual(actual: number, expected: number, message?: string): void {
  assertTrue(actual >= expected, message || `Expected ${actual} to be greater than or equal to ${expected}`);
}

export function assertLessThan(actual: number, expected: number, message?: string): void {
  assertTrue(actual < expected, message || `Expected ${actual} to be less than ${expected}`);
}

// Custom mock function utility
export function createMock<T extends (...args: any[]) => any>(
  implementation?: T | ((...args: Parameters<T>) => ReturnType<T>),
): jest.Mock<ReturnType<T>, Parameters<T>> { // Keeping Jest's Mock type for compatibility
  const mockFn: any = function(...args: any[]) {
    mockFn.calls.push(args);
    if (implementation) {
      return (implementation as any)(...args);
    }
  };
  mockFn.calls = [];
  mockFn.mockImplementation = (newImpl: any) => { implementation = newImpl; };
  mockFn.mockReset = () => { mockFn.calls = []; implementation = undefined; };
  mockFn.toHaveBeenCalledWith = (...args: any[]) => {
    return mockFn.calls.some((call: any) => {
      // Basic deep equality check for arguments
      return JSON.stringify(call) === JSON.stringify(args);
    });
  };
  // Add other common Jest mock methods as needed
  return mockFn;
}

// Mocking for global fetch
(global as any).fetch = createMock(async (input: RequestInfo | URL) => {
  // Default mock behavior for fetch
  return new Response(JSON.stringify({ message: "Mocked fetch response" }), { status: 200 });
});

