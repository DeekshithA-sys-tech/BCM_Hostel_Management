import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';

const Students = ({ onBack }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomFilter, setRoomFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ id: null, name: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students?limit=1000');
            setStudents(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleDelete = async () => {
        setIsDeleting(true);
        setDeleteMessage('');
        try {
            await api.delete(`/students/${confirmDelete.id}`);
            // Immediately remove from local state (works in both light and dark mode)
            setStudents(prev => prev.filter(s => s._id !== confirmDelete.id));
            setConfirmDelete({ id: null, name: '' });
            setDeleteMessage('Student deleted successfully.');
        } catch (err) {
            console.error(err);
            setDeleteMessage(err.response?.data?.message || 'Failed to delete student');
        } finally {
            setIsDeleting(false);
        }
    };

    // Only show active students (truly filter out inactive ones — fixes light mode visibility issue)
    const filteredStudents = students.filter(student => {
        if (!student.isActive) return false;
        if (!roomFilter) return true;
        const roomNumber = student.cotId?.roomId?.roomNumber || '';
        return roomNumber.toLowerCase().includes(roomFilter.toLowerCase());
    });

    if (loading) return <div style={{ padding: '2rem' }}>Loading Student Directory...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Back Button */}
            <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Overview
            </button>

            {deleteMessage && (
                <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', color: 'var(--info)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    {deleteMessage}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--brand-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={24} /> Student Directory
                </h2>
                <input 
                    type="text" 
                    placeholder="Filter by Room No." 
                    className="input-field" 
                    style={{ width: '200px' }}
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                />
            </div>
            
            <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                {filteredStudents.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No active students registered or found.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>SSP ID</th>
                                <th style={{ padding: '1rem' }}>Contact</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Room / Cot</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.userId?.name}</td>
                                    <td style={{ padding: '1rem' }}>{student.sspId || 'N/A'}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                        <div>{student.userId?.email}</div>
                                        <div>📞 {student.mobile}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            padding: '0.2rem 0.5rem', 
                                            borderRadius: '4px', 
                                            fontSize: '0.8rem',
                                            background: student.verificationStatus === 'approved' ? 'var(--success)' : 
                                                        student.verificationStatus === 'pending' ? 'var(--warning)' : 'var(--danger)',
                                            color: '#fff'
                                        }}>
                                            {student.verificationStatus?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {student.cotId ? `${student.cotId.roomId?.roomNumber || 'Assigned'} - ${student.cotId.cotNumber}` : 'Unassigned'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {confirmDelete.id === student._id ? (
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Delete?</span>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                    style={{ background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}
                                                >
                                                    {isDeleting ? '...' : 'Yes'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete({ id: null, name: '' })}
                                                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setConfirmDelete({ id: student._id, name: student.userId?.name })} 
                                                style={{ 
                                                    background: 'transparent', 
                                                    border: '1px solid var(--danger)', 
                                                    color: 'var(--danger)', 
                                                    cursor: 'pointer',
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: '4px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                                title="Delete Student"
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Inline confirmation notice */}
            {confirmDelete.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontSize: '0.85rem' }}>
                    <AlertTriangle size={14} /> Deleting <strong>{confirmDelete.name}</strong> will permanently remove their record and vacate their room.
                </div>
            )}
        </div>
    );
};

export default Students;
