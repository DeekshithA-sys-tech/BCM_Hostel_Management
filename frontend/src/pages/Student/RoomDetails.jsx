import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Bed, Mail, Phone } from 'lucide-react';

const RoomDetails = ({ roomId }) => {
    const [roomInfo, setRoomInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoom = async () => {
            if (!roomId) {
                setLoading(false);
                return;
            }
            try {
                const res = await api.get(`/rooms/${roomId}`);
                setRoomInfo(res.data.data.room);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [roomId]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading Room Data...</div>;

    if (!roomInfo) {
         return (
             <div className="glass-panel" style={{ padding: '2rem' }}>
                 <h2>Room Details</h2>
                 <p style={{ marginTop: '1rem', color: 'var(--warning)' }}>You have not been assigned a room yet. Please await administration allocation.</p>
             </div>
         );
    }

    // Filter out unoccupied cots strictly to show 'roommates'
    const occupants = (roomInfo.cots || []).filter(c => c.isOccupied && c.studentId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--brand-primary)' }}>
                    <Bed size={24} /> Room {roomInfo.roomNumber} Overview
                </h2>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Block:</strong> {roomInfo.block}</div>
                    <div><strong>Floor:</strong> {roomInfo.floor}</div>
                    <div><strong>Total Cots:</strong> {roomInfo.totalCots}</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--brand-secondary)' }}>
                    <Users size={20} /> Roommates Directory
                </h3>
                <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Get in touch with the students sharing your room.</p>
                
                {occupants.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No other students are currently assigned to this room.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {occupants.map(cot => {
                            const currentStudent = cot.studentId;
                            return (
                                <div key={cot._id} style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{currentStudent.userId?.name}</h4>
                                        <span style={{ fontSize: '0.8rem', background: 'var(--brand-primary)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                            Cot {cot.cotNumber}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14}/> {currentStudent.userId?.email}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14}/> {currentStudent.mobile}</div>
                                        {currentStudent.course && <div><strong>Course:</strong> {currentStudent.course}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomDetails;
