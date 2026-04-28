import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Trash2, Edit } from 'lucide-react';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomFilter, setRoomFilter] = useState('');

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

    const handleDelete = async (id, name) => {
        const confirmed = window.confirm(`Are you absolutely sure you want to delete ${name}'s record? This sets their status to inactive and vacates their room.`);
        if (!confirmed) return;

        try {
            await api.delete(`/students/${id}`);
            fetchStudents(); // Refresh list to reflect changes
            alert('Student deleted successfully.');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete student');
        }
    };

    const filteredStudents = students.filter(student => {
        if (!roomFilter) return true;
        const roomNumber = student.cotId?.roomId?.roomNumber || '';
        return roomNumber.toLowerCase().includes(roomFilter.toLowerCase());
    });

    if (loading) return <div style={{ padding: '2rem' }}>Loading Student Directory...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                    <p style={{ color: 'var(--text-muted)' }}>No students registered or found.</p>
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
                                <tr key={student._id} style={{ borderBottom: '1px solid var(--border-color)', opacity: student.isActive ? 1 : 0.5 }}>
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
                                            {student.verificationStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {student.cotId ? `${student.cotId.roomId?.roomNumber || 'Assigned'} - ${student.cotId.cotNumber}` : 'Unassigned'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button 
                                            disabled={!student.isActive} 
                                            onClick={() => handleDelete(student._id, student.userId?.name)} 
                                            style={{ 
                                                background: 'transparent', 
                                                border: '1px solid var(--danger)', 
                                                color: 'var(--danger)', 
                                                cursor: student.isActive ? 'pointer' : 'not-allowed',
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Students;
