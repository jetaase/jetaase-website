import { describe, it, expect, vi } from "vitest";
import { handleUpload, handleSave, CONFLICT_MESSAGE } from "./admin-api";
import { gitBlobSha } from "./git-sha";

const repo = { owner: "o", repo: "r", branch: "main", token: "SECRET_TOKEN" };
const ok = (body: unknown, status = 200) => ({ status, ok: status < 300, json: async () => body });
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
const deps = (fetchImpl: typeof fetch, authed = true) => ({
  fetchImpl, repo, authed, now: () => new Date("2026-10-08T00:00:00Z"), rand: () => "a1b2",
});

describe("handleUpload", () => {
  it("401 without a session, before touching GitHub", async () => {
    const f = vi.fn();
    expect((await handleUpload(deps(f, false), {})).status).toBe(401);
    expect(f).not.toHaveBeenCalled();
  });
  it("400 for a bad folder", async () => {
    const r = await handleUpload(deps(vi.fn()), { folder: "../x", nameHint: "a", dataBase64: JPEG });
    expect(r.status).toBe(400);
  });
  it("400 for non-JPEG data", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64");
    const r = await handleUpload(deps(vi.fn()), { folder: "board", nameHint: "a", dataBase64: png });
    expect(r.status).toBe(400);
  });
  it("400 for oversized data", async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(3 * 1024 * 1024)]).toString("base64");
    const r = await handleUpload(deps(vi.fn()), { folder: "board", nameHint: "a", dataBase64: big });
    expect(r.status).toBe(400);
  });
  it("creates a blob at a server-chosen path", async () => {
    const f = vi.fn().mockResolvedValue(ok({ sha: "BLOB1" }, 201));
    const r = await handleUpload(deps(f), { folder: "reps", nameHint: "Oscar Garcia", dataBase64: JPEG });
    expect(r).toEqual({
      status: 200,
      body: { path: "public/images/uploads/reps/oscar-garcia-20261008-a1b2.jpg", sha: "BLOB1" },
    });
  });
  it("never leaks the token in errors", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom SECRET_TOKEN"));
    const r = await handleUpload(deps(f), { folder: "board", nameHint: "a", dataBase64: JPEG });
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.body)).not.toContain("SECRET_TOKEN");
  });
});

// A fake GitHub for save: head HEAD1, files keyed by path.
function fakeGitHub(files: Record<string, string>, opts: { failFastForward?: number } = {}) {
  let ffFailures = opts.failFastForward ?? 0;
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.endsWith("/git/ref/heads/main")) return ok({ object: { sha: "HEAD1" } });
    const m = url.match(/\/contents\/(.+)\?ref=/);
    if (m) {
      const text = files[m[1]];
      return text === undefined ? ok({}, 404) : ok({ sha: gitBlobSha(text), content: Buffer.from(text).toString("base64") });
    }
    if (url.includes("/git/commits/HEAD1")) return ok({ tree: { sha: "T0" } });
    if (url.endsWith("/git/trees")) return ok({ sha: "T1" }, 201);
    if (url.endsWith("/git/commits")) return ok({ sha: "C2", html_url: "https://gh/c2" }, 201);
    if (url.endsWith("/git/refs/heads/main")) {
      if (ffFailures > 0) { ffFailures--; return ok({}, 422); }
      return ok({});
    }
    throw new Error(`unexpected ${url}`);
  });
  return { f: f as unknown as typeof fetch, calls };
}
const treeOf = (calls: { url: string; init?: RequestInit }[]) =>
  JSON.parse(calls.find((c) => c.url.endsWith("/git/trees"))!.init!.body as string).tree;

const OLD = "public/images/uploads/board/old-20261001-ffff.jpg";
const NEW = "public/images/uploads/board/new-20261008-a1b2.jpg";
const OLD_URL = "/images/uploads/board/old-20261001-ffff.jpg";
const NEW_URL = "/images/uploads/board/new-20261008-a1b2.jpg";
const board = (photo: string) => JSON.stringify([{ id: "m1", photo }], null, 2) + "\n";
const reps = (photo: string) => JSON.stringify([{ id: "r1", photo }], null, 2) + "\n";

describe("handleSave", () => {
  it("401 without a session", async () => {
    expect((await handleSave(deps(vi.fn(), false), {})).status).toBe(401);
  });
  it("400 for a malformed body", async () => {
    const { f } = fakeGitHub({});
    expect((await handleSave(deps(f), { files: "nope" })).status).toBe(400);
  });
  it("403 for a non-editable content path", async () => {
    const { f } = fakeGitHub({});
    const r = await handleSave(deps(f), {
      files: [{ path: "README.md", content: "x" }], uploads: [], deletes: [], base: {}, message: "m",
    });
    expect(r.status).toBe(403);
  });
  it("403 for an upload or delete outside uploads/", async () => {
    const { f } = fakeGitHub({});
    const bad1 = await handleSave(deps(f), {
      files: [], uploads: [{ path: "public/images/board-placeholder.png", sha: "x" }], deletes: [], base: {}, message: "m",
    });
    const bad2 = await handleSave(deps(f), {
      files: [], uploads: [], deletes: ["content/board.json"], base: {}, message: "m",
    });
    expect(bad1.status).toBe(403);
    expect(bad2.status).toBe(403);
  });
  it("409 when the file changed since it was loaded", async () => {
    const { f } = fakeGitHub({ "content/board.json": board(OLD_URL) });
    const r = await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: board(NEW_URL) }], uploads: [], deletes: [],
      base: { "content/board.json": "stale-sha" }, message: "m",
    });
    expect(r).toEqual({ status: 409, body: { error: CONFLICT_MESSAGE } });
  });
  it("commits content, uploads, and an unreferenced delete in one tree", async () => {
    const current = board(OLD_URL);
    const { f, calls } = fakeGitHub({
      "content/board.json": current, "content/subchapter-reps.json": reps("/images/x.jpg"), [OLD]: "jpegbytes",
    });
    const next = board(NEW_URL);
    const r = await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: next }],
      uploads: [{ path: NEW, sha: "BLOB1" }], deletes: [OLD],
      base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ commitUrl: "https://gh/c2", blobShas: { "content/board.json": gitBlobSha(next) } });
    expect(treeOf(calls)).toEqual([
      { path: "content/board.json", mode: "100644", type: "blob", content: next },
      { path: NEW, mode: "100644", type: "blob", sha: "BLOB1" },
      { path: OLD, mode: "100644", type: "blob", sha: null },
    ]);
  });
  it("skips a delete that another content file still references", async () => {
    const current = board(OLD_URL);
    const { f, calls } = fakeGitHub({
      "content/board.json": current,
      "content/subchapter-reps.json": reps(OLD_URL),
      [OLD]: "jpegbytes",
    });
    const r = await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: board("/images/board-placeholder.png") }],
      uploads: [], deletes: [OLD], base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(r.status).toBe(200);
    expect(treeOf(calls).some((e: { path: string }) => e.path === OLD)).toBe(false);
  });
  it("skips a delete that the incoming content still references", async () => {
    const current = board(OLD_URL);
    const { f, calls } = fakeGitHub({ "content/board.json": current, "content/subchapter-reps.json": "[]\n", [OLD]: "x" });
    await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: current }],
      uploads: [], deletes: [OLD], base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(treeOf(calls).some((e: { path: string }) => e.path === OLD)).toBe(false);
  });
  it("skips a delete for a file that no longer exists", async () => {
    const current = board("/images/board-placeholder.png");
    const { f, calls } = fakeGitHub({ "content/board.json": current, "content/subchapter-reps.json": "[]\n" });
    await handleSave(deps(f), {
      files: [{ path: "content/board.json", content: current }],
      uploads: [], deletes: [OLD], base: { "content/board.json": gitBlobSha(current) }, message: "m",
    });
    expect(treeOf(calls).some((e: { path: string }) => e.path === OLD)).toBe(false);
  });
  it("retries once on a non-fast-forward, then reports a conflict", async () => {
    const current = board(OLD_URL);
    const files = { "content/board.json": current, "content/subchapter-reps.json": "[]\n" };
    const body = {
      files: [{ path: "content/board.json", content: board(NEW_URL) }], uploads: [], deletes: [],
      base: { "content/board.json": gitBlobSha(current) }, message: "m",
    };
    const once = fakeGitHub(files, { failFastForward: 1 });
    expect((await handleSave(deps(once.f), body)).status).toBe(200);
    const twice = fakeGitHub(files, { failFastForward: 2 });
    expect((await handleSave(deps(twice.f), body)).status).toBe(409);
  });
  it("never leaks the token in errors", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom SECRET_TOKEN"));
    const r = await handleSave(deps(f as unknown as typeof fetch), {
      files: [], uploads: [], deletes: [], base: {}, message: "m",
    });
    expect(r.status).toBe(500);
    expect(JSON.stringify(r.body)).not.toContain("SECRET_TOKEN");
  });
  it("deletes a removed gallery photo but keeps one events.json still uses", async () => {
    const KEEP = "public/images/uploads/events/keep-20261009-a1b2.jpg";
    const GONE = "public/images/uploads/events/gone-20261009-a1b2.jpg";
    const events = (srcs: string[]) => JSON.stringify([{
      id: "e1", photos: srcs.map((s, i) => ({ id: `p${i}`, src: s.replace(/^public/, ""), caption: "" })),
    }], null, 2) + "\n";
    const current = events([KEEP, GONE]);
    const { f, calls } = fakeGitHub({ "content/events.json": current, [KEEP]: "x", [GONE]: "y" });
    const r = await handleSave(deps(f), {
      files: [{ path: "content/events.json", content: events([KEEP]) }],
      uploads: [], deletes: [KEEP, GONE],
      base: { "content/events.json": gitBlobSha(current) }, message: "m",
    });
    expect(r.status).toBe(200);
    const paths = treeOf(calls).filter((e: { sha?: null }) => e.sha === null).map((e: { path: string }) => e.path);
    expect(paths).toEqual([GONE]);
  });
});
