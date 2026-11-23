import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useToastStore from '../../store/useToastStore';
import { onSocketEvent, joinComplaintRoom } from '../../services/socket';
import { MessageCircle, AlertCircle, ArrowLeft, Send, Clock, CheckCircle } from 'lucide-react';

const STATUS_CONFIG = {
    open:        { color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)',  label: 'Open' },
    in_progress: { color: 'var(--info)',    bg: 'rgba(14,165,233,0.12)', label: 'In Progress' },
    resolved:    { color: 'var(--success)', bg: 'rgba(16,185,129,0.12)', label: 'Resolved' },
};

const Complaints = ({ onBack, studentHasProfile }) => {
    const addToast = useToastStore((s) => s.addToast);
    const [complaints, setComplaints] = useState([]);
    const [loadingComplaints, setLoadingComplaints] = useState(true);
    const [formData, setFormData] = useState({ subject: '', category: 'maintenance', priority: 'medium', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const fetchComplaints = useCallback(async () => {
        try {
            setLoadingComplaints(true);
            const res = await api.get('/complaints');
            const raw = res.data.data;
            const list = Array.isArray(raw) ? raw : (raw?.complaints || raw?.items || []);
            setComplaints(list);

            // Join socket rooms for each existing complaint (for real-time updates)
            list.forEach(c => joinComplaintRoom(c._id));
        } catch (err) {
            console.error('Fetch complaints error:', err.apiMessage);
        } finally {
            setLoadingComplaints(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();

        // ── Real-time: listen for complaint updates from admin ─────────────────
        const unsub = onSocketEvent('complaint:updated', (updated) => {
            setComplaints(prev => prev.map(c =>
                c._id === updated._id ? { ...c, ...updated } : c
            ));
            if (updated.status === 'resolved') {
                addToast(`Your complaint "${updated.subject}" has been marked as resolved.`, 'success', 5000);
            } else {
                addToast(`Complaint update: status changed to ${updated.status}.`, 'info');
            }
        });

        return () => unsub();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        if (!studentHasProfile) {
            addToast('Please complete your profile before submitting a complaint.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await api.post('/complaints', formData);
            const newComplaint = res.data.data?.complaint;
            addToast('Complaint submitted successfully.', 'success');
            setFormData({ subject: '', category: 'maintenance', priority: 'medium', description: '' });

            // Add to local state and join its socket room
            if (newComplaint) {
                setComplaints(prev => [newComplaint, ...prev]);
                joinComplaintRoom(newComplaint._id);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.apiMessage || 'Failed to submit complaint.';
            addToast(msg, 'error');
            if (err.validation?.fieldMap) setFieldErrors(err.validation.fieldMap);
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

            {/* ── Submit form ── */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-secondary)', marginBottom: '1.5rem' }}>
                    <MessageCircle size={22} /> Lodge a Complaint
                </h2>

                {/* Guard: profile not completed */}
                {!studentHasProfile && (
                    <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid var(--warning)', borderRadius: '8px', marginBottom: '1.25rem' }}>
                        <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, color: 'var(--warning)', fontSize: '0.9rem' }}>
                            Complete your <strong>Profile</strong> first before submitting complaints.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="input-label">Subject *</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange}
                            className="input-field" placeholder="Brief summary of the issue" required disabled={!studentHasProfile} />
                        {fieldErrors.subject && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.subject}</p>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="input-label">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="input-field" disabled={!studentHasProfile}>
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
                            <select name="priority" value={formData.priority} onChange={handleChange} className="input-field" disabled={!studentHasProfile}>
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Description *</label>
                        <textarea name="description" value={formData.description} onChange={handleChange}
                            className="input-field" rows="4" required placeholder="Describe the issue in detail..."
                            disabled={!studentHasProfile} />
                        {fieldErrors.description && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fieldErrors.description}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary"
                        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        disabled={isSubmitting || !studentHasProfile}>
                        {isSubmitting
                            ? <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} /> Submitting...</>
                            : <><Send size={16} /> Submit Complaint</>}
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </button>
                </form>
            </div>

            {/* ── History ── */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} /> Complaint History
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                        (updates in real-time)
                    </span>
                </h2>

                {loadingComplaints ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading complaints...</p>
                ) : complaints.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No complaints submitted yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {complaints.map(comp => {
                            const s = STATUS_CONFIG[comp.status] || STATUS_CONFIG.open;
                            return (
                                <div key={comp._id} style={{
                                    border: `1px solid ${comp.status === 'resolved' ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
                                    padding: '1.25rem',
                                    borderRadius: '10px',
                                    background: 'var(--bg-secondary)',
                                    transition: 'border-color 0.3s'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <h4 style={{ color: 'var(--brand-primary)', margin: 0 }}>{comp.subject}</h4>
                                        <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.7rem', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: 700 }}>
                                            {s.label}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', lineHeight: 1.5 }}>{comp.description}</p>
                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                        <span>📂 {comp.category}</span>
                                        <span>⚡ {comp.priority} priority</span>
                                        <span>📅 {new Date(comp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>

                                    {comp.resolution && (
                                        <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid var(--success)', borderRadius: '0 6px 6px 0' }}>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                                                <CheckCircle size={14} /> Warden's Response
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: 'auto' }}>
                                                    <Zap size={11} /> live
                                                </span>
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{comp.resolution}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Complaints;
