import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AdminDashboard from './pages/Admin/Dashboard';
import StudentDashboard from './pages/Student/Dashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ToastContainer from './components/ToastContainer';
import useToastStore from './store/useToastStore';
import { useAuthStore } from './store/useAuthStore';
import { connectSocket, disconnectSocket } from './services/socket';

function App() {
  const addToast = useToastStore((s) => s.addToast);
  const { token, isAuthenticated } = useAuthStore();

  // ── Listen for api-error events from the Axios interceptor ────────────────
  useEffect(() => {
    const handler = (e) => {
      const { message, type, status } = e.detail;

      // 403 permission notice
      if (status === 403) {
        addToast('Access denied: You do not have permission for this action.', 'warning', 6000);
        return;
      }

      addToast(message, type || 'error');
    };
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, [addToast]);

  // ── Connect Socket.io when authenticated ──────────────────────────────────
  useEffect(() => {
    const storedToken = token || localStorage.getItem('token');
    if (isAuthenticated && storedToken) {
      connectSocket(storedToken);
    } else {
      disconnectSocket();
    }
    return () => {};
  }, [isAuthenticated, token]);

  return (
    <>
      <ToastContainer />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student/*" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
