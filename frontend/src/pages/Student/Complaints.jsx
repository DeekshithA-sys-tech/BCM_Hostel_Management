import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MessageCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const Complaints = ({ onBack }) => {
    const [complaints, setComplaints] = useState([]);
    const [formData, setFormData] = useState({ subject: '', category: 'maintenance', priority: 'medium', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/complaints');
            setComplaints(res.data.data.complaints || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            await api.post('/complaints', formData);
            setMessage('Complaint lodged successfully.');
            setFormData({ subject: '', category: 'maintenance', priority: 'medium', description: '' });
            fetchComplaints();
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || 'Failed to lodge complaint.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {onBack && (
                <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Overview
                </button>
            )}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', marginBottom: '1.5rem' }}>
                    <MessageCircle size={24} /> Lodge a Complaint
                </h2>
                {message && <div style={{ padding: '1rem', background: 'var(--bg-secondary)', color: 'var(--info)', marginBottom: '1rem', borderRadius: '4px' }}>{message}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="input-label">Subject</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="input-field" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="input-label">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="input-field">
                                <option value="maintenance">Maintenance</option>
                                <option value="food">Food</option>
                                <option value="security">Security</option>
                                <option value="facilities">Facilities</option>
                                <option value="staff">Staff</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className="input-field">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="input-label">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows="4" required></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                </form>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Complaint History</h2>
                {complaints.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No complaints submitted yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {complaints.map(comp => (
                            <div key={comp._id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ color: 'var(--brand-primary)', margin: 0 }}>{comp.subject}</h4>
                                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: comp.status === 'open' ? 'var(--warning)' : 'var(--success)' }}>
                                        {comp.status.toUpperCase()}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{comp.description}</p>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <span>Category: {comp.category}</span>
                                    <span>Priority: {comp.priority}</span>
                                    <span>Added: {new Date(comp.createdAt).toLocaleDateString()}</span>
                                </div>
                                {comp.resolution && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--success)', borderRadius: '4px' }}>
                                        <strong style={{ color: 'var(--success)', display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Warden's Reply:</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{comp.resolution}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Complaints;
