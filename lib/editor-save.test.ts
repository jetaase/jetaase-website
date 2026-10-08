import { describe, it, expect } from "vitest";
import { buildSavePayload, uploadErrorMessage, saveErrorMessage, type PendingPhoto } from "./editor-save";

const blob = new Blob(["x"]);
const up = (path: string, sha: string): PendingPhoto =>
  ({ status: "uploaded", previewUrl: "blob:1", jpeg: blob, upload: { path, sha } });

describe("buildSavePayload", () => {
  const base = { "content/board.json": "B0" };

  it("serializes items with renumbered order and includes uploads", () => {
    const items = [
      { id: "m2", name: "B", photo: "/images/uploads/board/b-20261008-a1b2.jpg", order: 9 },
      { id: "m1", name: "A", photo: "/images/board-placeholder.png", order: 1 },
    ];
    const p = buildSavePayload({
      path: "content/board.json", message: "msg", items, base, deletes: [],
      pending: { m2: up("public/images/uploads/board/b-20261008-a1b2.jpg", "S1") },
    });
    expect(JSON.parse(p.files[0].content).map((i: { order: number }) => i.order)).toEqual([1, 2]);
    expect(p.files[0].content.endsWith("\n")).toBe(true);
    expect(p.uploads).toEqual([{ path: "public/images/uploads/board/b-20261008-a1b2.jpg", sha: "S1" }]);
    expect(p.base).toEqual(base);
    expect(p.message).toBe("msg");
  });

  it("drops an upload that was replaced or removed before saving", () => {
    const items = [{ id: "m1", photo: "/images/board-placeholder.png", order: 1 }];
    const p = buildSavePayload({
      path: "content/board.json", message: "m", items, base, deletes: [],
      pending: { m1: up("public/images/uploads/board/a-20261008-a1b2.jpg", "S1") },
    });
    expect(p.uploads).toEqual([]);
  });

  it("passes through deletes, which the server re-checks", () => {
    const p = buildSavePayload({
      path: "content/board.json", message: "m", items: [], base, pending: {},
      deletes: ["public/images/uploads/board/old-20261001-ffff.jpg"],
    });
    expect(p.deletes).toEqual(["public/images/uploads/board/old-20261001-ffff.jpg"]);
  });

  it("refuses to build while an upload is running or failed", () => {
    for (const status of ["uploading", "failed"] as const) {
      expect(() => buildSavePayload({
        path: "content/board.json", message: "m", items: [], base, deletes: [],
        pending: { m1: { status, previewUrl: "blob:1", jpeg: blob } },
      })).toThrow("uploads in progress");
    }
  });
});

describe("uploadErrorMessage", () => {
  it("uses the standard copy for network failures", () => {
    expect(uploadErrorMessage(null)).toBe("Upload failed — try again");
  });
  it("explains an expired login", () => {
    expect(uploadErrorMessage(401, "unauthorized")).toBe("Your login expired. Sign in again in a new tab, then retry.");
  });
  it("shows the server's message for other errors", () => {
    expect(uploadErrorMessage(400, "photo too large")).toBe("photo too large");
  });
  it("falls back to the standard copy when the server gives none", () => {
    expect(uploadErrorMessage(500)).toBe("Upload failed — try again");
  });
});

describe("saveErrorMessage", () => {
  it("explains an expired login", () => {
    expect(saveErrorMessage(401, "unauthorized")).toBe("Your login expired. Sign in again in a new tab, then click Save again.");
  });
  it("shows the server's message for other errors", () => {
    expect(saveErrorMessage(409, "Someone else saved changes")).toBe("Someone else saved changes");
  });
  it("falls back to generic copy when the response had no message", () => {
    expect(saveErrorMessage(504)).toBe("Save failed — try again");
    expect(saveErrorMessage(null)).toBe("Save failed — try again");
  });
});
