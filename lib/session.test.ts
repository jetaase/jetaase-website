import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "./session";

const SECRET = "test-secret";

describe("session tokens", () => {
  it("verifies a freshly signed token", () => {
    const t = signSession(SECRET, 60_000);
    expect(verifySession(SECRET, t)).toBe(true);
  });
  it("rejects a token signed with a different secret", () => {
    const t = signSession(SECRET, 60_000);
    expect(verifySession("other-secret", t)).toBe(false);
  });
  it("rejects a tampered token", () => {
    const t = signSession(SECRET, 60_000);
    const [exp] = t.split(".");
    expect(verifySession(SECRET, `${exp}.deadbeef`)).toBe(false);
  });
  it("rejects an expired token", () => {
    const t = signSession(SECRET, -1_000); // already expired
    expect(verifySession(SECRET, t)).toBe(false);
  });
  it("rejects undefined/garbage", () => {
    expect(verifySession(SECRET, undefined)).toBe(false);
    expect(verifySession(SECRET, "nonsense")).toBe(false);
  });
});
