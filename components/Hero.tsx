import Image from "next/image";
import Eyebrow from "./Eyebrow";
import PhotoCredit from "./PhotoCredit";
import styles from "./Hero.module.css";

type HeroImage = { src: string; alt: string; credit?: { name: string; href: string } };

// Page title block. With an image, the photo sits to the right (below on phones).
export default function Hero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  image?: HeroImage;
}) {
  const copy = (
    <div>
      {eyebrow && <Eyebrow size="hero">{eyebrow}</Eyebrow>}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
  return (
    <section className={styles.hero}>
      {image ? (
        <div className={styles.withImage}>
          {copy}
          <div className={styles.imageWrap}>
            <Image src={image.src} alt={image.alt} fill preload sizes="(max-width: 768px) 100vw, 420px" className={styles.image} />
            {image.credit && <PhotoCredit {...image.credit} />}
          </div>
        </div>
      ) : (
        copy
      )}
    </section>
  );
}
