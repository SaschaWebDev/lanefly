import { useId } from 'react';
import styles from './logo.module.css';

interface LogoProps {
  variant?: 'icon' | 'lockup';
  className?: string;
}

export function Logo({ variant = 'lockup', className }: LogoProps) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const defs = (
    <defs>
      <linearGradient id={id('col1')} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: 'var(--color-brand-col1-start)' }}
        />
        <stop
          offset="100%"
          style={{ stopColor: 'var(--color-brand-col1-end)' }}
        />
      </linearGradient>
      <linearGradient id={id('col2')} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: 'var(--color-brand-col2-start)' }}
        />
        <stop
          offset="100%"
          style={{ stopColor: 'var(--color-brand-col2-end)' }}
        />
      </linearGradient>
      <linearGradient id={id('col3')} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: 'var(--color-brand-col3-start)' }}
        />
        <stop
          offset="100%"
          style={{ stopColor: 'var(--color-brand-col3-end)' }}
        />
      </linearGradient>
      <linearGradient id={id('fly')} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop
          offset="0%"
          style={{ stopColor: 'var(--color-brand-card-start)' }}
        />
        <stop
          offset="100%"
          style={{ stopColor: 'var(--color-brand-card-end)' }}
        />
      </linearGradient>
      <filter id={id('shadow')} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="3"
          dy="5"
          stdDeviation="4"
          floodColor="#0f172a"
          floodOpacity="0.2"
        />
      </filter>
    </defs>
  );

  const mark = (
    <>
      {/* Swimlanes */}
      <line
        x1="12"
        y1="45"
        x2="108"
        y2="45"
        stroke="var(--color-brand-swimlane)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeLinecap="round"
        opacity="0.8"
      />
      <line
        x1="12"
        y1="85"
        x2="108"
        y2="85"
        stroke="var(--color-brand-swimlane)"
        strokeWidth="2.5"
        strokeDasharray="6 6"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Columns */}
      <rect
        x="22"
        y="25"
        width="20"
        height="70"
        rx="6"
        fill={`url(#${id('col1')})`}
      />
      <rect
        x="50"
        y="50"
        width="20"
        height="45"
        rx="6"
        fill={`url(#${id('col2')})`}
      />
      <rect
        x="78"
        y="70"
        width="20"
        height="25"
        rx="6"
        fill={`url(#${id('col3')})`}
      />
      {/* Flying Card */}
      <g transform="rotate(22, 85, 25)" filter={`url(#${id('shadow')})`}>
        <rect
          x="70"
          y="5"
          width="24"
          height="28"
          rx="6"
          fill={`url(#${id('fly')})`}
        />
        <path
          d="M 76 13 L 88 13 M 76 21 L 84 21"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
    </>
  );

  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className={`${styles.icon} ${className ?? ''}`}
        aria-label="LaneFly"
        role="img"
      >
        {defs}
        {mark}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 400 100"
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.lockup} ${className ?? ''}`}
      aria-label="LaneFly"
      role="img"
    >
      {defs}
      <g transform="translate(10, 10) scale(0.8)">{mark}</g>
      <text
        x="125"
        y="76"
        fontFamily="'Outfit', sans-serif"
        fontSize="52"
        fontWeight="800"
        fill="var(--color-brand-lane)"
        letterSpacing="-1.5"
      >
        Lane
        <tspan fill="var(--color-brand-fly)">Fly</tspan>
      </text>
    </svg>
  );
}
