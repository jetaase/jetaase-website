import { describe, it, expect } from "vitest";
import { targetSize, clampCrop } from "./image";

describe("targetSize", () => {
  it("headshots are 600 square, never upscaled", () => {
    expect(targetSize("headshot", 2000, 2000)).toEqual({ width: 600, height: 600 });
    expect(targetSize("headshot", 400, 400)).toEqual({ width: 400, height: 400 });
  });
  it("photos cap the longest side at 1600, keeping aspect", () => {
    expect(targetSize("photo", 4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(targetSize("photo", 3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });
  it("photos smaller than the cap are unchanged", () => {
    expect(targetSize("photo", 800, 600)).toEqual({ width: 800, height: 600 });
  });
});

describe("clampCrop", () => {
  it("rounds fractional pixels", () => {
    expect(clampCrop({ x: 10.4, y: 20.6, width: 300.5, height: 300.5 }, 1000, 1000))
      .toEqual({ x: 10, y: 21, width: 301, height: 301 });
  });
  it("keeps the area inside the image", () => {
    expect(clampCrop({ x: -5, y: 900, width: 300, height: 300 }, 1000, 1000))
      .toEqual({ x: 0, y: 700, width: 300, height: 300 });
  });
  it("never returns an empty area", () => {
    expect(clampCrop({ x: 0, y: 0, width: 0, height: 0 }, 10, 10))
      .toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
  it("shrinks an oversized crop to the image", () => {
    expect(clampCrop({ x: 0, y: 0, width: 5000, height: 5000 }, 1000, 800))
      .toEqual({ x: 0, y: 0, width: 1000, height: 800 });
  });
});
