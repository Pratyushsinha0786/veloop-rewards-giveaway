import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, RefreshCw, Sparkles, HelpCircle, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import apiClient, { errorMessage } from '../../api/axiosClient.ts';
import CustomLoader from '../../components/CustomLoader/CustomLoader.tsx';
import GiveawayHero from '../../components/GiveawayHero/GiveawayHero.tsx';
import GiveawayStats from '../../components/GiveawayStats/GiveawayStats.tsx';
import WinnerSlider from '../../components/WinnerSlider/WinnerSlider.tsx';
import PrizeCard, { PrizeItem } from '../../components/PrizeCard/PrizeCard.tsx';
import WinnersTab from '../../components/WinnersTab/WinnersTab.tsx';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const { user, loginDemoUser, refreshUser } = useAuth();
  const [giveawayData, setGiveawayData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/giveaways/current');
      const g = res.data.giveaway;
      setGiveawayData(g);
      setStats(res.data.stats);

      if (g?._id) {
        try {
          const statusRes = await apiClient.get(`/giveaways/${g._id}/my-status`);
          setUserStatus(statusRes.data);
        } catch (_statusErr) {
          setUserStatus(null);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setGiveawayData(null);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, user?.customUserId]);

  const handleAdminDraw = async () => {
    if (!giveawayData?._id) return;
    try {
      setAdminActionLoading(true);
      setAdminFeedback(null);
      const res = await apiClient.post(`/admin/giveaways/${giveawayData._id}/draw`);
      setAdminFeedback(`Giveaway ended. ${res.data.totalWinnersPicked} winners picked.`);
      await fetchData();
      await refreshUser();
    } catch (err) {
      setAdminFeedback(`Draw failed: ${errorMessage(err)}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleAdminReset = async () => {
    try {
      setAdminActionLoading(true);
      setAdminFeedback(null);
      await apiClient.post('/admin/reset-demo');
      await loginDemoUser('VE00001');
      await fetchData();
      setAdminFeedback('Demo data reset to initial seed state.');
    } catch (err) {
      setAdminFeedback(`Reset failed: ${errorMessage(err)}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  if (loading) {
    return <CustomLoader />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <h2 className={styles.errorHeading}>Unable to load giveaways</h2>
          <p className={styles.errorText}>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const enteredPrizeId = userStatus?.hasParticipated ? userStatus.participation?.prizeId?._id || userStatus.participation?.prizeId : null;

  return (
    <div className={styles.page}>
      {/* Admin Quick Control Bar */}
      {user?.role === 'admin' && (
        <div className={styles.adminBar}>
          <div className={styles.adminBarInner}>
            <div className={styles.adminBadge}>
              <ShieldAlert size={16} />
              <span>ADMIN PANEL ({user.customUserId})</span>
            </div>

            <div className={styles.adminActions}>
              {giveawayData?.status === 'ACTIVE' && (
                <button
                  onClick={handleAdminDraw}
                  disabled={adminActionLoading}
                  className={styles.adminBtnDraw}
                >
                  <Trophy size={14} />
                  <span>{adminActionLoading ? 'Drawing…' : 'End giveaway & pick winners now'}</span>
                </button>
              )}

              <button
                onClick={handleAdminReset}
                disabled={adminActionLoading}
                className={styles.adminBtnReset}
              >
                <RefreshCw size={14} />
                <span>{adminActionLoading ? 'Resetting…' : 'Reset demo data'}</span>
              </button>
            </div>
          </div>

          {adminFeedback && (
            <div className={styles.adminAlert}>
              <span>{adminFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Hero */}
      <GiveawayHero
        title={giveawayData?.title || 'VELOOP Rewards'}
        onScrollToPrizes={() => {
          document.getElementById('prizes-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Stats Bar */}
      <GiveawayStats
        activeGiveaways={stats?.activeGiveaways || (giveawayData ? 1 : 0)}
        participants={giveawayData?.totalParticipants || 0}
        prizesDelivered={stats?.prizesDelivered || 0}
        endAt={giveawayData?.endAt}
        onEnded={fetchData}
      />

      {/* Winner Ticker Slider */}
      <WinnerSlider />

      {/* Main Prize Section */}
      <section id="prizes-section" className={styles.prizesSection}>
        <div className={styles.container}>
          <div className={styles.prizesHeader}>
            <div className={styles.sectionPill}>
              <Sparkles size={14} />
              <span>FEATURED SELECTION</span>
            </div>
            <h2 className={styles.sectionHeading}>Prizes in this giveaway</h2>
            <p className={styles.sectionSubtext}>
              You can enter once per giveaway, so choose the prize you want most.
            </p>
          </div>

          {giveawayData && giveawayData.prizes && giveawayData.prizes.length > 0 ? (
            <div className={styles.prizeGrid}>
              {giveawayData.prizes.map((prize: PrizeItem) => {
                const isEntered =
                  userStatus?.hasParticipated &&
                  (enteredPrizeId === prize._id ||
                    (userStatus?.participation?.prize as any)?._id === prize._id);

                return (
                  <PrizeCard
                    key={prize._id}
                    prize={prize}
                    isUserEntry={isEntered}
                  />
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyStateCard}>
              <Trophy size={36} className={styles.emptyIcon} />
              <h3>There is no live giveaway right now</h3>
              <p>Check back shortly or view winners from previous giveaway rounds below.</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works Section */}
      <section className={styles.howItWorksSection}>
        <div className={styles.container}>
          <div className={styles.howHeader}>
            <div className={styles.howPill}>
              <HelpCircle size={14} />
              <span>HOW IT WORKS</span>
            </div>
            <h2 className={styles.howHeading}>Four simple steps to win</h2>
            <p className={styles.howSubtext}>
              A seamless, transparent rewards giveaway designed exclusively for VELOOP members.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>01</div>
              <h3 className={styles.stepTitle}>Pick a prize</h3>
              <p className={styles.stepDesc}>
                Browse the lineup and choose the one reward you desire most in the active giveaway.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>02</div>
              <h3 className={styles.stepTitle}>Check your wallet</h3>
              <p className={styles.stepDesc}>
                Make sure you have enough VES, SVES or Tokens to cover the transparent entry fee.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>03</div>
              <h3 className={styles.stepTitle}>Join</h3>
              <p className={styles.stepDesc}>
                Confirm your entry with a single click. Your entry fee is locked and recorded.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>04</div>
              <h3 className={styles.stepTitle}>Claim</h3>
              <p className={styles.stepDesc}>
                When the timer expires, winners submit delivery address or email to receive their reward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Winners Tab Section */}
      <WinnersTab
        currentGiveawayId={giveawayData?._id}
        currentGiveawayTitle={giveawayData?.title}
        currentGiveawayStatus={giveawayData?.status}
      />
    </div>
  );
};

export default HomePage;
