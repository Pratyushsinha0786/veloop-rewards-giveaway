import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, CheckCircle2, ChevronRight, Tag } from 'lucide-react';
import styles from './PrizeCard.module.css';

export interface PrizeItem {
  _id: string;
  name: string;
  slug: string;
  position: string;
  prizeType: 'PHYSICAL' | 'GIFT_CARD' | 'DIGITAL';
  winnerCount: number;
  requiredCurrency: 'VES' | 'SVES' | 'Tokens';
  entryFee: number;
  image: string;
  description: string;
  isActive: boolean;
}

interface PrizeCardProps {
  prize: PrizeItem;
  isUserEntry?: boolean;
}

export const PrizeCard: React.FC<PrizeCardProps> = ({ prize, isUserEntry = false }) => {
  return (
    <Link to={`/giveaway/${prize.slug}`} className={styles.cardLink}>
      <article className={`${styles.card} ${isUserEntry ? styles.cardEntered : ''}`}>
        {/* Image Container with Badges */}
        <div className={styles.imageContainer}>
          <img src={prize.image} alt={prize.name} className={styles.prizeImage} loading="lazy" />

          {/* Position tag top-left */}
          <div className={styles.positionTag}>
            <Trophy size={13} className={styles.positionIcon} />
            <span>{prize.position}</span>
          </div>

          {/* "Your entry" green tag top-right if entered */}
          {isUserEntry && (
            <div className={styles.enteredTag}>
              <CheckCircle2 size={13} />
              <span>Your entry</span>
            </div>
          )}

          {/* Winner count badge at bottom of image */}
          <div className={styles.winnerCountTag}>
            <span>
              {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.body}>
          <h3 className={styles.prizeName}>{prize.name}</h3>
          <p className={styles.prizeDesc}>{prize.description}</p>

          {/* Entry Fee Row */}
          <div className={styles.feeRow}>
            <div className={styles.feeLabel}>
              <Tag size={14} className={styles.feeIcon} />
              <span>Entry fee</span>
            </div>
            <div className={styles.feeValue}>
              <span className={styles.feeAmount}>{prize.entryFee.toLocaleString('en-IN')}</span>
              <span className={styles.feeCurrency}>{prize.requiredCurrency}</span>
            </div>
          </div>
        </div>

        {/* Button-styled footer */}
        <div className={`${styles.cardFooter} ${isUserEntry ? styles.footerEntered : ''}`}>
          <span>{isUserEntry ? 'View your entry' : 'View & join'}</span>
          <ChevronRight size={16} />
        </div>
      </article>
    </Link>
  );
};

export default PrizeCard;
