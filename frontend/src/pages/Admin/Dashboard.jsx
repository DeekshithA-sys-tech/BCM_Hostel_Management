import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, Users, Bed, CheckSquare, Bell, UserPlus, Home, Coffee } from 'lucide-react';
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
  const [stats, setStats] = useState({ totalStudents: 0, pendingApprovals: 0 });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="glass-panel dashboard-sidebar">
        <div>
          <h2 className="sidebar-title">Admin Portal</h2>
          <p className="sidebar-subtitle">Welcome, {user?.name || 'Warden'}</p>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Home size={18} /> Overview</button>
          <button onClick={() => setActiveTab('approvals')} className={`btn ${activeTab === 'approvals' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><CheckSquare size={18} /> Approvals</button>
          <button onClick={() => setActiveTab('students')} className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Users size={18} /> Students</button>
          <button onClick={() => setActiveTab('rooms')} className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Bed size={18} /> Room Layout</button>
          <button onClick={() => setActiveTab('complaints')} className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><CheckSquare size={18} /> Complaints</button>
          <button onClick={() => setActiveTab('broadcast')} className={`btn ${activeTab === 'broadcast' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Bell size={18} /> Broadcast</button>
          <button onClick={() => setActiveTab('foodstaff')} className={`btn ${activeTab === 'foodstaff' ? 'btn-primary' : 'btn-secondary'} sidebar-nav-btn`}><Coffee size={18} /> Food & Staff</button>
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
              {/* Fixed: clicking Add Staff navigates to the Food & Staff tab */}
              <button className="btn btn-primary" onClick={() => setActiveTab('foodstaff')}>
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

              <div className="glass-panel animate-fade-in stat-card card-warning">
                <h3 className="stat-title">Pending Approvals</h3>
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
                 <button className="btn btn-secondary" onClick={() => setActiveTab('approvals')}><CheckSquare size={16} /> View Approvals</button>
                 <button className="btn btn-secondary" onClick={() => setActiveTab('students')}><Users size={16} /> Student Directory</button>
                 <button className="btn btn-secondary" onClick={() => setActiveTab('rooms')}><Bed size={16} /> Room Layout</button>
                 <button className="btn btn-secondary" onClick={() => setActiveTab('broadcast')}><Bell size={16} /> Send Broadcast</button>
                 <button className="btn btn-secondary" onClick={() => setActiveTab('foodstaff')}><Coffee size={16} /> Food & Staff</button>
               </div>
            </section>
          </>
        )}

        {activeTab === 'approvals' && <Approvals onBack={() => setActiveTab('overview')} onApproved={() => setActiveTab('rooms')} />}
        {activeTab === 'broadcast' && <Broadcast onBack={() => setActiveTab('overview')} />}
        {activeTab === 'foodstaff' && <FoodStaff onBack={() => setActiveTab('overview')} />}
        {activeTab === 'rooms' && <Rooms onBack={() => setActiveTab('overview')} />}
        {activeTab === 'students' && <Students onBack={() => setActiveTab('overview')} />}
        {activeTab === 'complaints' && <Complaints onBack={() => setActiveTab('overview')} />}

        {/* Placeholders for other tabs for now */}
      </main>
    </div>
  );
};

export default AdminDashboard;
