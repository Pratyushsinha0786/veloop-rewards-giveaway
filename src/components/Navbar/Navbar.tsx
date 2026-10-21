import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gift, Award, Coins, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const { user, demoUsers, unclaimedCount, loginDemoUser } = useAuth();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);

  const handleUserChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customUserId = e.target.value;
    if (!customUserId || customUserId === user?.customUserId) return;
    try {
      setSwitching(true);
      await loginDemoUser(customUserId);
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setSwitching(false);
    }
  };

  const balances = user?.balances || { VES: 0, SVES: 0, Tokens: 0 };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link to="/" className={styles.logoLink} aria-label="VELOOP Rewards Home">
          <div className={styles.logoIcon}>
            <Gift className={styles.giftIcon} size={20} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoVeloop}>VELOOP</span>
            <span className={styles.logoRewards}>REWARDS</span>
          </div>
        </Link>

        {/* Right side controls */}
        <div className={styles.rightNav}>
          {/* Wallet pill */}
          <div className={styles.walletPill} title="Your available VELOOP balances">
            <Coins size={15} className={styles.walletIcon} />
            <div className={styles.balancesGroup}>
              <span className={styles.balItem}>
                <strong>{balances.VES.toLocaleString('en-IN')}</strong> VES
              </span>
              <span className={styles.balDot}>·</span>
              <span className={styles.balItem}>
                <strong>{balances.SVES.toLocaleString('en-IN')}</strong> SVES
              </span>
              <span className={styles.balDot}>·</span>
              <span className={styles.balItem}>
                <strong>{balances.Tokens.toLocaleString('en-IN')}</strong> Tokens
              </span>
            </div>
          </div>

          {/* Navigation link: My Rewards */}
          <Link
            to="/my-rewards"
            className={`${styles.navLink} ${location.pathname === '/my-rewards' ? styles.navLinkActive : ''}`}
          >
            <Award size={18} />
            <span>My Rewards</span>
            {unclaimedCount > 0 && (
              <span className={styles.amberBadge} title={`${unclaimedCount} unclaimed reward(s)`}>
                {unclaimedCount}
              </span>
            )}
          </Link>

          {/* Account switcher */}
          <div className={styles.accountSwitcherWrap}>
            <select
              className={styles.accountSelect}
              value={user?.customUserId || 'VE10025'}
              onChange={handleUserChange}
              disabled={switching}
              aria-label="Switch demo account"
            >
              {demoUsers.map((u) => (
                <option key={u.customUserId} value={u.customUserId}>
                  {u.customUserId} · {u.name} {u.role === 'admin' ? '(admin)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className={styles.selectArrow} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
