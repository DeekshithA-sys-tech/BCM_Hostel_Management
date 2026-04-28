import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { MessageSquare, Check, CornerDownRight, ArrowLeft } from 'lucide-react';

const Complaints = ({ onBack }) => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyState, setReplyState] = useState({ id: null, text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/complaints?limit=100');
            setComplaints(res.data.data.complaints || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const handleResolve = async (id) => {
        if (!replyState.text.trim()) return;
        setIsSubmitting(true);
        try {
            await api.put(`/complaints/${id}/status`, { status: 'resolved', resolution: replyState.text });
            setReplyState({ id: null, text: '' });
            fetchComplaints();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading complaints...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Back Button */}
            <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Overview
            </button>

            <h2 style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={24} /> Student Complaints
            </h2>

            {complaints.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No complaints recorded in the system.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {complaints.map(comp => (
                        <div key={comp._id} className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, color: 'var(--brand-secondary)' }}>{comp.subject}</h3>
                                <span style={{ 
                                    padding: '0.2rem 0.5rem', 
                                    borderRadius: '4px', 
                                    fontSize: '0.8rem',
                                    background: comp.status === 'resolved' ? 'var(--success)' : 'var(--warning)',
                                    color: '#fff'
                                }}>
                                    {comp.status?.toUpperCase()}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority: {comp.priority} | Category: {comp.category}</span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>{comp.description}</p>
                            
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                <strong>Reported by:</strong> {comp.studentId?.userId?.name || 'Unknown'} ({comp.studentId?.sspId}) on {new Date(comp.createdAt).toLocaleDateString()}
                            </div>

                            {comp.resolution && (
                                <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--brand-primary)', borderRadius: '0 4px 4px 0' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', alignItems: 'center', fontSize: '0.85rem' }}>
                                        <CornerDownRight size={14} /> <strong>Your Reply:</strong>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{comp.resolution}</p>
                                </div>
                            )}

                            {comp.status !== 'resolved' && (
                                <div style={{ marginTop: '1rem' }}>
                                    {replyState.id === comp._id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <textarea
                                                className="input-field"
                                                rows="3"
                                                placeholder="Write your reply / resolution..."
                                                value={replyState.text}
                                                onChange={(e) => setReplyState(s => ({ ...s, text: e.target.value }))}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleResolve(comp._id)}
                                                    disabled={isSubmitting || !replyState.text.trim()}
                                                    className="btn btn-primary"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <Check size={16} /> {isSubmitting ? 'Sending...' : 'Submit Reply & Resolve'}
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => setReplyState({ id: null, text: '' })}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setReplyState({ id: comp._id, text: '' })}
                                            className="btn btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Check size={16} /> Mark Resolved & Reply
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Complaints;
