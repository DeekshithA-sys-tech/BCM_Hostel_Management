import React, { useState } from 'react';
import api from '../../services/api';
import { Bell, Send, ArrowLeft } from 'lucide-react';

const Broadcast = ({ onBack }) => {
    const [formData, setFormData] = useState({ title: '', body: '', targetScope: 'global', roomId: '', studentId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            await api.post('/notifications', formData);
            setMessage('Broadcast sent successfully.');
            setFormData({ title: '', body: '', targetScope: 'global', roomId: '', studentId: '' });
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || 'Failed to send broadcast.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Back Button */}
            <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Overview
            </button>

            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
                    <Bell size={24} /> Send Broadcast Notice
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Send real-time alerts to students globally, per room, or individually.
                </p>

                {message && <div style={{ padding: '1rem', background: 'var(--bg-secondary)', color: 'var(--info)', marginBottom: '1rem', borderRadius: '4px' }}>{message}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="input-label">Notice Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" required />
                    </div>

                    <div>
                        <label className="input-label">Target Scope</label>
                        <select name="targetScope" value={formData.targetScope} onChange={handleChange} className="input-field">
                            <option value="global">Global (All Students)</option>
                            <option value="room">Specific Room</option>
                            <option value="individual">Specific Student</option>
                        </select>
                    </div>

                    {formData.targetScope === 'room' && (
                        <div>
                            <label className="input-label">Room ID</label>
                            <input type="text" name="roomId" value={formData.roomId} onChange={handleChange} className="input-field" placeholder="Enter Room Object ID" required />
                        </div>
                    )}

                    {formData.targetScope === 'individual' && (
                        <div>
                            <label className="input-label">Student ID</label>
                            <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} className="input-field" placeholder="Enter Student Object ID" required />
                        </div>
                    )}

                    <div>
                        <label className="input-label">Message Body</label>
                        <textarea name="body" value={formData.body} onChange={handleChange} className="input-field" rows="6" required></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : <><Send size={18} /> Push Broadcast</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Broadcast;
