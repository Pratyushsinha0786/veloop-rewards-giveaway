import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import apiClient from '../../api/axiosClient.ts';
import styles from './WinnerSlider.module.css';

interface TickerItem {
  id: string;
  message: string;
}

export const WinnerSlider: React.FC = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchTicker() {
      try {
        const res = await apiClient.get('/giveaways/ticker');
        if (isMounted) {
          setTickerItems(res.data.ticker || []);
        }
      } catch (_e) {
        // fail silently; hide component if no winners
      }
    }
    fetchTicker();
    return () => {
      isMounted = false;
    };
  }, []);

  // Hide component entirely if there are no winners (never show fake winners)
  if (!tickerItems || tickerItems.length === 0) {
    return null;
  }

  // Duplicate items for continuous looping animation
  const loopItems = [...tickerItems, ...tickerItems];

  return (
    <div className={styles.sliderContainer}>
      <div className={styles.labelBadge}>
        <Trophy size={14} className={styles.trophyIcon} />
        <span>RECENT WINNERS</span>
      </div>
      <div className={styles.marqueeTrackWrapper}>
        <div className={styles.marqueeTrack}>
          {loopItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className={styles.tickerChip}>
              <span className={styles.bullet}>•</span>
              <span className={styles.tickerText}>{item.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WinnerSlider;
