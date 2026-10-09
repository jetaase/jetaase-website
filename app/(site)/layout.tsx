import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Every public page shares the header and footer. /admin sits outside this group.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
