import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Shield, Users, Calendar, Phone, BookOpen, User } from 'lucide-react';
import './landing.css';

const Landing = () => {
  return (
    <div className="page-container landing-container">
      <header className="glass-panel landing-header">
        <h2 className="landing-brand">
          <Home size={28} color="var(--brand-primary)" />
          Enterprise HMS
        </h2>
        <nav>
          <Link to="/auth" className="btn btn-primary">Portal Login</Link>
        </nav>
      </header>

      <main className="landing-main animate-fade-in">
        <h1 className="landing-title">
          BCM  Hostel Management
        </h1>
        <p className="landing-subtitle">
          A secure, scalable, and intelligent platform for managing student lifecycles, room allocations, and attendance administration seamlessly.
        </p>

        <section className="glass-panel info-section" style={{ textAlign: 'left', marginBottom: '3rem', padding: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', marginBottom: '1rem' }}>
            <BookOpen size={24} /> Vision & Mission
          </h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            <strong>Vision:</strong> To provide a safe, inclusive, and conducive living environment that empowers students to achieve academic excellence and personal growth.
          </p>
          <p style={{ lineHeight: '1.6' }}>
            <strong>Mission:</strong> Our mission is to seamlessly integrate intelligent management systems that ensure transparent administration, optimized resource allocation, and a supportive community for all residents under the Backward Classes Welfare Department.
          </p>
        </section>

        <div className="features-grid">
          <div className="glass-panel feature-card">
            <Shield size={48} color="var(--success)" />
            <h3>Secure Verification</h3>
            <p className="feature-desc">Robust document upload & admin verification workflows to ensure absolute security.</p>
          </div>

          <div className="glass-panel feature-card">
            <Users size={48} color="var(--info)" />
            <h3>Room Allocation</h3>
            <p className="feature-desc">Dynamic room plotting and smart cot allocation algorithms ensuring optimized capacities.</p>
          </div>

          <div className="glass-panel feature-card">
            <Calendar size={48} color="var(--warning)" />
            <h3>Real-time Attendance</h3>
            <p className="feature-desc">Daily tracking mechanics linked with automated notification channels for absolute transparency.</p>
          </div>
        </div>

        <section className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem', textAlign: 'left' }}>
          <div className="glass-panel">
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                <User size={20} color="var(--brand-primary)" /> Warden Contact
             </h3>
             <p style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> Mr. Ramesh Kumar</p>
             <p style={{ marginBottom: '0.5rem' }}><strong>Title:</strong> Chief Warden, BCM Hostel</p>
             <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> +91 98765 43210</p>
          </div>
          <div className="glass-panel">
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                <Phone size={20} color="var(--brand-secondary)" /> BCWD Office
             </h3>
             <p style={{ marginBottom: '0.5rem' }}>Backward Classes Welfare Department</p>
             <p style={{ marginBottom: '0.5rem' }}>District Office, Main Circle</p>
             <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> 080-12345678</p>
          </div>
        </section>

      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Enterprise HMS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
