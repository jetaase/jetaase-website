import { describe, it, expect, vi } from "vitest";
import { buildPutBody, getFileSha, commitFile } from "./github";

describe("buildPutBody", () => {
  it("base64-encodes content and omits sha when absent", () => {
    const body = buildPutBody({ contentUtf8: "hi", message: "m", branch: "main" });
    expect(body).toEqual({
      message: "m", branch: "main",
      content: Buffer.from("hi", "utf8").toString("base64"),
    });
    expect("sha" in body).toBe(false);
  });
  it("includes sha when provided", () => {
    const body = buildPutBody({ contentUtf8: "hi", message: "m", branch: "main", sha: "abc" });
    expect((body as any).sha).toBe("abc");
  });
});

describe("getFileSha", () => {
  const args = { owner: "o", repo: "r", path: "content/board.json", branch: "main", token: "t" };
  it("returns sha on 200", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 200, ok: true, json: async () => ({ sha: "SHA1" }) });
    expect(await getFileSha(fetchImpl, args)).toBe("SHA1");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/repos/o/r/contents/content/board.json?ref=main",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer t" }) }),
    );
  });
  it("returns null on 404", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 404, ok: false, json: async () => ({}) });
    expect(await getFileSha(fetchImpl, args)).toBeNull();
  });
});

describe("commitFile", () => {
  it("fetches sha then PUTs with it and returns commit url", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ sha: "OLD" }) })
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ commit: { html_url: "https://github.com/commit/1" } }) });
    const out = await commitFile(fetchImpl, {
      owner: "o", repo: "r", path: "content/board.json", branch: "main",
      token: "t", contentUtf8: "[]", message: "update",
    });
    expect(out.commitUrl).toBe("https://github.com/commit/1");
    const putCall = fetchImpl.mock.calls[1];
    expect(putCall[1].method).toBe("PUT");
    expect(JSON.parse(putCall[1].body).sha).toBe("OLD");
  });
});
