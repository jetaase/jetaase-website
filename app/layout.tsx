import type { Metadata } from "next";
import { serif, body, mono } from "./fonts";
import "./globals.css";

// Absolute base for Open Graph image URLs. Vercel sets this on every deploy.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JETAASE Southeast",
  description:
    "Japan Exchange and Teaching Alumni Association, Southeast US — AL, GA, NC, SC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
