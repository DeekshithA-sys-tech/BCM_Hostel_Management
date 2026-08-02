import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useToastStore from '../../store/useToastStore';
import { Users, Trash2, ArrowLeft, AlertTriangle, Search, X, Eye,
         CheckCircle, Clock, XCircle, Phone, Mail, MapPin, BookOpen, User } from 'lucide-react';

// ── Student Detail Modal ──────────────────────────────────────────────────────
const StudentModal = ({ student, onClose }) => {
    if (!student) return null;

    const statusConfig = {
        approved: { color: 'var(--success)', icon: <CheckCircle size={16} />, label: 'Approved' },
        pending:  { color: 'var(--warning)', icon: <Clock size={16} />,        label: 'Pending Review' },
        rejected: { color: 'var(--danger)',  icon: <XCircle size={16} />,      label: 'Rejected' },
    };
    const sc = statusConfig[student.verificationStatus] || statusConfig.pending;

    const Field = ({ label, value }) => value ? (
        <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</p>
        </div>
    ) : null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: '16px', width: '100%', maxWidth: '680px',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}>
                {/* Modal Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={24} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{student.userId?.name}</h2>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{student.sspId}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: `${sc.color}18`, color: sc.color, fontWeight: 700, fontSize: '0.82rem' }}>
                            {sc.icon} {sc.label}
                        </span>
                        <button onClick={onClose} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px', padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center' }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    {/* Contact & Personal */}
                    <div>
                        <h4 style={{ color: 'var(--brand-primary)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> Personal Info
                        </h4>
                        <Field label="Full Name" value={student.userId?.name} />
                        <Field label="Email" value={student.userId?.email} />
                        <Field label="Mobile" value={student.mobile} />
                        <Field label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                        <Field label="Gender" value={student.gender} />
                        <Field label="Blood Group" value={student.bloodGroup} />
                    </div>

                    {/* Academic */}
                    <div>
                        <h4 style={{ color: 'var(--brand-secondary)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={16} /> Academic Info
                        </h4>
                        <Field label="Institution" value={student.institution} />
                        <Field label="Course" value={student.course} />
                        <Field label="Year" value={student.year ? `Year ${student.year}` : null} />
                        <Field label="Roll Number" value={student.rollNumber} />
                        <Field label="SSP ID" value={student.sspId} />
                        <Field label="Join Date" value={student.joinDate ? new Date(student.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                    </div>

                    {/* Guardian */}
                    {(student.guardian?.name || student.guardian?.mobile) && (
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>👨‍👩‍👧 Guardian Info</h4>
                            <Field label="Guardian Name" value={student.guardian?.name} />
                            <Field label="Guardian Mobile" value={student.guardian?.mobile} />
                        </div>
                    )}

                    {/* Address */}
                    {student.address?.city && (
                        <div>
                            <h4 style={{ color: 'var(--text-primary)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} /> Address
                            </h4>
                            <Field label="Street" value={student.address?.street} />
                            <Field label="City" value={student.address?.city} />
                            <Field label="State" value={student.address?.state} />
                            <Field label="Pincode" value={student.address?.pincode} />
                        </div>
                    )}

                    {/* Room assignment */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>🏠 Room Assignment</h4>
                        {student.cotId ? (
                            <div style={{ padding: '0.875rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px' }}>
                                <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600 }}>
                                    Room {student.cotId.roomId?.roomNumber || 'N/A'} — Cot {student.cotId.cotNumber}
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not yet assigned to a room</p>
                        )}
                    </div>

                    {/* Rejection remarks */}
                    {student.verificationRemarks && (
                        <div style={{ gridColumn: '1 / -1', padding: '1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px' }}>
                            <p style={{ margin: 0, color: 'var(--danger)', fontSize: '0.9rem' }}>
                                <strong>Rejection Remarks:</strong> {student.verificationRemarks}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main Students Component ───────────────────────────────────────────────────
const Students = ({ onBack }) => {
    const addToast = useToastStore((s) => s.addToast);
    const [students, setStudents]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [searchQ, setSearchQ]     = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ id: null, name: '' });
    const [isDeleting, setIsDeleting]       = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null); // for detail modal

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students?limit=1000');
            setStudents(res.data.data || []);
        } catch (err) {
            addToast('Failed to load student list.', 'error');
            console.error(err);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/students/${confirmDelete.id}`);
            setStudents(prev => prev.filter(s => s._id !== confirmDelete.id));
            addToast('Student record removed successfully.', 'success');
            setConfirmDelete({ id: null, name: '' });
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to delete student.', 'error');
        } finally { setIsDeleting(false); }
    };

    // ── Search filter: name, email, SSP ID, room ──────────────────────────────
    const q = searchQ.toLowerCase().trim();
    const filtered = students.filter(s => {
        if (!s.isActive) return false;
        if (!q) return true;
        return (
            s.userId?.name?.toLowerCase().includes(q) ||
            s.userId?.email?.toLowerCase().includes(q) ||
            s.sspId?.toLowerCase().includes(q) ||
            s.mobile?.includes(q) ||
            s.cotId?.roomId?.roomNumber?.toLowerCase().includes(q) ||
            s.institution?.toLowerCase().includes(q) ||
            s.course?.toLowerCase().includes(q)
        );
    });

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading Student Directory...</div>;

    return (
        <>
            {/* Student Detail Modal */}
            {selectedStudent && (
                <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <button onClick={onBack} className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back to Overview
                </button>

                {/* Header + Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2 style={{ color: 'var(--brand-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={24} /> Student Directory
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            ({filtered.length} / {students.filter(s => s.isActive).length})
                        </span>
                    </h2>

                    {/* Search bar */}
                    <div style={{ position: 'relative', flex: '0 0 320px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input type="text" value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            className="input-field"
                            placeholder="Search by name, SSP ID, email, room…"
                            style={{ paddingLeft: '2.25rem', paddingRight: searchQ ? '2.25rem' : '0.875rem' }} />
                        {searchQ && (
                            <button onClick={() => setSearchQ('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <Users size={40} style={{ opacity: 0.3 }} />
                            <p style={{ marginTop: '1rem' }}>{q ? `No students match "${q}"` : 'No active students found.'}</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '0.875rem 1rem' }}>Name</th>
                                    <th style={{ padding: '0.875rem 1rem' }}>SSP ID</th>
                                    <th style={{ padding: '0.875rem 1rem' }}>Contact</th>
                                    <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                                    <th style={{ padding: '0.875rem 1rem' }}>Room / Cot</th>
                                    <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(student => (
                                    <tr key={student._id}
                                        style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s', cursor: 'pointer' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {student.userId?.name}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                            {student.sspId || '—'}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.88rem' }}>
                                            <div style={{ color: 'var(--text-secondary)' }}>{student.userId?.email}</div>
                                            {student.mobile && <div style={{ color: 'var(--text-muted)' }}>📞 {student.mobile}</div>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                                                background: student.verificationStatus === 'approved' ? 'rgba(16,185,129,0.15)' :
                                                            student.verificationStatus === 'pending'  ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: student.verificationStatus === 'approved' ? 'var(--success)' :
                                                       student.verificationStatus === 'pending'  ? 'var(--warning)' : 'var(--danger)'
                                            }}>
                                                {student.verificationStatus?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                            {student.cotId
                                                ? `${student.cotId.roomId?.roomNumber || '?'} — Cot ${student.cotId.cotNumber}`
                                                : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {/* View button */}
                                                <button
                                                    onClick={() => setSelectedStudent(student)}
                                                    title="View full details"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', borderRadius: '6px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                                                    <Eye size={14} /> View
                                                </button>

                                                {/* Delete button */}
                                                {confirmDelete.id === student._id ? (
                                                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>Delete?</span>
                                                        <button onClick={handleDelete} disabled={isDeleting}
                                                            style={{ background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                                                            {isDeleting ? '…' : 'Yes'}
                                                        </button>
                                                        <button onClick={() => setConfirmDelete({ id: null, name: '' })}
                                                            style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDelete({ id: student._id, name: student.userId?.name })}
                                                        title="Delete student"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Warning when deleting */}
                {confirmDelete.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontSize: '0.85rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid var(--warning)' }}>
                        <AlertTriangle size={16} />
                        Deleting <strong>{confirmDelete.name}</strong> will permanently remove their record and vacate their cot.
                    </div>
                )}
            </div>
        </>
    );
};

export default Students;
