import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Truck,
  Mail,
  ShieldCheck,
  Calendar,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import apiClient, { errorMessage } from '../../api/axiosClient.ts';
import CustomLoader from '../../components/CustomLoader/CustomLoader.tsx';
import styles from './PrizeDetailsPage.module.css';

export const PrizeDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, refreshUser } = useAuth();

  const [prize, setPrize] = useState<any>(null);
  const [giveaway, setGiveaway] = useState<any>(null);
  const [myStatus, setMyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modal and submission state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPrizeData = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setNotFound(false);
      setJoinResult(null);

      const res = await apiClient.get(`/giveaways/prize/${slug}`);
      const fetchedPrize = res.data.prize;
      const fetchedGiveaway = res.data.giveaway;

      setPrize(fetchedPrize);
      setGiveaway(fetchedGiveaway);

      if (fetchedGiveaway?._id) {
        try {
          const statusRes = await apiClient.get(`/giveaways/${fetchedGiveaway._id}/my-status`);
          setMyStatus(statusRes.data);
        } catch (_statusErr) {
          setMyStatus(null);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Re-fetch when slug or user changes
  useEffect(() => {
    fetchPrizeData();
  }, [fetchPrizeData, user?.customUserId]);

  // Handle Escape key to close confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !joining) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, joining]);

  if (loading) {
    return <CustomLoader message="Loading prize details…" />;
  }

  if (notFound || !prize) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundCard}>
          <AlertTriangle size={36} className={styles.notFoundIcon} />
          <h2>Prize not found</h2>
          <p>We couldn't locate the requested reward. It may have expired or been moved.</p>
          <Link to="/" className={styles.backButton}>
            <ArrowLeft size={16} />
            <span>Return to all prizes</span>
          </Link>
        </div>
      </div>
    );
  }

  // Cost and balance calculations
  const currency = prize.requiredCurrency as 'VES' | 'SVES' | 'Tokens';
  const entryFee = prize.entryFee || 0;
  const currentBalance = (user?.balances?.[currency] ?? 0);
  const hasEnoughBalance = currentBalance >= entryFee;
  const deficit = entryFee - currentBalance;

  // Participation checks
  const hasParticipated = myStatus?.hasParticipated || false;
  const participation = myStatus?.participation;
  const isEnteredForThisPrize =
    hasParticipated &&
    (participation?.prizeId?._id === prize._id ||
      participation?.prizeId === prize._id ||
      (participation?.prize as any)?._id === prize._id ||
      (participation?.prize as any)?.slug === prize.slug);

  const enteredOtherPrize =
    hasParticipated && !isEnteredForThisPrize ? participation?.prize || participation?.prizeId : null;

  const handleConfirmJoin = async () => {
    if (!giveaway?._id || !prize?._id) return;

    try {
      setJoining(true);
      setJoinResult(null);

      const res = await apiClient.post(`/giveaways/${giveaway._id}/join`, {
        prizeId: prize._id,
      });

      setJoinResult({
        type: 'success',
        message: res.data.message || "You're in! Your entry has been recorded.",
      });

      setIsModalOpen(false);
      await refreshUser();
      await fetchPrizeData();
    } catch (err: any) {
      setJoinResult({
        type: 'error',
        message: errorMessage(err),
      });
      setIsModalOpen(false);
    } finally {
      setJoining(false);
    }
  };

  const closeDateFormatted = giveaway?.endAt
    ? new Date(giveaway.endAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Back Link */}
        <div className={styles.backLinkRow}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>← All prizes</span>
          </Link>
        </div>

        {/* Global Feedback Alert */}
        {joinResult && (
          <div
            className={
              joinResult.type === 'success' ? styles.alertSuccess : styles.alertError
            }
            role="alert"
          >
            {joinResult.type === 'success' ? (
              <CheckCircle2 size={18} className={styles.alertIcon} />
            ) : (
              <AlertTriangle size={18} className={styles.alertIcon} />
            )}
            <span>{joinResult.message}</span>
          </div>
        )}

        {/* Two Column Layout */}
        <div className={styles.twoColumnGrid}>
          {/* Left Column: Image and details box */}
          <div className={styles.leftCol}>
            <div className={styles.imageCard}>
              <img src={prize.image} alt={prize.name} className={styles.mainImage} />
              <div className={styles.positionTag}>
                <Trophy size={14} className={styles.trophyIcon} />
                <span>{prize.position}</span>
              </div>
            </div>

            <div className={styles.aboutCard}>
              <h3 className={styles.aboutTitle}>About this prize</h3>
              <p className={styles.aboutText}>{prize.description}</p>

              <div className={styles.badgesRow}>
                <div className={styles.infoBadge}>
                  {prize.prizeType === 'PHYSICAL' ? (
                    <>
                      <Truck size={14} className={styles.badgeIcon} />
                      <span>Shipped to you</span>
                    </>
                  ) : (
                    <>
                      <Mail size={14} className={styles.badgeIcon} />
                      <span>Sent by email</span>
                    </>
                  )}
                </div>

                <div className={styles.infoBadge}>
                  <Trophy size={14} className={styles.badgeIconAmber} />
                  <span>
                    {prize.winnerCount} {prize.winnerCount === 1 ? 'Winner' : 'Winners'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Cost & Actions */}
          <div className={styles.rightCol}>
            <div className={styles.prizeHeader}>
              <span className={styles.miniPositionTag}>{prize.position}</span>
              <h1 className={styles.prizeTitle}>Win {prize.name}</h1>
              {giveaway && (
                <p className={styles.giveawayRef}>
                  <Calendar size={14} />
                  <span>
                    Part of {giveaway.title} · closes {closeDateFormatted}
                  </span>
                </p>
              )}
            </div>

            {/* Cost Card */}
            <div className={styles.costCard}>
              <div className={styles.costRow}>
                <div className={styles.costItem}>
                  <span className={styles.costLabel}>Entry Fee</span>
                  <span className={styles.costNumber}>
                    {entryFee.toLocaleString('en-IN')} <small>{currency}</small>
                  </span>
                </div>

                <div className={styles.costDivider} />

                <div className={styles.costItem}>
                  <span className={styles.costLabel}>Your Balance</span>
                  <span className={styles.costNumber}>
                    {currentBalance.toLocaleString('en-IN')} <small>{currency}</small>
                  </span>
                </div>
              </div>

              {/* Balance status pill */}
              <div className={styles.balanceStatusRow}>
                {hasEnoughBalance ? (
                  <div className={styles.balanceGreen}>
                    <CheckCircle2 size={15} />
                    <span>You have enough {currency} to enter</span>
                  </div>
                ) : (
                  <div className={styles.balanceRed}>
                    <AlertTriangle size={15} />
                    <span>
                      You need {deficit.toLocaleString('en-IN')} more {currency} to enter
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Area with Strict Priority Order */}
            <div className={styles.actionArea}>
              {/* Priority 1: No live giveaway */}
              {!giveaway ? (
                <div className={styles.actionBoxInfo}>
                  <Info size={18} className={styles.infoBoxIcon} />
                  <p>This prize isn't part of a live giveaway right now.</p>
                </div>
              ) : isEnteredForThisPrize ? (
                /* Priority 2: User entered THIS prize */
                <div className={styles.actionBoxEntered}>
                  <div className={styles.enteredHeader}>
                    <CheckCircle2 size={22} className={styles.enteredCheckIcon} />
                    <div>
                      <h4 className={styles.enteredTitle}>You're in the draw</h4>
                      <p className={styles.enteredSub}>
                        Joined on{' '}
                        {new Date(participation?.joinedAt || Date.now()).toLocaleDateString(
                          'en-IN',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>
                  {participation?.transactionId && (
                    <div className={styles.txnRef}>
                      <span>Transaction Ref:</span>
                      <code>{participation.transactionId}</code>
                    </div>
                  )}
                </div>
              ) : enteredOtherPrize ? (
                /* Priority 3: User entered ANOTHER prize */
                <div className={styles.actionBoxInfo}>
                  <Info size={18} className={styles.infoBoxIcon} />
                  <div>
                    <p>
                      You've already entered this giveaway for{' '}
                      <Link
                        to={`/giveaway/${enteredOtherPrize.slug || ''}`}
                        className={styles.otherPrizeLink}
                      >
                        {enteredOtherPrize.name || 'another prize'}
                      </Link>
                      . Only one entry per giveaway is allowed.
                    </p>
                  </div>
                </div>
              ) : !hasEnoughBalance ? (
                /* Priority 4: Not enough balance */
                <button disabled className={styles.btnDisabled}>
                  <Lock size={16} />
                  <span>Not enough {currency}</span>
                </button>
              ) : (
                /* Priority 5: Otherwise Join Button */
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={styles.btnJoin}
                >
                  <span>
                    Join for {entryFee.toLocaleString('en-IN')} {currency}
                  </span>
                </button>
              )}
            </div>

            {/* Giveaway Rules */}
            {giveaway?.rules && giveaway.rules.length > 0 && (
              <div className={styles.rulesCard}>
                <div className={styles.rulesHeader}>
                  <ShieldCheck size={16} className={styles.rulesIcon} />
                  <span>Giveaway Rules & Transparency</span>
                </div>
                <ul className={styles.rulesList}>
                  {giveaway.rules.map((rule: string, idx: number) => (
                    <li key={idx} className={styles.ruleItem}>
                      <span className={styles.ruleDot}>•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget && !joining) {
              setIsModalOpen(false);
            }
          }}
          role="presentation"
        >
          <div
            className={styles.confirmModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className={styles.modalHeader}>
              <h3 id="confirm-modal-title" className={styles.confirmTitle}>
                Confirm Giveaway Entry
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={joining}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.confirmSubtitle}>
                You are entering the draw for <strong>{prize.name}</strong>.
              </p>

              <div className={styles.confirmTable}>
                <div className={styles.tableRow}>
                  <span>Entry Fee</span>
                  <strong>
                    {entryFee.toLocaleString('en-IN')} {currency}
                  </strong>
                </div>
                <div className={styles.tableRow}>
                  <span>Current Balance</span>
                  <span>
                    {currentBalance.toLocaleString('en-IN')} {currency}
                  </span>
                </div>
                <div className={`${styles.tableRow} ${styles.tableRowHighlight}`}>
                  <span>Balance After Entry</span>
                  <strong>
                    {(currentBalance - entryFee).toLocaleString('en-IN')} {currency}
                  </strong>
                </div>
              </div>

              <div className={styles.warningNote}>
                <Info size={16} className={styles.warningIcon} />
                <p>
                  This uses up your one entry for <strong>{giveaway?.title}</strong>. Entry fees can't be refunded.
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={joining}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={joining}
                className={styles.confirmBtn}
              >
                {joining ? 'Joining…' : 'Confirm & join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeDetailsPage;
