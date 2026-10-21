import React from 'react';
import { Sparkles, ArrowDown } from 'lucide-react';
import styles from './GiveawayHero.module.css';

interface GiveawayHeroProps {
  title?: string;
  onScrollToPrizes?: () => void;
}

export const GiveawayHero: React.FC<GiveawayHeroProps> = ({
  title = 'October Mega Reward Rush',
  onScrollToPrizes,
}) => {
  const handleScroll = () => {
    if (onScrollToPrizes) {
      onScrollToPrizes();
    } else {
      const el = document.getElementById('prizes-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className={styles.heroSection}>
      <div className={styles.glowBg} aria-hidden="true" />
      <div className={styles.content}>
        {/* Badge */}
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          <span className={styles.liveText}>LIVE NOW · {title.toUpperCase()}</span>
          <Sparkles size={14} className={styles.sparkleIcon} />
        </div>

        {/* Heading */}
        <h1 className={styles.heroHeading}>
          <span>Turn your VELOOP balance</span>
          <span className={styles.gradientLine}>into real prizes.</span>
        </h1>

        {/* Subtext */}
        <p className={styles.subtext}>
          Choose your favorite reward, join with VES, SVES or Tokens, and enter provably fair random draws. Every entry fee is permanently recorded on-chain.
        </p>

        {/* Action button */}
        <button onClick={handleScroll} className={styles.ctaButton} aria-label="See the prizes">
          <span>See the prizes</span>
          <ArrowDown size={18} className={styles.arrowIcon} />
        </button>
      </div>
    </section>
  );
};

export default GiveawayHero;
