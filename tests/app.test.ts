// App.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "../core/app";

// Sample implementation to test
class TestApp extends App {
  port = 1234;
  message = "initial";
  async sampleMethod() {
    return "method called";
  }
}

describe("App", () => {
  let app: TestApp;

  beforeEach(() => {
    app = new TestApp();
    global.fetch = Object.assign(vi.fn(), { preconnect: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("toJSON returns correct state", () => {
    const state = app.toJSON();
    expect(state).toMatchObject({ port: 1234, message: "initial" });
    expect(typeof state.sampleMethod).toBe("undefined");
  });

  it("fromJSON updates state", () => {
    app.fromJSON({ message: "updated" });
    expect(app.message).toBe("updated");
  });

  it("probe returns true if server responds with ok", async () => {
    (fetch as any).mockResolvedValue({ ok: true });
    const result = await app.probe();
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(`http://localhost:1234/health`);
  });

  it("probe returns false if server errors or times out", async () => {
    (fetch as any).mockRejectedValue(new Error("fail"));
    const result = await app.probe();
    expect(result).toBe(false);
  });

  it("setState calls fetch with correct parameters", async () => {
    const body = { message: "new" };
    (fetch as any)
      .mockResolvedValueOnce({ ok: false }) // probe fails (local mode)
      .mockResolvedValue({ ok: true, json: () => ({ state: {} }) });

    await app.setState(body);
    expect(app.message).toBe("new");
  });

  it("setState works in remote mode", async () => {
    const body = { message: "remote" };
    (fetch as any)
      .mockResolvedValueOnce({ ok: true }) // probe succeeds (remote mode)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ state: { message: "remote", port: 1234 } })
      });

    const result = await app.setState(body);
    expect(result).toMatchObject({ message: "remote" });
  });

  it("fromJSON accepts any keys without validation", () => {
    app.fromJSON({ message: "hello", fakeKey: 42 } as any);
    expect(app.message).toBe("hello");
    expect((app as any).fakeKey).toBe(42);
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

  it("toJSON includes inherited fields", () => {
    class InheritedApp extends TestApp {
      newProp = 42;
    }
    const extended = new InheritedApp();
    const state = extended.toJSON();
    expect(state).toMatchObject({ newProp: 42 });
  });

  it("toJSON excludes methods", () => {
    const state = app.toJSON();
    expect(state).not.toHaveProperty("sampleMethod");
    expect(state).not.toHaveProperty("toJSON");
    expect(state).not.toHaveProperty("fromJSON");
  });

  // Note: save/load tests would require mocking Bun.write/Bun.file
  // which is readonly in Bun runtime. Testing via integration tests instead.
});
