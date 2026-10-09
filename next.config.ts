import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only our own images under /images/ may be resized by next/image.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    qualities: [75], // required list in Next 16
  },
  // The old Squarespace blog was only used for election posts.
  async redirects() {
    return [
      { source: "/blog", destination: "/who-we-are#elections", permanent: true },
      { source: "/blog/:path*", destination: "/who-we-are#elections", permanent: true },
    ];
  },
};

export default nextConfig;
