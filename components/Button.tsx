import Link from "next/link";
import styles from "./Button.module.css";

export default function Button({
  href,
  variant = "solid",
  children,
}: {
  href: string;
  variant?: "solid" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${styles.btn} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
