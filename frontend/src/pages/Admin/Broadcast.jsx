import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import useToastStore from '../../store/useToastStore';
import { Bell, Send, ArrowLeft, Zap, Users, User, Bed, Search } from 'lucide-react';

const Broadcast = ({ onBack }) => {
    const addToast = useToastStore((s) => s.addToast);
    const [formData, setFormData] = useState({ title: '', body: '', targetScope: 'global', roomId: '', studentId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recentBroadcasts, setRecentBroadcasts] = useState([]);

    // Student search
    const [allStudents, setAllStudents] = useState([]);
    const [stuSearch, setStuSearch]     = useState('');
    const [stuDropdown, setStuDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const stuRef = useRef(null);

    // Room search
    const [allRooms, setAllRooms]     = useState([]);
    const [roomSearch, setRoomSearch] = useState('');
    const [roomDropdown, setRoomDropdown] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const roomRef = useRef(null);

    useEffect(() => {
        // ── Fetch with module-level cache (avoids 429 on repeated tab opens) ────
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();

        // Recent broadcasts — always fresh (small payload)
        api.get('/notifications?limit=15').then(res => {
            const d = res.data.data;
            setRecentBroadcasts(Array.isArray(d) ? d : []);
        }).catch(() => {});

        // Students list — cached
        if (!Broadcast._stuCache || now - Broadcast._stuCacheTime > CACHE_TTL) {
            api.get('/students?limit=1000').then(res => {
                const data = res.data.data || [];
                Broadcast._stuCache = data;
                Broadcast._stuCacheTime = Date.now();
                setAllStudents(data);
            }).catch(() => {});
        } else {
            setAllStudents(Broadcast._stuCache);
        }

        // Rooms list — cached
        if (!Broadcast._roomCache || now - Broadcast._roomCacheTime > CACHE_TTL) {
            api.get('/rooms').then(res => {
                const data = res.data.data?.rooms || [];
                Broadcast._roomCache = data;
                Broadcast._roomCacheTime = Date.now();
                setAllRooms(data);
            }).catch(() => {});
        } else {
            setAllRooms(Broadcast._roomCache);
        }
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (stuRef.current && !stuRef.current.contains(e.target)) setStuDropdown(false);
            if (roomRef.current && !roomRef.current.contains(e.target)) setRoomDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredStudents = allStudents.filter(s => {
        const q = stuSearch.toLowerCase();
        return !q || s.userId?.name?.toLowerCase().includes(q) || s.sspId?.toLowerCase().includes(q);
    }).slice(0, 10);

    const filteredRooms = allRooms.filter(r => {
        const q = roomSearch.toLowerCase();
        return !q || r.roomNumber?.toLowerCase().includes(q) || String(r.floor || '').includes(q);
    }).slice(0, 10);

    const handleScopeChange = (scope) => {
        setFormData(p => ({ ...p, targetScope: scope, roomId: '', studentId: '' }));
        setSelectedStudent(null); setSelectedRoom(null);
        setStuSearch(''); setRoomSearch('');
    };

    const selectStudent = (stu) => {
        setSelectedStudent(stu);
        setFormData(p => ({ ...p, studentId: stu._id }));
        setStuSearch(stu.userId?.name || stu.sspId);
        setStuDropdown(false);
    };

    const selectRoom = (room) => {
        setSelectedRoom(room);
        setFormData(p => ({ ...p, roomId: room._id }));
        setRoomSearch(`Room ${room.roomNumber}${room.block ? ' (Block ' + room.block + ')' : ''}`);
        setRoomDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.body.trim()) {
            addToast('Please fill in both title and message.', 'warning'); return;
        }
        if (formData.targetScope === 'room' && !formData.roomId) {
            addToast('Please select a room.', 'warning'); return;
        }
        if (formData.targetScope === 'individual' && !formData.studentId) {
            addToast('Please select a student.', 'warning'); return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: formData.title.trim(),
                body: formData.body.trim(),
                targetScope: formData.targetScope,
                ...(formData.targetScope === 'room'       ? { roomId: formData.roomId }       : {}),
                ...(formData.targetScope === 'individual' ? { studentId: formData.studentId } : {}),
            };
            const res = await api.post('/notifications', payload);
            addToast('Broadcast sent! Students receive it instantly via WebSocket.', 'success', 5000);

            const created = res.data.data?.notification;
            if (created) setRecentBroadcasts(prev => [created, ...prev.slice(0, 14)]);

            setFormData({ title: '', body: '', targetScope: 'global', roomId: '', studentId: '' });
            setSelectedStudent(null); setSelectedRoom(null);
            setStuSearch(''); setRoomSearch('');
        } catch (err) {
            addToast(err.response?.data?.message || err.apiMessage || 'Failed to send broadcast.', 'error');
        } finally { setIsSubmitting(false); }
    };

    const scopeConfig = [
        { key: 'global',     Icon: Users, label: 'All Students' },
        { key: 'room',       Icon: Bed,   label: 'Specific Room' },
        { key: 'individual', Icon: User,  label: 'One Student' },
    ];

    const scopeLabel = { global: 'All', room: 'Room', individual: '1:1' };
    const scopeColor = { global: 'var(--brand-primary)', room: 'var(--warning)', individual: 'var(--success)' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <button onClick={onBack} className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Overview
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite', display: 'block' }} />
                <Zap size={14} color="var(--success)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                    WebSocket Active — broadcasts deliver instantly to connected students
                </span>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>

                {/* Compose Form */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', marginBottom: '1.5rem' }}>
                        <Bell size={22} /> Compose Broadcast
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="input-label">Notice Title *</label>
                            <input type="text" className="input-field"
                                value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Water Supply Interruption" required />
                        </div>

                        <div>
                            <label className="input-label">Target Audience</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
                                {scopeConfig.map(({ key, Icon, label }) => (
                                    <button key={key} type="button" onClick={() => handleScopeChange(key)}
                                        style={{
                                            padding: '0.6rem', borderRadius: '8px', cursor: 'pointer',
                                            border: `2px solid ${formData.targetScope === key ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                                            background: formData.targetScope === key ? 'rgba(78,205,196,0.1)' : 'transparent',
                                            color: formData.targetScope === key ? 'var(--brand-primary)' : 'var(--text-muted)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                            fontSize: '0.8rem', fontWeight: formData.targetScope === key ? 700 : 400, transition: 'all 0.18s'
                                        }}>
                                        <Icon size={15} /> {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Room picker */}
                        {formData.targetScope === 'room' && (
                            <div ref={roomRef} style={{ position: 'relative' }}>
                                <label className="input-label">Room Number *</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input type="text" className="input-field" style={{ paddingLeft: '2.25rem' }}
                                        value={roomSearch}
                                        onChange={e => { setRoomSearch(e.target.value); setRoomDropdown(true); setSelectedRoom(null); setFormData(p => ({ ...p, roomId: '' })); }}
                                        onFocus={() => setRoomDropdown(true)}
                                        placeholder="Search by room number..." />
                                </div>
                                {roomDropdown && filteredRooms.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                                        {filteredRooms.map(r => (
                                            <div key={r._id} onClick={() => selectRoom(r)}
                                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <span style={{ fontWeight: 600 }}>Room {r.roomNumber}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Floor {r.floor}{r.block ? ' · ' + r.block : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedRoom && <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--success)' }}>✓ Room {selectedRoom.roomNumber} selected</p>}
                            </div>
                        )}

                        {/* Student picker */}
                        {formData.targetScope === 'individual' && (
                            <div ref={stuRef} style={{ position: 'relative' }}>
                                <label className="input-label">Student Name / SSP ID *</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                    <input type="text" className="input-field" style={{ paddingLeft: '2.25rem' }}
                                        value={stuSearch}
                                        onChange={e => { setStuSearch(e.target.value); setStuDropdown(true); setSelectedStudent(null); setFormData(p => ({ ...p, studentId: '' })); }}
                                        onFocus={() => setStuDropdown(true)}
                                        placeholder="Type name or SSP ID..." />
                                </div>
                                {stuDropdown && filteredStudents.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                                        {filteredStudents.map(s => (
                                            <div key={s._id} onClick={() => selectStudent(s)}
                                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <span style={{ fontWeight: 600 }}>{s.userId?.name}</span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.sspId}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedStudent && <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: 'var(--success)' }}>✓ {selectedStudent.userId?.name} ({selectedStudent.sspId}) selected</p>}
                            </div>
                        )}

                        <div>
                            <label className="input-label">Message *</label>
                            <textarea className="input-field" rows="5"
                                value={formData.body}
                                onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                                placeholder="Write your announcement here..." required />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem' }}>
                            {isSubmitting
                                ? <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} /> Sending...</>
                                : <><Send size={16} /> Push Broadcast</>}
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        </button>
                    </form>
                </div>

                {/* Recent Broadcasts */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ color: 'var(--brand-secondary)', marginTop: 0, marginBottom: '1.25rem' }}>Recent Broadcasts</h3>
                    {recentBroadcasts.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No broadcasts sent yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
                            {recentBroadcasts.map((n, i) => (
                                <div key={n._id || i} style={{
                                    padding: '0.875rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px',
                                    borderLeft: `3px solid ${scopeColor[n.targetScope] || 'var(--border-color)'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{n.title}</span>
                                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '20px', background: 'var(--bg-primary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                                            {scopeLabel[n.targetScope] || n.targetScope}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>{n.body}</p>
                                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Broadcast;
