import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bed, UserPlus, Trash2, Plus } from 'lucide-react';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [unassignedStudents, setUnassignedStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddingRoom, setIsAddingRoom] = useState(false);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', floor: '', block: '', totalCots: 2 });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [roomsRes, studentsRes] = await Promise.all([
                api.get('/rooms'),
                api.get('/students?status=approved&limit=100') // fetch chunk of approved students
            ]);
            
            setRooms(roomsRes.data.data.rooms || []);
            
            // Filter students without a cotId organically
            const unassigned = (studentsRes.data.data || []).filter(s => !s.cotId);
            setUnassignedStudents(unassigned);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAllocate = async (cotId, studentId) => {
        if (!studentId) return;
        try {
            await api.post('/rooms/allocate', { cotId, studentId });
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to allocate student');
        }
    };

    const handleDeallocate = async (studentId) => {
        if (!window.confirm('Remove student from this cot?')) return;
        try {
            await api.post('/rooms/deallocate', { studentId });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to deallocate student');
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rooms', newRoom);
            setIsAddingRoom(false);
            setNewRoom({ roomNumber: '', floor: '', block: '', totalCots: 2 });
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to create room');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Room Matrix...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ color: 'var(--brand-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bed size={24} /> Room Matrix
                </h2>
                <button onClick={() => setIsAddingRoom(!isAddingRoom)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {isAddingRoom ? 'Cancel' : 'Create Room'}
                </button>
            </div>

            {isAddingRoom && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Construct New Room Layout</h3>
                    <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Room Number</label>
                            <input type="text" className="input-field" value={newRoom.roomNumber} onChange={(e) => setNewRoom({...newRoom, roomNumber: e.target.value})} required placeholder="E.g. 101" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Floor</label>
                            <input type="number" className="input-field" value={newRoom.floor} onChange={(e) => setNewRoom({...newRoom, floor: e.target.value})} required placeholder="1" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Block</label>
                            <input type="text" className="input-field" value={newRoom.block} onChange={(e) => setNewRoom({...newRoom, block: e.target.value})} required placeholder="A" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Total Cots</label>
                            <input type="number" className="input-field" value={newRoom.totalCots} min="1" max="10" onChange={(e) => setNewRoom({...newRoom, totalCots: parseInt(e.target.value)})} required />
                        </div>
                        <button type="submit" className="btn btn-primary">Save Room</button>
                    </form>
                </div>
            )}
            
            {rooms.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No rooms configured in the system. Create one above to construct the layout.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {rooms.map(room => (
                        <div key={room._id} className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Room {room.roomNumber} ({room.block} Block)</h3>
                                <span style={{ fontSize: '0.85rem', color: room.availableCount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {room.availableCount} / {room.totalCots} Cots Free
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {(room.cots || []).map(cot => (
                                    <div key={cot._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Bed size={16} color={cot.isOccupied ? 'var(--brand-secondary)' : 'var(--text-muted)'} />
                                            <span>{cot.cotNumber}</span>
                                        </div>
                                        
                                        {cot.isOccupied ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                    {cot.studentId?.userId?.name || 'Unknown'}
                                                </span>
                                                <button onClick={() => handleDeallocate(cot.studentId?._id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Deallocate">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select 
                                                className="input-field" 
                                                style={{ width: '160px', padding: '0.2rem', fontSize: '0.85rem' }} 
                                                onChange={(e) => handleAllocate(cot._id, e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Assign Student...</option>
                                                {unassignedStudents.map(s => (
                                                    <option key={s._id} value={s._id}>{s.userId?.name} ({s.sspId})</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Rooms;
