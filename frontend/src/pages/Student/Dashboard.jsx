import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Home, Key, MessageCircle, FileText, CheckCircle, UserCircle, Bell } from 'lucide-react';
import api from '../../services/api';
import './student.css';
import Profile from './Profile';
import Complaints from './Complaints';
import FoodSchedule from './FoodSchedule';
import RoomDetails from './RoomDetails';

const StudentDashboard = () => {
  const { user, logout } = useAuthStore();
  const [studentInfo, setStudentInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);

  const fetchInfo = async () => {
    try {
      const response = await api.get('/students/me');
      setStudentInfo(response.data.data.student);
      
      if (response.data.data.student.verificationStatus !== 'approved') {
          setActiveTab('profile');
      }
    } catch (err) {
      console.error("Failed to fetch student info", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      // Support both paginated and non-paginated response shapes
      const data = res.data.data;
      setNotifications(Array.isArray(data) ? data : (data?.notifications || data?.items || []));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchInfo();
    fetchNotifications();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="glass-panel dashboard-sidebar">
        <div>
          <h2 className="sidebar-title">Student Hub</h2>
          <p className="sidebar-subtitle">Welcome, {user?.name || 'Student'}</p>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Home size={18} /> Overview</button>
          <button onClick={() => setActiveTab('profile')} className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><UserCircle size={18} /> Profile</button>
          <button onClick={() => setActiveTab('room')} className={`btn ${activeTab === 'room' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Key size={18} /> Room Details</button>
          <button onClick={() => setActiveTab('attendance')} className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><CheckCircle size={18} /> Attendance</button>
          <button onClick={() => setActiveTab('complaints')} className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><MessageCircle size={18} /> Complaints</button>
          <button onClick={() => setActiveTab('food')} className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><FileText size={18} /> Food Schedule</button>
        </nav>

        <button onClick={logout} className="btn sidebar-logout-btn">
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'overview' && (
          <>
            <header className="dashboard-header">
              <h1>Hello, {user?.name || 'Student'} 👋</h1>
              <p className="dashboard-header-text">Here is your hostel status for today.</p>
            </header>

            <div className="info-grid">
              
              <div className="glass-panel animate-fade-in info-card card-room">
                <div className="card-title-row">
                  <h3 className="card-title-text">Room Assignment</h3>
                  <Key size={24} color="var(--brand-secondary)" />
                </div>
                {studentInfo?.cotId ? (
                  <div>
                    <p className="primary-value">{studentInfo.cotId.roomId?.roomNumber}</p>
                    <p className="muted-text">Block {studentInfo.cotId.roomId?.block || 'A'} • Cot {studentInfo.cotId.cotNumber}</p>
                  </div>
                ) : (
                    <div>
                        <p className="warning-value">Pending Allocation</p>
                        <p className="muted-text">The warden has not assigned a room yet.</p>
                    </div>
                )}
              </div>

              <div className="glass-panel animate-fade-in info-card card-attendance">
                <div className="card-title-row">
                  <h3 className="card-title-text">Attendance Status</h3>
                  <CheckCircle size={24} color="var(--success)" />
                </div>
                <div>
                  <p className="success-value">Present</p>
                  <p className="muted-text">Marked today at 08:30 AM</p>
                </div>
              </div>

            </div>

            {/* Real Notifications from Admin */}
            <section className="notices-section">
              <h2 className="notices-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} /> Notices from Administration
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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
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
                            🎯 {notif.targetScope === 'individual' ? 'Personal notice' : `Room notice`}
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

        {activeTab === 'profile' && (
            <Profile studentInfo={studentInfo} onProfileUpdate={fetchInfo} onBack={() => setActiveTab('overview')} />
        )}
        
        {activeTab === 'room' && (
            <RoomDetails roomId={studentInfo?.cotId?.roomId?._id || studentInfo?.cotId?.roomId} onBack={() => setActiveTab('overview')} />
        )}

        {activeTab === 'complaints' && <Complaints onBack={() => setActiveTab('overview')} />}
        {activeTab === 'food' && <FoodSchedule onBack={() => setActiveTab('overview')} />}

        {/* Placeholders for other tabs for now */}
        {(activeTab === 'attendance') && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <button onClick={() => setActiveTab('overview')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ← Back to Overview
              </button>
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>This module is currently under development.</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default StudentDashboard;
