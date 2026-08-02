import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import useToastStore from '../../store/useToastStore';
import { onSocketEvent } from '../../services/socket';
import { MessageSquare, Check, CornerDownRight, ArrowLeft, Zap, Clock, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
    open:        { color: 'var(--warning)', bg: 'rgba(245,158,11,0.12)',   label: 'Open' },
    in_progress: { color: 'var(--info)',    bg: 'rgba(14,165,233,0.12)',   label: 'In Progress' },
    resolved:    { color: 'var(--success)', bg: 'rgba(16,185,129,0.12)',   label: 'Resolved' },
};

const AdminComplaints = ({ onBack }) => {
    const addToast = useToastStore((s) => s.addToast);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyState, setReplyState] = useState({ id: null, text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCount, setNewCount] = useState(0); // real-time new complaint count

    const fetchComplaints = useCallback(async () => {
        try {
            const res = await api.get('/complaints?limit=100');
            const raw = res.data.data;
            setComplaints(Array.isArray(raw) ? raw : (raw?.complaints || raw?.items || []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();

        // ── Real-time: listen for new complaints from students ────────────────
        const unsubNew = onSocketEvent('complaint:new', (complaint) => {
            setComplaints(prev => [complaint, ...prev]);
            setNewCount(n => n + 1);
            addToast(`🆕 New complaint from ${complaint.studentId?.userId?.name || 'a student'}: "${complaint.subject}"`, 'info', 6000);
        });

        // ── Real-time: listen for complaint updates ────────────────────────────
        const unsubUpdate = onSocketEvent('complaint:updated', (updated) => {
            setComplaints(prev => prev.map(c =>
                c._id === updated._id ? { ...c, ...updated } : c
            ));
        });

        return () => {
            unsubNew();
            unsubUpdate();
        };
    }, []);

    const handleResolve = async (id) => {
        if (!replyState.text.trim()) {
            addToast('Please write a reply before resolving.', 'warning');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.patch(`/complaints/${id}/status`, { status: 'resolved', resolution: replyState.text });
            addToast('Complaint resolved & student notified in real-time!', 'success');
            setReplyState({ id: null, text: '' });
            // Optimistic update
            setComplaints(prev => prev.map(c =>
                c._id === id ? { ...c, status: 'resolved', resolution: replyState.text } : c
            ));
        } catch (err) {
            addToast(err.response?.data?.message || err.apiMessage || 'Failed to resolve complaint.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCount = complaints.filter(c => c.status === 'open').length;
    const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

    if (loading) return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading complaints...
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <button onClick={onBack} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Overview
                </button>

                {/* Real-time indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite', display: 'block' }} />
                    <Zap size={12} color="var(--success)" />
                    <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>Live Updates Active</span>
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                </div>
            </div>

            <h2 style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <MessageSquare size={24} /> Student Complaints
                {newCount > 0 && (
                    <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'var(--danger)', color: '#fff', fontWeight: 700 }}>
                        +{newCount} new
                    </span>
                )}
            </h2>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total', value: complaints.length, color: 'var(--text-primary)' },
                    { label: 'Open', value: openCount, color: 'var(--warning)' },
                    { label: 'Resolved', value: resolvedCount, color: 'var(--success)' },
                ].map(stat => (
                    <div key={stat.label} style={{ padding: '0.6rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.label}: </span>
                        <span style={{ fontWeight: 700, color: stat.color }}>{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Complaints list */}
            {complaints.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <MessageSquare size={40} color="var(--text-muted)" />
                    <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No complaints recorded in the system.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {complaints.map(comp => {
                        const s = STATUS_CONFIG[comp.status] || STATUS_CONFIG.open;
                        return (
                            <div key={comp._id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, color: 'var(--brand-secondary)', flex: 1 }}>{comp.subject}</h3>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', background: s.bg, color: s.color, fontWeight: 700 }}>
                                        {s.label}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {comp.priority?.toUpperCase()} | {comp.category}
                                    </span>
                                </div>

                                <p style={{ margin: '0 0 0.75rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{comp.description}</p>

                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <span>👤 {comp.studentId?.userId?.name || 'Unknown'} ({comp.studentId?.sspId})</span>
                                    <span>📅 {new Date(comp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>

                                {/* Existing resolution */}
                                {comp.resolution && (
                                    <div style={{ padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.08)', borderLeft: '3px solid var(--success)', borderRadius: '0 6px 6px 0', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 700, alignItems: 'center' }}>
                                            <CornerDownRight size={14} /> Your Reply
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{comp.resolution}</p>
                                    </div>
                                )}

                                {/* Reply / Resolve form */}
                                {comp.status !== 'resolved' && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        {replyState.id === comp._id ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <textarea
                                                    className="input-field"
                                                    rows="3"
                                                    placeholder="Write your resolution reply... (student will see this instantly)"
                                                    value={replyState.text}
                                                    onChange={(e) => setReplyState(s => ({ ...s, text: e.target.value }))}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <button onClick={() => handleResolve(comp._id)} disabled={isSubmitting || !replyState.text.trim()}
                                                        className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Check size={16} />
                                                        {isSubmitting ? 'Sending...' : 'Submit & Resolve'}
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => setReplyState({ id: null, text: '' })}>Cancel</button>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                        <Zap size={12} /> Student notified via WebSocket
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={() => setReplyState({ id: comp._id, text: '' })}
                                                className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Check size={16} /> Reply & Resolve
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
