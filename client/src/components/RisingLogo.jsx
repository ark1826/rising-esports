import React from 'react';

export default function RisingLogo({ size = 'medium', className = '' }) {
  const isSmall = size === 'small';
  
  return (
    <div className={`rising-brand-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '8px' : '10px', textDecoration: 'none' }}>
      {/* Stylized Esports 'R' Mark */}
      <div className="logo-r-symbol" style={{ position: 'relative', width: isSmall ? '28px' : '34px', height: isSmall ? '28px' : '34px', flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.6))' }}>
          <defs>
            <linearGradient id="risingRGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="risingAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {/* Main angular athletic 'R' spine and loop */}
          <path
            d="M20 12 L62 12 C78 12 88 22 88 38 C88 52 78 61 64 63 L86 92 L62 92 L43 65 L36 65 L36 92 L20 92 Z M36 26 L36 51 L59 51 C68 51 72 46 72 38 C72 30 67 26 58 26 Z"
            fill="url(#risingRGrad)"
          />
          {/* Cyber cutout slice across the R */}
          <path
            d="M10 52 L95 24 L92 34 L12 60 Z"
            fill="#0a0814"
            opacity="0.95"
          />
          {/* Subtle neon glowing accent overlay */}
          <path
            d="M36 26 L58 26 C67 26 72 30 72 38 C72 41 71 43 69 45 L62 45 L54 36 L36 36 Z"
            fill="url(#risingAccentGrad)"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="logo-text-col" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: "'Orbitron', 'Inter', sans-serif",
            fontWeight: 900,
            fontSize: isSmall ? '1.05rem' : '1.22rem',
            color: '#ffffff',
            letterSpacing: '1.2px',
          }}
        >
          RISING
        </span>
        <span
          style={{
            fontFamily: "'Orbitron', 'Inter', sans-serif",
            fontWeight: 800,
            fontSize: isSmall ? '0.72rem' : '0.82rem',
            color: '#a855f7',
            letterSpacing: '2px',
            textShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
          }}
        >
          ESPORTS
        </span>
      </div>
    </div>
  );
}
