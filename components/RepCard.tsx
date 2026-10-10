import Image from "next/image";
import EmailLink from "./EmailLink";
import { headshotSrc } from "@/lib/uploads";
import styles from "./RepCard.module.css";

// A subchapter rep (or an open rep spot): headshot beside label, name, city,
// placement and email. Boxed on Who We Are; a plain row inside Subchapters cards.
export default function RepCard({
  photo,
  name,
  label,
  city,
  placement,
  email,
  action,
  boxed,
}: {
  photo?: string;
  name: string;
  label?: string; // small red caps above the name, e.g. the state
  city?: string;
  placement?: string;
  email?: string;
  action?: React.ReactNode; // shown in place of the email, e.g. for an open spot
  boxed?: boolean;
}) {
  return (
    <div className={`${styles.rep} ${boxed ? styles.boxed : ""}`}>
      <Image src={headshotSrc(photo)} alt={photo ? name : ""} width={88} height={88} className={styles.avatar} />
      <div>
        {label && <div className={styles.label}>{label}</div>}
        <div className={styles.name}>{name}</div>
        {city && <div className={styles.city}>{city} area</div>}
        {placement && <div className={styles.placement}>{placement}</div>}
        {email && <EmailLink email={email} className={styles.email} />}
        {action && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  );
}
