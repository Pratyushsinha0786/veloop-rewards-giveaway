import React, { useState, useEffect } from 'react';
import { Trophy, Clock, History, Calendar, Users, Award } from 'lucide-react';
import apiClient from '../../api/axiosClient.ts';
import styles from './WinnersTab.module.css';

interface PastGiveaway {
  _id: string;
  title: string;
  slug: string;
  status: string;
  startAt: string;
  endAt: string;
  drawnAt?: string;
  totalParticipants: number;
  winners: Array<{
    _id: string;
    maskedUserId: string;
    status: string;
    prize: {
      name: string;
      position: string;
      prizeType: string;
      image?: string;
    } | null;
  }>;
}

interface WinnersTabProps {
  currentGiveawayId?: string;
  currentGiveawayTitle?: string;
  currentGiveawayStatus?: string;
}

export const WinnersTab: React.FC<WinnersTabProps> = ({
  currentGiveawayId,
  currentGiveawayTitle = 'Current Giveaway',
  currentGiveawayStatus = 'ACTIVE',
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const [pastGiveaways, setPastGiveaways] = useState<PastGiveaway[]>([]);
  const [currentWinners, setCurrentWinners] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadWinnersData() {
      setLoading(true);
      try {
        if (currentGiveawayId) {
          const curRes = await apiClient.get(`/giveaways/${currentGiveawayId}/winners`);
          if (isMounted) {
            setCurrentWinners(curRes.data.winners || []);
            setCurrentMessage(curRes.data.message || '');
          }
        }

        const pastRes = await apiClient.get('/giveaways/previous');
        if (isMounted) {
          setPastGiveaways(pastRes.data.giveaways || []);
        }
      } catch (_e) {
        // handle gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWinnersData();

    return () => {
      isMounted = false;
    };
  }, [currentGiveawayId]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.sectionTitle}>Giveaway Winners</h2>
            <p className={styles.sectionSubtitle}>
              Transparent and provably random draws audited on the VELOOP rewards ledger.
            </p>
          </div>

          {/* Tab buttons */}
          <div className={styles.tabPillContainer}>
            <button
              onClick={() => setActiveTab('current')}
              className={`${styles.tabBtn} ${activeTab === 'current' ? styles.tabBtnActive : ''}`}
            >
              <Clock size={16} />
              <span>This giveaway</span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`${styles.tabBtn} ${activeTab === 'past' ? styles.tabBtnActive : ''}`}
            >
              <History size={16} />
              <span>Past giveaways</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Current Giveaway */}
        {activeTab === 'current' && (
          <div className={styles.tabContent}>
            {currentGiveawayStatus === 'ENDED' && currentWinners.length > 0 ? (
              <div className={styles.pastCard}>
                <div className={styles.giveawayMeta}>
                  <h3 className={styles.giveawayTitle}>{currentGiveawayTitle}</h3>
                  <span className={styles.drawnTag}>Draw Complete</span>
                </div>
                <div className={styles.winnerGrid}>
                  {currentWinners.map((w) => (
                    <div key={w._id} className={styles.winnerChip}>
                      <Trophy size={16} className={styles.trophyIcon} />
                      <span className={styles.maskedId}>{w.maskedUserId}</span>
                      <span className={styles.wonPrize}>
                        {w.prizeId?.name || w.prize?.name || 'Grand Prize'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.liveNoticeCard}>
                <div className={styles.clockIconWrap}>
                  <Clock size={28} className={styles.clockIcon} />
                </div>
                <h3 className={styles.noticeHeading}>Winners announced when the timer ends</h3>
                <p className={styles.noticeBody}>
                  {currentMessage ||
                    `Entries for "${currentGiveawayTitle}" are currently being accepted. Once the countdown expires, the system executes an automated Fisher-Yates draw to select certified winners.`}
                </p>
                <div className={styles.noticeBulletList}>
                  <div className={styles.noticeBullet}>
                    <Award size={16} className={styles.bulletIcon} />
                    <span>Provably fair cryptographic randomness</span>
                  </div>
                  <div className={styles.noticeBullet}>
                    <Users size={16} className={styles.bulletIcon} />
                    <span>One entry per member per giveaway</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Past Giveaways */}
        {activeTab === 'past' && (
          <div className={styles.tabContent}>
            {pastGiveaways.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No past giveaways recorded yet.</p>
              </div>
            ) : (
              <div className={styles.pastList}>
                {pastGiveaways.map((giveaway) => {
                  const endDate = new Date(giveaway.endAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div key={giveaway._id} className={styles.pastCard}>
                      <div className={styles.giveawayMeta}>
                        <div>
                          <h3 className={styles.giveawayTitle}>{giveaway.title}</h3>
                          <div className={styles.giveawaySubMeta}>
                            <span className={styles.metaItem}>
                              <Calendar size={13} />
                              <span>Ended {endDate}</span>
                            </span>
                            <span className={styles.metaDot}>•</span>
                            <span className={styles.metaItem}>
                              <Users size={13} />
                              <span>{giveaway.totalParticipants} participants</span>
                            </span>
                          </div>
                        </div>
                        <span className={styles.winnerCountBadge}>
                          {giveaway.winners.length} {giveaway.winners.length === 1 ? 'Winner' : 'Winners'}
                        </span>
                      </div>

                      {/* Winners Grid */}
                      <div className={styles.winnerGrid}>
                        {giveaway.winners.map((winner) => (
                          <div key={winner._id} className={styles.winnerChip}>
                            <Trophy size={16} className={styles.trophyIcon} />
                            <span className={styles.maskedId}>{winner.maskedUserId}</span>
                            <span className={styles.wonPrize}>{winner.prize?.name || 'Prize'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default WinnersTab;
