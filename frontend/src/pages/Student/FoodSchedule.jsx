import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Coffee, ArrowLeft, Users, Phone } from 'lucide-react';

const FoodSchedule = ({ onBack }) => {
    const [schedule, setSchedule] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFoodAndStaff = async () => {
            try {
                const [foodRes, staffRes] = await Promise.allSettled([
                    api.get('/food'),
                    api.get('/staff')
                ]);
                
                if (foodRes.status === 'fulfilled') {
                    setSchedule(foodRes.value.data.data.schedule || []);
                }
                if (staffRes.status === 'fulfilled') {
                    setStaff(staffRes.value.data.data.staff || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFoodAndStaff();
    }, []);

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading menu and staff details...</div>;

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {onBack && (
                <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Overview
                </button>
            )}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', marginBottom: '1.5rem' }}>
                    <Coffee size={24} /> Weekly Mess Schedule
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {schedule.map((day) => {
                        const isToday = day.weekday === todayDate;
                        return (
                            <div key={day.weekday} style={{ 
                                border: isToday ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)', 
                                padding: '1.5rem', 
                                borderRadius: '8px',
                                background: isToday ? 'rgba(78, 205, 196, 0.05)' : 'transparent'
                            }}>
                                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                                    {day.weekday} {isToday && '(Today)'}
                                </h3>
                                
                                {day.meals && day.meals.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {day.meals.map((meal, idx) => (
                                            <div key={idx}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>{meal.type}</div>
                                                <div style={{ color: 'var(--text-primary)' }}>{meal.items.join(', ') || 'Chef\'s Special'}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No menu configured for {day.weekday}.</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Mess & Hostel Staff Roster Section */}
                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
                        <Users size={20} /> Mess & Support Staff
                    </h3>
                    {staff.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No staff listed.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                            {staff.map(s => (
                                <div key={s._id} style={{
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--brand-secondary)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>
                                        {s.role}
                                    </div>
                                    {s.mobile && (
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Phone size={13} color="var(--success)" /> {s.mobile}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FoodSchedule;
