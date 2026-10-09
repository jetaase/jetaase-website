import { describe, it, expect } from "vitest";
import {
  UPLOAD_FOLDERS, MAX_UPLOAD_BYTES, isUploadFolder, isJpeg, slugify,
  uploadPath, isUploadPath, toPublicUrl, toRepoPath, headshotSrc, DEFAULT_HEADSHOT,
} from "./uploads";
import { gitBlobSha } from "./git-sha";

describe("upload folders and limits", () => {
  it("allows only board, reps, events", () => {
    expect(UPLOAD_FOLDERS).toEqual(["board", "reps", "events"]);
    expect(isUploadFolder("board")).toBe(true);
    expect(isUploadFolder("../content")).toBe(false);
    expect(isUploadFolder(undefined)).toBe(false);
  });
  it("caps uploads at 3 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(3 * 1024 * 1024);
  });
});

describe("isJpeg", () => {
  it("accepts JPEG magic bytes", () => {
    expect(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe(true);
  });
  it("rejects PNG, empty, and short input", () => {
    expect(isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(isJpeg(new Uint8Array([]))).toBe(false);
    expect(isJpeg(new Uint8Array([0xff, 0xd8]))).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Collin  Zeigler")).toBe("collin-zeigler");
  });
  it("strips diacritics", () => {
    expect(slugify("Ōno Ryū")).toBe("ono-ryu");
  });
  it("falls back to photo when nothing usable remains", () => {
    expect(slugify("渡辺")).toBe("photo");
    expect(slugify("")).toBe("photo");
    expect(slugify("../../etc")).toBe("etc");
  });
  it("limits length to 40 chars", () => {
    expect(slugify("a".repeat(80)).length).toBe(40);
  });
});

describe("uploadPath / isUploadPath", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  it("builds a server-chosen path", () => {
    expect(uploadPath("board", "Collin Zeigler", now, "a1b2"))
      .toBe("public/images/uploads/board/collin-zeigler-20261008-a1b2.jpg");
  });
  it("validates exact upload paths only", () => {
    expect(isUploadPath("public/images/uploads/reps/x-20261008-a1b2.jpg")).toBe(true);
    expect(isUploadPath("public/images/uploads/events/photo-20261008-ffff.jpg")).toBe(true);
    expect(isUploadPath("public/images/uploads/events/photo-20261008-0a1b2c3d.jpg")).toBe(true);
    expect(isUploadPath("public/images/uploads/events/photo-20261008-0a1b2c.jpg")).toBe(false);
    expect(isUploadPath("public/images/board-placeholder.png")).toBe(false);
    expect(isUploadPath("public/images/uploads/other/x-20261008-a1b2.jpg")).toBe(false);
    expect(isUploadPath("public/images/uploads/board/../../content/board.json")).toBe(false);
    expect(isUploadPath("content/board.json")).toBe(false);
  });
});

describe("public/repo path mapping", () => {
  it("round-trips", () => {
    const repo = "public/images/uploads/board/x-20261008-a1b2.jpg";
    expect(toPublicUrl(repo)).toBe("/images/uploads/board/x-20261008-a1b2.jpg");
    expect(toRepoPath(toPublicUrl(repo))).toBe(repo);
  });
});

describe("gitBlobSha", () => {
  it("matches git's blob hashing", () => {
    // `printf 'hello\n' | git hash-object --stdin`
    expect(gitBlobSha("hello\n")).toBe("ce013625030ba8dba906f756967f9e9ca394464a");
    // `git hash-object /dev/null`
    expect(gitBlobSha("")).toBe("e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  });
  it("hashes bytes the same as the equivalent string", () => {
    expect(gitBlobSha(new TextEncoder().encode("hello\n"))).toBe(gitBlobSha("hello\n"));
  });
});

describe("headshotSrc", () => {
  it("shows the default headshot when there's no photo", () => {
    expect(headshotSrc("")).toBe(DEFAULT_HEADSHOT);
    expect(headshotSrc(undefined)).toBe(DEFAULT_HEADSHOT);
    expect(DEFAULT_HEADSHOT).toBe("/images/board-placeholder.png");
  });
  it("keeps a real photo", () => {
    expect(headshotSrc("/images/board/lindsay-jenkins.jpg")).toBe("/images/board/lindsay-jenkins.jpg");
  });
});
