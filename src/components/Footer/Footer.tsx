import React from 'react';
import { ShieldCheck, UserCheck, FileText } from 'lucide-react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Three Trust Points */}
        <div className={styles.trustGrid}>
          <div className={styles.trustItem}>
            <div className={styles.trustIconWrap}>
              <ShieldCheck size={22} className={styles.trustIcon} />
            </div>
            <div>
              <h4 className={styles.trustTitle}>Winners picked at random</h4>
              <p className={styles.trustDesc}>
                Draws utilize cryptographically secure Fisher-Yates randomization.
              </p>
            </div>
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustIconWrap}>
              <UserCheck size={22} className={styles.trustIcon} />
            </div>
            <div>
              <h4 className={styles.trustTitle}>One entry per member</h4>
              <p className={styles.trustDesc}>
                Device fingerprinting and atomic constraints guarantee equal fairness.
              </p>
            </div>
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustIconWrap}>
              <FileText size={22} className={styles.trustIcon} />
            </div>
            <div>
              <h4 className={styles.trustTitle}>Every entry fee is logged</h4>
              <p className={styles.trustDesc}>
                All wallet transactions are permanently recorded in an immutable ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Notice */}
        <div className={styles.bottomBar}>
          <p className={styles.disclaimer}>
            Entry fees are paid in VELOOP currency and can't be refunded.
          </p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} VELOOP Rewards. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
