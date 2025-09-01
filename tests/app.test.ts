// DynamicServerApp.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DynamicServerApp } from "../core/app";

// Sample implementation to test
interface TestAppState {
  port: number;
  message: string;
}

class TestApp extends DynamicServerApp<TestAppState> {
  port = 1234;
  message = "initial";
  async sampleMethod() {
    return "method called";
  }
}

describe("DynamicServerApp", () => {
  let app: TestApp;

  beforeEach(() => {
    app = new TestApp();
    global.fetch = Object.assign(vi.fn(), { preconnect: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getState returns correct state", () => {
    const state = app.getState();
    expect(state).toMatchObject({ port: 1234, message: "initial" });
    expect("schema" in state).toBe(false);
  });

  it("applyStateUpdate updates state", () => {
    app.applyStateUpdate({ message: "updated" });
    expect(app.message).toBe("updated");
  });



  it("probe returns true if server responds with ok", async () => {
    (fetch as any).mockResolvedValue({ ok: true });
    const result = await app.probe();
    expect(result).toBe(true);
  });

  it("probe returns false if server errors or times out", async () => {
    (fetch as any).mockRejectedValue(new Error("fail"));
    const result = await app.probe();
    expect(result).toBe(false);
  });

  it("setState calls fetch with correct parameters", async () => {
    const body = { message: "new" };
    (fetch as any).mockResolvedValue({ ok: true, json: () => ({}) });
    await app.setState(body);
    expect(fetch).toHaveBeenCalledWith(`http://localhost:1234/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });

  it("applyStateUpdate accepts any keys without validation", () => {
    app.applyStateUpdate({ message: "hello", fakeKey: 42 } as any);
    expect(app.message).toBe("hello");
    expect((app as any).fakeKey).toBe(42);
  });

  it("applyStateUpdate accepts any type without validation", () => {
    // Without Zod, we don't validate types, just apply the update
    app.applyStateUpdate({ port: "oops" } as any);
    expect((app as any).port).toBe("oops");
  });



  it("probe times out if server does not respond", async () => {
    global.fetch = Object.assign(
      vi.fn(() => new Promise<Response>((_, reject) => setTimeout(() => reject(new DOMException()), 15))),
      { preconnect: vi.fn() }
    );
    const result = await app.probe(10);
    expect(result).toBe(false);
  });

  it("setState does not throw if fetch fails", async () => {
    global.fetch = Object.assign(
      vi.fn()
        .mockResolvedValueOnce({ ok: true }) // probe succeeds
        .mockRejectedValueOnce(new Error("network error")), // setState fails
      { preconnect: vi.fn() }
    );
    await expect(app.setState({ message: "fail" })).resolves.toBeUndefined();
  });

  it("getState includes inherited fields", () => {
    class InheritedApp extends TestApp {
      newProp = 42;
    }
    const extended = new InheritedApp();
    const state = extended.getState();
    expect(state).toMatchObject({ newProp: 42 });
  });

  it("getState includes getter values", () => {
    class GetterApp extends TestApp {
      get dynamicValue() {
        return 99;
      }
    }
    const getterApp = new GetterApp();
    const state = getterApp.getState();
    expect(state).toHaveProperty("dynamicValue", 99);
  });
});
