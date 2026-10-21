import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import styles from './NotFoundPage.module.css';

export const NotFoundPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <HelpCircle size={40} className={styles.icon} />
        </div>
        <h1 className={styles.title}>404 - Page Not Found</h1>
        <p className={styles.text}>
          The page or reward you're looking for doesn't exist or has ended.
        </p>
        <Link to="/" className={styles.homeBtn}>
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
