import React from 'react';
import { CheckCircle, ShieldCheck, ArrowRight, X } from 'lucide-react';

export default function WithdrawalSuccessModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const amount = data?.amount || 0;
  const upiId = data?.upiId || 'Your UPI ID';
  const txnId = data?.transactionId || `WTH_${Date.now().toString().slice(-6)}`;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="modal-overlay fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 3, 14, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="withdrawal-success-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #130f26 0%, #0c0919 100%)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '20px',
          padding: '24px 20px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.3)',
          position: 'relative',
          color: '#ffffff',
          textAlign: 'center',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <X size={18} />
        </button>

        {/* Success Icon with Glow */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.05) 70%)',
            border: '2px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <CheckCircle size={40} color="#10b981" strokeWidth={2.3} />
        </div>

        {/* Title & Badge */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            marginBottom: '6px',
            color: '#ffffff',
            letterSpacing: '0.3px',
          }}
        >
          Withdrawal Submitted!
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: '#94a3b8',
            marginBottom: '18px',
            lineHeight: 1.4,
          }}
        >
          Your withdrawal request has been received and sent for admin verification.
        </p>

        {/* Receipt Details Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '14px',
            padding: '14px 16px',
            marginBottom: '16px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Amount Requested</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>₹{amount}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Payout UPI ID</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {upiId}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Request ID</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#c084fc' }}>
              {txnId}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Current Status</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '3px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              ⏳ Pending Approval
            </span>
          </div>
        </div>

        {/* Notice Info Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '20px',
            textAlign: 'left',
          }}
        >
          <ShieldCheck size={18} color="#c084fc" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            Once approved by admin, funds will be transferred directly to your UPI ID and a live notification will appear in your notification bell.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Got It, Done
        </button>
      </div>
    </div>
  );
}
