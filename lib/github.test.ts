import { describe, it, expect, vi } from "vitest";
import { createBlob, getHeadSha, getFileAt, commitTree, updateRef } from "./github";

const R = { owner: "o", repo: "r", branch: "main", token: "t" };
const json = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body });

describe("createBlob", () => {
  it("posts base64 content and returns the sha", async () => {
    const f = vi.fn().mockResolvedValue(json(201, { sha: "BLOB1" }));
    expect(await createBlob(f, R, "AAEC")).toBe("BLOB1");
    expect(f).toHaveBeenCalledWith(
      "https://api.github.com/repos/o/r/git/blobs",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "AAEC", encoding: "base64" }) }),
    );
  });
  it("throws on failure", async () => {
    const f = vi.fn().mockResolvedValue(json(500, {}));
    await expect(createBlob(f, R, "AAEC")).rejects.toThrow("createBlob failed: 500");
  });
});

describe("getHeadSha", () => {
  it("reads the branch ref", async () => {
    const f = vi.fn().mockResolvedValue(json(200, { object: { sha: "HEAD1" } }));
    expect(await getHeadSha(f, R)).toBe("HEAD1");
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/git/ref/heads/main");
  });
});

describe("getFileAt", () => {
  it("returns sha and decoded text", async () => {
    const f = vi.fn().mockResolvedValue(json(200, { sha: "S", content: Buffer.from("[1]\n").toString("base64") }));
    expect(await getFileAt(f, R, "content/board.json", "HEAD1")).toEqual({ sha: "S", text: "[1]\n" });
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/contents/content/board.json?ref=HEAD1");
  });
  it("returns null on 404", async () => {
    const f = vi.fn().mockResolvedValue(json(404, {}));
    expect(await getFileAt(f, R, "x", "HEAD1")).toBeNull();
  });
  it("throws on other errors", async () => {
    const f = vi.fn().mockResolvedValue(json(403, {}));
    await expect(getFileAt(f, R, "x", "HEAD1")).rejects.toThrow("getFileAt failed: 403");
  });
});

describe("commitTree", () => {
  it("builds a tree on the parent's tree and creates a commit", async () => {
    const f = vi.fn()
      .mockResolvedValueOnce(json(200, { tree: { sha: "BASETREE" } }))
      .mockResolvedValueOnce(json(201, { sha: "NEWTREE" }))
      .mockResolvedValueOnce(json(201, { sha: "C2", html_url: "u" }));
    const out = await commitTree(f, R, {
      parent: "C1",
      message: "m",
      entries: [
        { path: "content/board.json", content: "[]\n" },
        { path: "public/images/uploads/board/a-20261008-a1b2.jpg", sha: "BLOB1" },
        { path: "public/images/uploads/board/old-20261001-ffff.jpg", sha: null },
      ],
    });
    expect(out).toEqual({ sha: "C2", commitUrl: "u" });
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/git/commits/C1");
    const treeBody = JSON.parse(f.mock.calls[1][1].body);
    expect(treeBody).toEqual({
      base_tree: "BASETREE",
      tree: [
        { path: "content/board.json", mode: "100644", type: "blob", content: "[]\n" },
        { path: "public/images/uploads/board/a-20261008-a1b2.jpg", mode: "100644", type: "blob", sha: "BLOB1" },
        { path: "public/images/uploads/board/old-20261001-ffff.jpg", mode: "100644", type: "blob", sha: null },
      ],
    });
    expect(JSON.parse(f.mock.calls[2][1].body)).toEqual({ message: "m", tree: "NEWTREE", parents: ["C1"] });
  });
});

describe("updateRef", () => {
  it("fast-forwards without force", async () => {
    const f = vi.fn().mockResolvedValue(json(200, {}));
    expect(await updateRef(f, R, "C2")).toBe("ok");
    expect(f.mock.calls[0][0]).toBe("https://api.github.com/repos/o/r/git/refs/heads/main");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ sha: "C2", force: false });
  });
  it("reports a non-fast-forward on 422", async () => {
    const f = vi.fn().mockResolvedValue(json(422, { message: "Update is not a fast forward" }));
    expect(await updateRef(f, R, "C2")).toBe("not-fast-forward");
  });
  it("throws on other errors", async () => {
    const f = vi.fn().mockResolvedValue(json(500, {}));
    await expect(updateRef(f, R, "C2")).rejects.toThrow("updateRef failed: 500");
  });
});
