import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Coffee } from 'lucide-react';

const FoodSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFood = async () => {
            try {
                const res = await api.get('/food');
                setSchedule(res.data.data.schedule || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFood();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading menu...</div>;

    const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
            </div>
        </div>
    );
};

export default FoodSchedule;
