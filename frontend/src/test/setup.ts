import { vi } from "vitest";

// Make @testing-library/dom treat Vitest fake timers like Jest fake timers.
// Its waitFor() uses a Jest-only codepath when fake timers are detected.
(globalThis as any).jest = (globalThis as any).jest ?? {
  advanceTimersByTime: (ms: number) => {
    try { vi.advanceTimersByTime(ms); } catch { /* real timers active, no-op */ }
  },
};

const originalUseFakeTimers = vi.useFakeTimers.bind(vi);
vi.useFakeTimers = ((...args: any[]) => {
  const res = originalUseFakeTimers();
  (setTimeout as any)._isMockFunction = true;
  return res;
}) as any;

const originalUseRealTimers = vi.useRealTimers.bind(vi);
vi.useRealTimers = ((...args: any[]) => {
  const res = originalUseRealTimers();
  try {
    delete (setTimeout as any)._isMockFunction;
  } catch {
    // ignore
  }
  return res;
}) as any;

// Simple localStorage mock for tests
const store = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    store.delete(key);
  }),
  clear: vi.fn(() => store.clear()),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Provide a default token so axios interceptor doesn't explode
(globalThis as any).process = (globalThis as any).process ?? { env: {} };
process.env.VITE_DEV_BEARER_TOKEN = process.env.VITE_DEV_BEARER_TOKEN ?? "test-token";
