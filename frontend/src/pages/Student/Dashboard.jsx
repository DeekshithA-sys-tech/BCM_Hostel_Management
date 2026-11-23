import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Home, Key, MessageCircle, FileText, CheckCircle, UserCircle, Bell, AlertCircle, Users } from 'lucide-react';
import api from '../../services/api';
import useToastStore from '../../store/useToastStore';

import './student.css';
import Profile from './Profile';
import Complaints from './Complaints';
import FoodSchedule from './FoodSchedule';
import RoomDetails from './RoomDetails';
import StaffList from './StaffList';

const StudentDashboard = () => {
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [studentInfo, setStudentInfo] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // WhatsApp-style real-time unread badge counters
  const [unreadNotices, setUnreadNotices] = useState(0);
  const [unreadVerification, setUnreadVerification] = useState(0);
  const [unreadComplaints, setUnreadComplaints] = useState(0);

  // Track whether this is the very first data load (on mount) or a refresh
  const isFirstLoad = React.useRef(true);

  const fetchInfo = async () => {
    try {
      setLoadingInfo(true);
      const response = await api.get('/students/me');
      const data = response.data.data;

      if (data.needsProfile) {
        setNeedsProfile(true);
        setStudentInfo(null);
      } else {
        setNeedsProfile(false);
        setStudentInfo(data.student);
      }
    } catch (err) {
      console.error('Failed to fetch student info:', err.apiMessage || err.message);
    } finally {
      setLoadingInfo(false);
      isFirstLoad.current = false;
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data.data;
      const list = Array.isArray(data) ? data : (data?.notifications || data?.items || []);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.apiMessage || err.message);
    }
  };

  // Real-time WebSocket notifications & badge counter updates
  useEffect(() => {
    let unsubNotif = null;
    let unsubVerified = null;
    let unsubComplaint = null;

    const attach = () => {
      import('../../services/socket').then(({ getSocket, onSocketEvent }) => {
        const sock = getSocket();
        if (sock) {
          unsubNotif = onSocketEvent('notification:new', (notif) => {
            setNotifications(prev => [notif, ...prev]);
            setUnreadNotices(prev => prev + 1);
            addToast(`New notice: ${notif.title}`, 'info', 5000);
          });

          unsubVerified = onSocketEvent('profile:verified', (data) => {
            setUnreadVerification(prev => prev + 1);
            fetchInfo();
            const isApp = data.status === 'approved';
            addToast(isApp ? 'Your profile has been approved.' : 'Profile review remarks updated.', isApp ? 'success' : 'info', 6000);
          });

          unsubComplaint = onSocketEvent('complaint:updated', (data) => {
            setUnreadComplaints(prev => prev + 1);
            addToast(`Complaint status updated to "${data.status}".`, 'info', 5000);
          });
        }
      });
    };

    attach();

    return () => {
      if (unsubNotif) unsubNotif();
      if (unsubVerified) unsubVerified();
      if (unsubComplaint) unsubComplaint();
    };
  }, []);

  useEffect(() => {
    fetchInfo();
    fetchNotifications();
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'overview') setUnreadNotices(0);
    if (tabName === 'profile') setUnreadVerification(0);
    if (tabName === 'complaints') setUnreadComplaints(0);
  };

  const verStatus = studentInfo?.verificationStatus;
  const isApproved = verStatus === 'approved';
  const isPending  = verStatus === 'pending';
  const isRejected = verStatus === 'rejected';

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="glass-panel dashboard-sidebar">
        <div>
          <h2 className="sidebar-title">Student Hub</h2>
          <p className="sidebar-subtitle">Welcome, {user?.name || 'Student'}</p>

          {!loadingInfo && (
            <div style={{ marginTop: '0.5rem' }}>
              {needsProfile && (
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(14,165,233,0.15)', color: 'var(--info)', border: '1px solid var(--info)', display: 'inline-block' }}>
                  Complete Profile
                </span>
              )}
              {isPending && (
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', border: '1px solid var(--warning)', display: 'inline-block' }}>
                  ⏳ Pending Approval
                </span>
              )}
              {isRejected && (
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid var(--danger)', display: 'inline-block' }}>
                  ✕ Profile Rejected
                </span>
              )}
              {isApproved && (
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid var(--success)', display: 'inline-block' }}>
                  ✓ Verified
                </span>
              )}
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => handleTabChange('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <Home size={18} /> 
            <span style={{ marginLeft: '0.5rem', flex: 1, textAlign: 'left' }}>Overview</span>
            {unreadNotices > 0 && <span className="whatsapp-badge">{unreadNotices}</span>}
          </button>

          <button onClick={() => handleTabChange('profile')} className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <UserCircle size={18} /> 
            <span style={{ marginLeft: '0.5rem', flex: 1, textAlign: 'left' }}>Profile</span>
            {unreadVerification > 0 && <span className="whatsapp-badge">{unreadVerification}</span>}
          </button>

          <button onClick={() => handleTabChange('room')} className={`btn ${activeTab === 'room' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Key size={18} /> Room Details
          </button>

          <button onClick={() => handleTabChange('complaints')} className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <MessageCircle size={18} /> 
            <span style={{ marginLeft: '0.5rem', flex: 1, textAlign: 'left' }}>Complaints</span>
            {unreadComplaints > 0 && <span className="whatsapp-badge">{unreadComplaints}</span>}
          </button>

          <button onClick={() => handleTabChange('staff')} className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Users size={18} /> Hostel Staff
          </button>

          <button onClick={() => handleTabChange('food')} className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <FileText size={18} /> Food Schedule
          </button>
        </nav>

        <button onClick={logout} className="btn sidebar-logout-btn">
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">

        {/* ─── Overview ─── */}
        {activeTab === 'overview' && (
          <>
            <header className="dashboard-header">
              <h1>Hello, {user?.name || 'Student'} 👋</h1>
              <p className="dashboard-header-text">Here is your hostel status for today.</p>
            </header>

            {(needsProfile || isPending || isRejected) && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '1rem 1.25rem',
                background: needsProfile ? 'rgba(14,165,233,0.08)' : isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${needsProfile ? 'var(--info)' : isRejected ? 'var(--danger)' : 'var(--warning)'}`,
                borderRadius: '10px',
                marginBottom: '2rem',
                cursor: 'pointer'
              }} onClick={() => handleTabChange('profile')}>
                <AlertCircle size={20} color={needsProfile ? 'var(--info)' : isRejected ? 'var(--danger)' : 'var(--warning)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: needsProfile ? 'var(--info)' : isRejected ? 'var(--danger)' : 'var(--warning)', fontSize: '0.9rem' }}>
                    {needsProfile ? 'Action Required: Complete Your Profile' : isRejected ? 'Profile Rejected — Resubmit Required' : 'Profile Under Admin Review'}
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {needsProfile
                      ? 'Fill in your details and upload documents to apply for hostel accommodation.'
                      : isRejected
                      ? `Reason: ${studentInfo?.verificationRemarks || 'Details rejected. Please resubmit with corrections.'}`
                      : 'Your profile has been submitted. The admin will review and approve it soon.'}
                  </p>
                  <p style={{ margin: '0.4rem 0 0', color: needsProfile ? 'var(--info)' : 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'underline' }}>
                    Click here to go to Profile →
                  </p>
                </div>
              </div>
            )}

            <div className="info-grid">

              <div className="glass-panel animate-fade-in info-card card-room">
                <div className="card-title-row">
                  <h3 className="card-title-text">Room Assignment</h3>
                  <Key size={24} color="var(--brand-secondary)" />
                </div>
                {loadingInfo ? (
                  <p className="muted-text">Loading...</p>
                ) : studentInfo?.cotId ? (
                  <div>
                    <p className="primary-value">{studentInfo.cotId.roomId?.roomNumber || '—'}</p>
                    <p className="muted-text">Block {studentInfo.cotId.roomId?.block || '—'} • Cot {studentInfo.cotId.cotNumber}</p>
                  </div>
                ) : (
                  <div>
                    <p className="warning-value">Pending Allocation</p>
                    <p className="muted-text">
                      {needsProfile ? 'Complete your profile first.' : 'The warden has not assigned a room yet.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="glass-panel animate-fade-in info-card card-attendance">
                <div className="card-title-row">
                  <h3 className="card-title-text">Verification Status</h3>
                  <CheckCircle size={24} color="var(--success)" />
                </div>
                <div>
                  {needsProfile ? (
                    <p className="warning-value">Not Submitted</p>
                  ) : isApproved ? (
                    <p className="success-value">✓ Approved</p>
                  ) : isRejected ? (
                    <p style={{ color: 'var(--danger)', fontSize: '1.5rem', fontWeight: 700 }}>✕ Rejected</p>
                  ) : (
                    <p className="warning-value">⏳ Pending</p>
                  )}
                  <p className="muted-text">
                    {needsProfile ? 'Submit profile to begin.' : isApproved ? 'Fully verified' : isRejected ? 'See remarks in Profile tab' : 'Under admin review'}
                  </p>
                </div>
              </div>

            </div>

            {/* Notifications */}
            <section className="notices-section">
              <h2 className="notices-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} /> Notices from Administration
                {unreadNotices > 0 && <span className="whatsapp-badge">{unreadNotices} new</span>}
              </h2>
              <div className="glass-panel notices-panel">
                {notifications.length === 0 ? (
                  <p className="muted-text">No new notices from the administration.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map(notif => (
                      <div key={notif._id} style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--brand-primary)',
                        display: 'flex', flexDirection: 'column', gap: '0.25rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{notif.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{notif.body}</p>
                        {notif.targetScope !== 'global' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--brand-secondary)', marginTop: '0.25rem' }}>
                            🎯 {notif.targetScope === 'individual' ? 'Personal notice' : 'Room notice'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ─── Profile ─── */}
        {activeTab === 'profile' && (
          <Profile studentInfo={studentInfo} onProfileUpdate={fetchInfo} onBack={() => handleTabChange('overview')} />
        )}

        {/* ─── Room Details ─── */}
        {activeTab === 'room' && (
          <RoomDetails
            roomId={studentInfo?.cotId?.roomId?._id || studentInfo?.cotId?.roomId}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {/* ─── Complaints ─── */}
        {activeTab === 'complaints' && (
          <Complaints
            studentHasProfile={!!studentInfo}
            onBack={() => handleTabChange('overview')}
          />
        )}

        {/* ─── Staff Directory ─── */}
        {activeTab === 'staff' && (
          <StaffList onBack={() => handleTabChange('overview')} />
        )}

        {/* ─── Food Schedule ─── */}
        {activeTab === 'food' && <FoodSchedule onBack={() => handleTabChange('overview')} />}

      </main>
    </div>
  );
};

export default StudentDashboard;
