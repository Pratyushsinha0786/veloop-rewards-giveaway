import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Package, Mail } from 'lucide-react';
import apiClient, { errorMessage } from '../../api/axiosClient.ts';
import styles from './ClaimModal.module.css';

interface ClaimModalProps {
  winner: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  winner,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isPhysical = winner?.prize?.prizeType === 'PHYSICAL';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [email, setEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key (not while submitting)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !winner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let claimDetails: any = {};

    if (isPhysical) {
      const trimmedName = fullName.trim();
      const trimmedPhone = phone.trim();
      const trimmedAddress = address.trim();
      const trimmedCity = city.trim();
      const trimmedState = state.trim();
      const trimmedPin = pinCode.trim();

      if (!trimmedName || trimmedName.length < 3) {
        setError('Full name must be at least 3 characters.');
        return;
      }

      // Strip spaces, dashes, parens and leading +91 or 91
      let cleanedPhone = trimmedPhone.replace(/[\s\-\(\)]/g, '');
      if (cleanedPhone.startsWith('+91')) {
        cleanedPhone = cleanedPhone.slice(3);
      } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
        cleanedPhone = cleanedPhone.slice(2);
      }

      if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }

      if (!trimmedAddress || trimmedAddress.length < 10) {
        setError('Delivery address must be at least 10 characters.');
        return;
      }

      if (!trimmedCity) {
        setError('City is required.');
        return;
      }

      if (!trimmedState) {
        setError('State is required.');
        return;
      }

      if (!/^\d{6}$/.test(trimmedPin)) {
        setError('PIN code must be exactly 6 digits.');
        return;
      }

      claimDetails = {
        fullName: trimmedName,
        phone: cleanedPhone,
        address: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pinCode: trimmedPin,
      };
    } else {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
      claimDetails = { email: trimmedEmail };
    }

    try {
      setSubmitting(true);
      const res = await apiClient.post(`/claims/${winner._id}`, { claimDetails });
      onSuccess(res.data.message || 'Claim submitted successfully!');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-modal-title"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrap}>
            <div className={styles.iconCircle}>
              {isPhysical ? <Package size={20} /> : <Mail size={20} />}
            </div>
            <div>
              <h3 id="claim-modal-title" className={styles.modalTitle}>
                Claim {winner.prize?.name}
              </h3>
              <p className={styles.modalSubtitle}>
                {isPhysical
                  ? 'Provide your Indian delivery address to receive your physical prize.'
                  : 'Enter your email address to receive your digital gift voucher code.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className={styles.closeBtn}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} className={styles.alertIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {isPhysical ? (
            <>
              <div className={styles.fieldGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  Full Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Pratyush Sinha"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Mobile Number <span className={styles.required}>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="address" className={styles.label}>
                  Street Address <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="address"
                  rows={2}
                  placeholder="House/Flat number, building name, street, locality"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={submitting}
                  className={styles.textarea}
                  required
                />
              </div>

              <div className={styles.rowThree}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="city" className={styles.label}>
                    City <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={submitting}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="state" className={styles.label}>
                    State <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    placeholder="Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={submitting}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="pinCode" className={styles.label}>
                    PIN Code <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="pinCode"
                    type="text"
                    maxLength={6}
                    placeholder="560038"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    disabled={submitting}
                    className={styles.input}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.fieldGroup}>
              <label htmlFor="claimEmail" className={styles.label}>
                Voucher Delivery Email <span className={styles.required}>*</span>
              </label>
              <input
                id="claimEmail"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className={styles.input}
                required
              />
              <span className={styles.fieldHelp}>
                Your digital coupon voucher code will be sent to this email address once verified.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actionsRow}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={styles.submitBtn}
            >
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimModal;
