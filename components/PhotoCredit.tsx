import styles from "./PhotoCredit.module.css";

// "Photo: Name / Unsplash" in the bottom-right corner of a photo.
// The photo's wrapper needs position: relative.
export default function PhotoCredit({ name, href }: { name: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.credit}>
      Photo: {name} / Unsplash
    </a>
  );
}
