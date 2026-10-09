import Link from "next/link";
import styles from "./Button.module.css";

type Props = {
  href: string;
  variant?: "solid" | "dark" | "navy" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string; // layout only (margins, width); the look comes from variant and size
  children: React.ReactNode;
};

// Pill-shaped link. Site pages go through next/link; outside links open in a
// new tab; mailto: and other schemes are plain links.
export default function Button({ href, variant = "solid", size = "md", className, children }: Props) {
  const cls = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(" ");
  if (href.startsWith("/") || href.startsWith("#")) {
    return <Link href={href} className={cls}>{children}</Link>;
  }
  const external = /^https?:/.test(href);
  return (
    <a href={href} className={cls} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
      {children}
    </a>
  );
}
