import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, CheckCircle2, Clock, Truck, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import apiClient, { errorMessage } from '../../api/axiosClient.ts';
import CustomLoader from '../../components/CustomLoader/CustomLoader.tsx';
import ClaimModal from '../../components/ClaimModal/ClaimModal.tsx';
import styles from './MyRewardsPage.module.css';

interface WinRecord {
  _id: string;
  giveawayId: any;
  prizeId: any;
  userId: string;
  maskedUserId: string;
  status: 'UNCLAIMED' | 'CLAIM_SUBMITTED' | 'PROCESSING' | 'COMPLETED' | 'EXPIRED';
  selectedAt: string;
  prize?: {
    _id: string;
    name: string;
    slug: string;
    image: string;
    prizeType: 'PHYSICAL' | 'GIFT_CARD' | 'DIGITAL';
    position: string;
  };
  giveaway?: {
    _id: string;
    title: string;
    endAt: string;
  };
  claim?: {
    _id: string;
    status: string;
    createdAt: string;
  };
}

export const MyRewardsPage: React.FC = () => {
  const { user, refreshWins } = useAuth();
  const [wins, setWins] = useState<WinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim modal state
  const [selectedWinner, setSelectedWinner] = useState<WinRecord | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchMyWins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/claims/mine');
      setWins(res.data.wins || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyWins();
  }, [fetchMyWins, user?.customUserId]);

  const handleClaimSuccess = async (message: string) => {
    setSuccessBanner(message);
    await fetchMyWins();
    await refreshWins();
  };

  if (loading) {
    return <CustomLoader message="Fetching your rewards…" />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>My Rewards</h1>
          <p className={styles.subtitle}>
            Prizes you've won as <strong>{user?.customUserId || 'VE10025'}</strong>. Add your details to get them delivered.
          </p>
        </div>

        {/* Global Success Banner */}
        {successBanner && (
          <div className={styles.successBanner} role="status">
            <CheckCircle2 size={18} className={styles.bannerIcon} />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Wins List or Empty State */}
        {wins.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.trophyCircle}>
              <Trophy size={36} className={styles.emptyTrophy} />
            </div>
            <h3 className={styles.emptyTitle}>No wins yet</h3>
            <p className={styles.emptySub}>
              Enter active giveaways using your VELOOP balances to win physical and digital prizes.
            </p>
            <Link to="/" className={styles.browseBtn}>
              <span>Browse prizes</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className={styles.winsList}>
            {wins.map((win) => {
              const prize = win.prize || (win.prizeId as any);
              const giveaway = win.giveaway || (win.giveawayId as any);
              const wonDate = new Date(win.selectedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const isUnclaimed = win.status === 'UNCLAIMED';
              const isPhysical = prize?.prizeType === 'PHYSICAL';

              return (
                <div key={win._id} className={styles.winCard}>
                  {/* Thumbnail */}
                  <div className={styles.thumbWrap}>
                    <img
                      src={prize?.image || 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400'}
                      alt={prize?.name || 'Prize'}
                      className={styles.thumbImage}
                    />
                  </div>

                  {/* Details */}
                  <div className={styles.winDetails}>
                    <div className={styles.pillsRow}>
                      {/* Type Pill */}
                      <span className={styles.typePill}>
                        {isPhysical ? (
                          <>
                            <Truck size={12} />
                            <span>Physical</span>
                          </>
                        ) : (
                          <>
                            <Mail size={12} />
                            <span>Voucher</span>
                          </>
                        )}
                      </span>

                      {/* Status Pill */}
                      {win.status === 'UNCLAIMED' && (
                        <span className={styles.statusPillAmber}>
                          <Clock size={12} />
                          <span>Waiting for your details</span>
                        </span>
                      )}
                      {(win.status === 'CLAIM_SUBMITTED' || win.status === 'PROCESSING') && (
                        <span className={styles.statusPillBlue}>
                          <Clock size={12} />
                          <span>Processing verification</span>
                        </span>
                      )}
                      {win.status === 'COMPLETED' && (
                        <span className={styles.statusPillGreen}>
                          <CheckCircle2 size={12} />
                          <span>Delivered</span>
                        </span>
                      )}
                      {win.status === 'EXPIRED' && (
                        <span className={styles.statusPillGrey}>
                          <span>Expired</span>
                        </span>
                      )}
                    </div>

                    <h3 className={styles.winPrizeName}>{prize?.name || 'Prize'}</h3>
                    <p className={styles.winGiveawayLine}>
                      {giveaway?.title || 'Giveaway'} · won {wonDate}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className={styles.actionCol}>
                    {isUnclaimed ? (
                      <button
                        onClick={() => setSelectedWinner(win)}
                        className={styles.claimBtn}
                      >
                        Claim
                      </button>
                    ) : (
                      <div className={styles.claimedTag}>
                        <CheckCircle2 size={14} />
                        <span>Claimed</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Claim Dialog */}
      {selectedWinner && (
        <ClaimModal
          winner={selectedWinner}
          isOpen={true}
          onClose={() => setSelectedWinner(null)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  );
};

export default MyRewardsPage;
