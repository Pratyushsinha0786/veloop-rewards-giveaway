import React, { useState, useEffect } from 'react';
import { Radio, Users, PackageCheck, Clock } from 'lucide-react';
import styles from './GiveawayStats.module.css';

interface GiveawayStatsProps {
  activeGiveaways?: number;
  participants?: number;
  prizesDelivered?: number;
  endAt?: string | Date;
  onEnded?: () => void;
}

function calculateTimeLeft(targetDate?: string | Date) {
  if (!targetDate) return { total: 0, text: 'No timer' };
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { total: 0, text: 'Drawing winners…' };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const text = `${days}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

  return { total: diff, text };
}

export const GiveawayStats: React.FC<GiveawayStatsProps> = ({
  activeGiveaways = 1,
  participants = 0,
  prizesDelivered = 0,
  endAt,
  onEnded,
}) => {
  // Compute initial value immediately to prevent 00:00 flash
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endAt));

  useEffect(() => {
    // Check immediately on endAt prop change
    const initial = calculateTimeLeft(endAt);
    setTimeLeft(initial);
    if (initial.total <= 0 && endAt && onEnded) {
      onEnded();
    }

    const interval = setInterval(() => {
      const current = calculateTimeLeft(endAt);
      setTimeLeft(current);
      if (current.total <= 0) {
        clearInterval(interval);
        if (onEnded) onEnded();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endAt, onEnded]);

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsBar}>
        {/* Column 1: Live Giveaways */}
        <div className={styles.statItem}>
          <div className={styles.iconWrap}>
            <Radio size={20} className={styles.iconRadio} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statNumber}>{activeGiveaways.toLocaleString('en-IN')}</span>
            <span className={styles.statLabel}>Live giveaways</span>
          </div>
        </div>

        {/* Column 2: Entries so far */}
        <div className={styles.statItem}>
          <div className={styles.iconWrap}>
            <Users size={20} className={styles.iconUsers} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statNumber}>{participants.toLocaleString('en-IN')}</span>
            <span className={styles.statLabel}>Entries so far</span>
          </div>
        </div>

        {/* Column 3: Prizes delivered */}
        <div className={styles.statItem}>
          <div className={styles.iconWrap}>
            <PackageCheck size={20} className={styles.iconDelivered} />
          </div>
          <div className={styles.statDetails}>
            <span className={styles.statNumber}>{prizesDelivered.toLocaleString('en-IN')}</span>
            <span className={styles.statLabel}>Prizes delivered</span>
          </div>
        </div>

        {/* Column 4: Countdown timer */}
        <div className={`${styles.statItem} ${styles.statItemHighlight}`}>
          <div className={styles.iconWrap}>
            <Clock size={20} className={styles.iconClock} />
          </div>
          <div className={styles.statDetails}>
            <span className={`${styles.statNumber} ${styles.monoTimer}`}>{timeLeft.text}</span>
            <span className={styles.statLabel}>Closes in</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiveawayStats;
