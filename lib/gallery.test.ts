import { describe, it, expect } from "vitest";
import { cleanPhotos, movePhoto, newPhotoId, skippedMessage, slotKey } from "./gallery";

const A = { id: "a", src: "/images/uploads/events/a-20261009-a1b2.jpg", caption: "  First  " };
const B = { id: "b", src: "/images/uploads/events/b-20261009-a1b2.jpg", caption: "" };
const C = { id: "c", src: "/images/uploads/events/c-20261009-a1b2.jpg", caption: "Third" };

describe("slotKey", () => {
  it("names a single-photo slot by item and field", () => {
    expect(slotKey("e1", "poster")).toBe("e1:poster");
  });
  it("adds the photo id for a gallery slot", () => {
    expect(slotKey("e1", "photos", "ph1-0")).toBe("e1:photos:ph1-0");
  });
});

describe("newPhotoId", () => {
  it("is unique per index within one pick", () => {
    expect(newPhotoId(1700, 0)).toBe("ph1700-0");
    expect(newPhotoId(1700, 1)).toBe("ph1700-1");
  });
});

describe("movePhoto", () => {
  it("swaps with the neighbor", () => {
    expect(movePhoto([A, B, C], 0, 1).map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(movePhoto([A, B, C], 2, -1).map((p) => p.id)).toEqual(["a", "c", "b"]);
  });
  it("does nothing past either end", () => {
    const list = [A, B];
    expect(movePhoto(list, 0, -1)).toBe(list);
    expect(movePhoto(list, 1, 1)).toBe(list);
  });
  it("does not mutate the input", () => {
    const list = [A, B];
    movePhoto(list, 0, 1);
    expect(list.map((p) => p.id)).toEqual(["a", "b"]);
  });
});

describe("cleanPhotos", () => {
  it("drops removed photos, strips editor flags, trims captions, keeps order", () => {
    const out = cleanPhotos([{ ...A }, { ...B, removed: true }, { ...C, removed: false }]);
    expect(out).toEqual([
      { id: "a", src: A.src, caption: "First" },
      { id: "c", src: C.src, caption: "Third" },
    ]);
  });
  it("drops a photo with no src (an upload that never finished)", () => {
    expect(cleanPhotos([{ ...A, src: "" }])).toEqual([]);
  });
});

describe("skippedMessage", () => {
  it("is empty when nothing was skipped", () => {
    expect(skippedMessage(0)).toBe("");
  });
  it("is singular for one file", () => {
    expect(skippedMessage(1)).toBe("1 file isn't a photo we can use. Try a JPG or PNG.");
  });
  it("is plural for several", () => {
    expect(skippedMessage(3)).toBe("3 files aren't photos we can use. Try a JPG or PNG.");
  });
});
