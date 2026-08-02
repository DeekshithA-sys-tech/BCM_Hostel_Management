import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Phone, Mail, ArrowLeft, Shield, Utensils, Wrench } from 'lucide-react';

const StaffList = ({ onBack }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await api.get('/staff');
                setStaff(res.data.data?.staff || []);
            } catch (err) {
                console.error('Failed to fetch staff:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const getRoleIcon = (role) => {
        const r = (role || '').toLowerCase();
        if (r.includes('cook') || r.includes('chef') || r.includes('food')) return <Utensils size={18} color="var(--brand-primary)" />;
        if (r.includes('security') || r.includes('guard')) return <Shield size={18} color="var(--warning)" />;
        return <Wrench size={18} color="var(--brand-secondary)" />;
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                Loading Hostel Staff Directory...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {onBack && (
                <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Overview
                </button>
            )}

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', marginBottom: '0.5rem' }}>
                    <Users size={24} /> Hostel Staff & Support Directory
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Contact numbers and roles of hostel warden, mess cooks, security, and maintenance personnel.
                </p>

                {staff.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Users size={40} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: '1rem' }}>No staff contacts published yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {staff.map((s) => (
                            <div key={s._id} style={{
                                padding: '1.5rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                transition: 'transform 0.2s, border-color 0.2s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{s.name}</h3>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                        {getRoleIcon(s.role)}
                                    </div>
                                </div>

                                <div>
                                    <span style={{
                                        display: 'inline-block',
                                        fontSize: '0.75rem', padding: '0.2rem 0.65rem',
                                        borderRadius: '20px', background: 'rgba(78, 205, 196, 0.12)',
                                        color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase'
                                    }}>
                                        {s.role}
                                    </span>
                                </div>

                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
                                    {s.mobile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                            <Phone size={15} color="var(--success)" />
                                            <a href={`tel:${s.mobile}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                                                {s.mobile}
                                            </a>
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                            Contact number not available
                                        </div>
                                    )}

                                    {s.email && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            <Mail size={15} color="var(--brand-secondary)" />
                                            <span>{s.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffList;
