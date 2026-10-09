import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only our own images under /images/ may be resized by next/image.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    qualities: [75], // required list in Next 16
  },
};

export default nextConfig;
