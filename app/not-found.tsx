import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFound from "@/components/NotFound";

export const metadata: Metadata = { title: "Page not found" };

// Unknown URLs. This renders outside the (site) layout, so it brings its own
// header and footer. notFound() inside a page uses app/(site)/not-found.tsx.
export default function RootNotFound() {
  return (
    <>
      <Header />
      <main>
        <NotFound />
      </main>
      <Footer />
    </>
  );
}
