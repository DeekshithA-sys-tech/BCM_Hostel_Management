import React, { useEffect, useState } from 'react';
import useToastStore from '../store/useToastStore';

/* ── individual toast item ── */
const Toast = ({ id, message, type }) => {
  const removeToast = useToastStore((s) => s.removeToast);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    error:   { bg: 'rgba(239,68,68,0.15)',   border: 'var(--danger)',  icon: '✕', color: '#f87171' },
    success: { bg: 'rgba(16,185,129,0.15)',  border: 'var(--success)', icon: '✓', color: '#34d399' },
    warning: { bg: 'rgba(245,158,11,0.15)',  border: 'var(--warning)', icon: '⚠', color: '#fbbf24' },
    info:    { bg: 'rgba(14,165,233,0.15)',  border: 'var(--info)',    icon: 'ℹ', color: '#38bdf8' },
  };

  const c = colors[type] || colors.info;

  return (
    <div
      onClick={() => removeToast(id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        cursor: 'pointer',
        maxWidth: '420px',
        width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '22px', height: '22px', minWidth: '22px',
        borderRadius: '50%', background: c.border, color: '#fff',
        fontSize: '0.75rem', fontWeight: 700,
      }}>
        {c.icon}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: c.color, fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.4 }}>
          {type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Info'}
        </p>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>✕</span>
    </div>
  );
};

/* ── toast container rendered at root ── */
const ToastContainer = () => {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      right: '1.25rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <Toast {...t} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
