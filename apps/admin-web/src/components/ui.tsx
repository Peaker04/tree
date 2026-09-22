import React from 'react';

export function Button({
  children,
  variant = 'primary',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  onClick?: () => void;
}) {
  const baseStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 'var(--radius-control)',
    border: '1px solid transparent',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--forestDepths)',
      color: '#fff',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: 'var(--hairlineBorder)',
      color: 'var(--ink)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--pewter)',
    },
  };

  return (
    <button onClick={onClick} style={{ ...baseStyle, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--snowWhite)',
        border: '1px solid var(--hairlineBorder)',
        borderRadius: 'var(--radius-card)',
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  status = 'neutral',
}: {
  children: React.ReactNode;
  status?: 'active' | 'suspended' | 'neutral';
}) {
  const bg = status === 'active' ? 'var(--limePulse)' : status === 'suspended' ? '#fee2e2' : '#f1f5f9';
  const color =
    status === 'active' ? 'var(--forestDepths)' : status === 'suspended' ? 'var(--danger)' : 'var(--pewter)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
      }}
    >
      {children}
    </span>
  );
}
