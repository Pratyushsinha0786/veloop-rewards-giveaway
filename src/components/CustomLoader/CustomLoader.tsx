import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import styles from './CustomLoader.module.css';

const messages = [
  'Loading giveaways…',
  'Fetching prizes…',
  'Checking your wallet…',
  'Verifying rewards ledger…',
];

interface CustomLoaderProps {
  message?: string;
  minHeight?: string;
}

export const CustomLoader: React.FC<CustomLoaderProps> = ({ message, minHeight = '50vh' }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className={styles.loaderContainer} style={{ minHeight }}>
      <div className={styles.pulseCircle} aria-hidden="true">
        <Gift className={styles.icon} size={32} />
      </div>
      <p className={styles.messageText}>{message || messages[index]}</p>
    </div>
  );
};

export default CustomLoader;
