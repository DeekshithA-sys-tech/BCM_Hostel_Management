import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Coffee, Users, Save, Plus, ArrowLeft } from 'lucide-react';

const FoodStaff = ({ onBack }) => {
    const [schedule, setSchedule] = useState([]);
    const [staff, setStaff] = useState([]);
    const [activeView, setActiveView] = useState('staff'); // Default to staff view since Add Staff btn from overview lands here

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    
    const [newStaff, setNewStaff] = useState({ name: '', role: '', mobile: '' });
    const [isAddingStaff, setIsAddingStaff] = useState(true); // Default open so Add Staff from overview is ready

    const fetchFood = async () => {
        try {
            const res = await api.get('/food');
            setSchedule(res.data.data.schedule || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await api.get('/staff');
            setStaff(res.data.data.staff || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchFood();
        fetchStaff();
    }, []);

    const handleMealChange = (dayIndex, mIdx, itemIndex, value) => {
        const newSched = [...schedule];
        const day = newSched[dayIndex];
        const mealType = ['Breakfast', 'Lunch', 'Snack', 'Dinner'][mIdx];
        
        if (!day.meals) day.meals = [];
        
        let mealObj = day.meals.find(m => m.type === mealType);
        if (!mealObj) {
            mealObj = { type: mealType, items: [] };
            day.meals.push(mealObj);
        }
        
        const newItems = [...(mealObj.items || [])];
        newItems[itemIndex] = value;
        mealObj.items = newItems;
        setSchedule(newSched);
    };

    const saveFoodSchedule = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            await api.post('/food/bulk', { schedule });
            setMessage('Food schedule updated successfully!');
        } catch (err) {
            console.error(err);
            setMessage('Error saving schedule');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('/staff', newStaff);
            setNewStaff({ name: '', role: '', mobile: '' });
            setIsAddingStaff(false);
            fetchStaff();
            setMessage('Staff added successfully!');
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || 'Error adding staff');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Back Button */}
            <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Overview
            </button>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <button 
                  onClick={() => setActiveView('food')} 
                  className={`btn ${activeView === 'food' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Coffee size={18} /> Mess / Food Schedule
                </button>
                <button 
                  onClick={() => setActiveView('staff')} 
                  className={`btn ${activeView === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Staff Directory
                </button>
            </div>

            {message && <div style={{ padding: '1rem', background: 'var(--bg-secondary)', color: 'var(--info)', borderRadius: '4px' }}>{message}</div>}

            {activeView === 'food' && (
                <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>Weekly Menu Configuration</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem' }}>Day</th>
                                <th style={{ padding: '1rem' }}>Breakfast</th>
                                <th style={{ padding: '1rem' }}>Lunch</th>
                                <th style={{ padding: '1rem' }}>Dinner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((day, dIdx) => (
                                <tr key={day.weekday} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{day.weekday}</td>
                                    {[0, 1, 3].map(mIdx => {
                                        const meal = day.meals?.find(m => m.type === ['Breakfast', 'Lunch', 'Snack', 'Dinner'][mIdx]);
                                        const item = meal?.items?.[0] || '';
                                        return (
                                            <td key={mIdx} style={{ padding: '1rem' }}>
                                                <input 
                                                   type="text" 
                                                   className="input-field" 
                                                   value={item} 
                                                   onChange={(e) => handleMealChange(dIdx, mIdx, 0, e.target.value)}
                                                   placeholder="E.g., Dosa, Chutney"
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={saveFoodSchedule} disabled={isSaving} className="btn btn-primary" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> {isSaving ? 'Saving...' : 'Publish Schedule'}
                    </button>
                </div>
            )}

            {activeView === 'staff' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, color: 'var(--brand-secondary)' }}>Staff Roster ({staff.length})</h2>
                        <button onClick={() => setIsAddingStaff(!isAddingStaff)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> {isAddingStaff ? 'Cancel' : 'Add Staff'}
                        </button>
                    </div>

                    {isAddingStaff && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Register New Staff Member</h3>
                            <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                    <input type="text" className="input-field" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} required placeholder="Enter name" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role</label>
                                    <input type="text" className="input-field" value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})} required placeholder="E.g. Cook, Guard" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Mobile</label>
                                    <input type="text" className="input-field" value={newStaff.mobile} onChange={(e) => setNewStaff({...newStaff, mobile: e.target.value})} required placeholder="Mobile number" />
                                </div>
                                <button type="submit" className="btn btn-primary">Save Staff</button>
                            </form>
                        </div>
                    )}

                    {staff.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No staff members registered. Use the Add Staff button above to register the first one.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {staff.map(s => (
                                <div key={s._id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{s.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', marginTop: '0.25rem' }}>{s.role}</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>📞 {s.mobile}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FoodStaff;
