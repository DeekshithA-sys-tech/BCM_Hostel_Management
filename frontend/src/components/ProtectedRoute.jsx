import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Module-level flag so the verification only runs once per app session,
// not on every remount of ProtectedRoute (which was causing repeated /auth/me calls)
const authVerified = { done: false };

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const [checking, setChecking] = useState(!authVerified.done);

  useEffect(() => {
    // Only run the server-side check once per browser session.
    // After the first ProtectedRoute mount verifies, all subsequent mounts trust the store.
    if (authVerified.done) return;

    const verify = async () => {
      await checkAuth();
      authVerified.done = true;
      setChecking(false);
    };
    verify();
  }, []);

  // Loading spinner while verifying
  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg-primary)' }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--brand-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying session…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → login page
  const storeUser = useAuthStore.getState().user;
  if (!isAuthenticated || !storeUser) {
    return <Navigate to="/auth" replace />;
  }

  // Role mismatch → clear "Access Denied" screen with logout button
  if (role && storeUser.role !== role) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ padding: '2rem 2.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid var(--danger)', borderRadius: '14px', maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            You are logged in as <strong style={{ color: 'var(--text-primary)' }}>{storeUser.role}</strong> but this page requires{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{role}</strong> access.
          </p>
          <button className="btn btn-primary" onClick={() => {
            authVerified.done = false; // allow re-verification after logout
            logout();
            window.location.href = '/auth';
          }}>
            Sign Out &amp; Switch Account
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export const resetAuthVerification = () => { authVerified.done = false; };

export default ProtectedRoute;
