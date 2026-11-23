import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import { LogOut, Users, Bed, CheckSquare, Bell, UserPlus, Home, Coffee, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import './admin.css';
import Approvals from './Approvals';
import Broadcast from './Broadcast';
import FoodStaff from './FoodStaff';
import Rooms from './Rooms';
import Students from './Students';
import Complaints from './Complaints';

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [stats, setStats] = useState({ totalStudents: 0, pendingApprovals: 0 });
  const [activeTab, setActiveTab] = useState('overview');

  // WhatsApp-style real-time unread badge counters
  const [unreadApprovals, setUnreadApprovals] = useState(0);
  const [unreadComplaints, setUnreadComplaints] = useState(0);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data.data;
      setStats(data);
      if (data.pendingApprovals > 0) {
        setUnreadApprovals(data.pendingApprovals);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchPendingCounts = async () => {
    try {
      const [pendingRes, complaintsRes] = await Promise.allSettled([
        api.get('/admin/verify/pending'),
        api.get('/complaints?status=open')
      ]);

      if (pendingRes.status === 'fulfilled') {
        const count = pendingRes.value.data.data?.count || pendingRes.value.data.data?.students?.length || 0;
        setUnreadApprovals(count);
      }

      if (complaintsRes.status === 'fulfilled') {
        const openCount = complaintsRes.value.data.data?.total || complaintsRes.value.data.data?.length || 0;
        setUnreadComplaints(openCount);
      }
    } catch (err) {
      console.error("Failed to fetch pending counts", err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendingCounts();
  }, []);

  // ── Real-time Socket Listeners for Admin ─────────────────────────────────
  useEffect(() => {
    let unsubApproval = null;
    let unsubComplaint = null;

    const attachListeners = () => {
      import('../../services/socket').then(({ getSocket, onSocketEvent }) => {
        const sock = getSocket();
        if (sock) {
          unsubApproval = onSocketEvent('approval:new', (data) => {
            setUnreadApprovals((prev) => prev + 1);
            setStats((prev) => ({ ...prev, pendingApprovals: (prev.pendingApprovals || 0) + 1 }));
            addToast(`New verification request from ${data.name || 'a student'}.`, 'info', 5000);
          });

          unsubComplaint = onSocketEvent('complaint:new', (data) => {
            setUnreadComplaints((prev) => prev + 1);
            addToast(`New complaint: "${data.subject || 'Action required'}".`, 'info', 5000);
          });
        }
      });
    };

    attachListeners();

    return () => {
      if (unsubApproval) unsubApproval();
      if (unsubComplaint) unsubComplaint();
    };
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'approvals') setUnreadApprovals(0);
    if (tabName === 'complaints') setUnreadComplaints(0);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="glass-panel dashboard-sidebar">
        <div>
          <h2 className="sidebar-title">Admin Portal</h2>
          <p className="sidebar-subtitle">Welcome, {user?.name || 'Warden'}</p>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => handleTabChange('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Home size={18} /> Overview
          </button>
          
          <button onClick={() => handleTabChange('approvals')} className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <CheckSquare size={18} /> 
            <span style={{ marginLeft: '0.5rem', flex: 1, textAlign: 'left' }}>Approvals</span>
            {unreadApprovals > 0 && <span className="whatsapp-badge">{unreadApprovals}</span>}
          </button>

          <button onClick={() => handleTabChange('students')} className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Users size={18} /> Students
          </button>

          <button onClick={() => handleTabChange('rooms')} className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Bed size={18} /> Room Layout
          </button>

          <button onClick={() => handleTabChange('complaints')} className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`} style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <MessageSquare size={18} /> 
            <span style={{ marginLeft: '0.5rem', flex: 1, textAlign: 'left' }}>Complaints</span>
            {unreadComplaints > 0 && <span className="whatsapp-badge">{unreadComplaints}</span>}
          </button>

          <button onClick={() => handleTabChange('broadcast')} className={`btn ${activeTab === 'broadcast' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Bell size={18} /> Broadcast
          </button>

          <button onClick={() => handleTabChange('foodstaff')} className={`btn ${activeTab === 'foodstaff' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}>
            <Coffee size={18} /> Food & Staff
          </button>
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
              <h1>Dashboard Overview</h1>
              <button className="btn btn-primary" onClick={() => handleTabChange('foodstaff')}>
                <UserPlus size={18} /> Add Staff
              </button>
            </header>

            <div className="stats-grid">
              
              <div className="glass-panel animate-fade-in stat-card card-primary">
                <h3 className="stat-title">Total Students</h3>
                <div className="stat-value-container">
                  <span className="stat-value">{stats.totalStudents || 0}</span>
                  <span className="stat-subtext-success">+12% this month</span>
                </div>
              </div>

              <div className="glass-panel animate-fade-in stat-card card-warning" onClick={() => handleTabChange('approvals')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="stat-title">Pending Approvals</h3>
                  {unreadApprovals > 0 && <span className="whatsapp-badge">{unreadApprovals}</span>}
                </div>
                <div className="stat-value-container">
                  <span className="stat-value">{stats.pendingApprovals || 0}</span>
                  <span className="stat-subtext-danger">Requires Attention</span>
                </div>
              </div>

              <div className="glass-panel animate-fade-in stat-card card-success">
                <h3 className="stat-title">Attendance Today</h3>
                <div className="stat-value-container">
                  <span className="stat-value">94%</span>
                  <span className="stat-subtext-muted">116 Present</span>
                </div>
              </div>

            </div>

            <section className="quick-action-section">
               <h2>Quick Actions</h2>
               <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                 <button className="btn btn-secondary" onClick={() => handleTabChange('approvals')}>
                   <CheckSquare size={16} /> View Approvals {unreadApprovals > 0 && `(${unreadApprovals})`}
                 </button>
                 <button className="btn btn-secondary" onClick={() => handleTabChange('students')}><Users size={16} /> Student Directory</button>
                 <button className="btn btn-secondary" onClick={() => handleTabChange('rooms')}><Bed size={16} /> Room Layout</button>
                 <button className="btn btn-secondary" onClick={() => handleTabChange('broadcast')}><Bell size={16} /> Send Broadcast</button>
                 <button className="btn btn-secondary" onClick={() => handleTabChange('foodstaff')}><Coffee size={16} /> Food & Staff</button>
               </div>
            </section>
          </>
        )}

        {activeTab === 'approvals' && <Approvals onBack={() => handleTabChange('overview')} onApproved={() => handleTabChange('rooms')} />}
        {activeTab === 'broadcast' && <Broadcast onBack={() => handleTabChange('overview')} />}
        {activeTab === 'foodstaff' && <FoodStaff onBack={() => handleTabChange('overview')} />}
        {activeTab === 'rooms' && <Rooms onBack={() => handleTabChange('overview')} />}
        {activeTab === 'students' && <Students onBack={() => handleTabChange('overview')} />}
        {activeTab === 'complaints' && <Complaints onBack={() => handleTabChange('overview')} />}

      </main>
    </div>
  );
};

export default AdminDashboard;
