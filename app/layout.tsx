import type { Metadata } from "next";
import { serif, body, mono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
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
