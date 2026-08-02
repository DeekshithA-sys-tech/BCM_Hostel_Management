import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import useToastStore from '../../store/useToastStore';
import { Coffee, Users, Save, Plus, ArrowLeft, Trash2, X } from 'lucide-react';

const FoodStaff = ({ onBack }) => {
    const addToast = useToastStore((s) => s.addToast);
    const [schedule, setSchedule]       = useState([]);
    const [staff, setStaff]             = useState([]);
    const [activeView, setActiveView]   = useState('staff');
    const [isSaving, setIsSaving]       = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [newStaff, setNewStaff]       = useState({ name: '', role: '', mobile: '' });
    const [isAddingStaff, setIsAddingStaff] = useState(false);
    const [deletingId, setDeletingId]   = useState(null); // staff._id being confirmed for delete

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchFood = async () => {
        try {
            const res = await api.get('/food');
            setSchedule(res.data.data.schedule || []);
        } catch (err) { console.error(err); }
    };

    const fetchStaff = async () => {
        try {
            const res = await api.get('/staff');
            setStaff(res.data.data.staff || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchFood();
        fetchStaff();
    }, []);

    // ── Food schedule handlers ────────────────────────────────────────────────
    const handleMealChange = (dayIndex, mIdx, itemIndex, value) => {
        const newSched = [...schedule];
        const day = newSched[dayIndex];
        const mealType = ['Breakfast', 'Lunch', 'Snack', 'Dinner'][mIdx];
        if (!day.meals) day.meals = [];
        let mealObj = day.meals.find(m => m.type === mealType);
        if (!mealObj) { mealObj = { type: mealType, items: [] }; day.meals.push(mealObj); }
        const newItems = [...(mealObj.items || [])];
        newItems[itemIndex] = value;
        mealObj.items = newItems;
        setSchedule(newSched);
    };

    const saveFoodSchedule = async () => {
        setIsSaving(true);
        try {
            await api.post('/food/bulk', { schedule });
            addToast('Food schedule updated!', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Error saving schedule.', 'error');
        } finally { setIsSaving(false); }
    };

    // ── Staff handlers ────────────────────────────────────────────────────────
    const handleAddStaff = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        // Trim + send only non-empty fields
        const payload = {
            name: newStaff.name.trim(),
            role: newStaff.role.trim(),
            ...(newStaff.mobile.trim() ? { mobile: newStaff.mobile.trim() } : {})
        };
        try {
            await api.post('/staff', payload);
            addToast(`${payload.name} added to staff!`, 'success');
            setNewStaff({ name: '', role: '', mobile: '' });
            setIsAddingStaff(false);
            fetchStaff();
        } catch (err) {
            const msg = err.response?.data?.message || err.apiMessage || 'Failed to add staff.';
            addToast(msg, 'error');
            if (err.validation?.fieldMap) setFieldErrors(err.validation.fieldMap);
        }
    };

    const handleDeleteStaff = async (id) => {
        try {
            await api.delete(`/staff/${id}`);
            addToast('Staff member removed.', 'success');
            setStaff(prev => prev.filter(s => s._id !== id));
            setDeletingId(null);
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to delete staff.', 'error');
            setDeletingId(null);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <button onClick={onBack} className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={16} /> Back to Overview
            </button>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                {[['food', Coffee, 'Mess / Food Schedule'], ['staff', Users, 'Staff Directory']].map(([key, Icon, label]) => (
                    <button key={key} onClick={() => setActiveView(key)}
                        className={`btn ${activeView === key ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon size={18} /> {label}
                    </button>
                ))}
            </div>

            {/* ── Food Schedule ── */}
            {activeView === 'food' && (
                <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--brand-primary)' }}>Weekly Menu Configuration</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Day</th>
                                <th style={{ padding: '1rem' }}>Breakfast</th>
                                <th style={{ padding: '1rem' }}>Lunch</th>
                                <th style={{ padding: '1rem' }}>Dinner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map((day, dIdx) => (
                                <tr key={day.weekday} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{day.weekday}</td>
                                    {[0, 1, 3].map(mIdx => {
                                        const meal = day.meals?.find(m => m.type === ['Breakfast', 'Lunch', 'Snack', 'Dinner'][mIdx]);
                                        return (
                                            <td key={mIdx} style={{ padding: '0.75rem' }}>
                                                <input type="text" className="input-field"
                                                    value={meal?.items?.[0] || ''}
                                                    onChange={(e) => handleMealChange(dIdx, mIdx, 0, e.target.value)}
                                                    placeholder="E.g., Idli, Sambar" />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={saveFoodSchedule} disabled={isSaving} className="btn btn-primary"
                        style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} /> {isSaving ? 'Saving...' : 'Publish Schedule'}
                    </button>
                </div>
            )}

            {/* ── Staff Directory ── */}
            {activeView === 'staff' && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, color: 'var(--brand-secondary)' }}>
                            Staff Roster <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>({staff.length} active)</span>
                        </h2>
                        <button onClick={() => { setIsAddingStaff(p => !p); setFieldErrors({}); }}
                            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isAddingStaff ? <><X size={16} /> Cancel</> : <><Plus size={18} /> Add Staff</>}
                        </button>
                    </div>

                    {/* Add Staff form */}
                    {isAddingStaff && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--brand-primary)' }}>Register New Staff Member</h3>
                            <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label className="input-label">Full Name *</label>
                                    <input type="text" className="input-field" value={newStaff.name}
                                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                        required placeholder="E.g. Ramesh Kumar" />
                                    {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
                                </div>
                                <div>
                                    <label className="input-label">Role / Designation *</label>
                                    <input type="text" className="input-field" value={newStaff.role}
                                        onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                                        required placeholder="E.g. Cook, Security Guard" />
                                    {fieldErrors.role && <div className="field-error">{fieldErrors.role}</div>}
                                </div>
                                <div>
                                    <label className="input-label">Mobile <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(optional, 10-digit Indian)</span></label>
                                    <input type="tel" className="input-field" value={newStaff.mobile}
                                        onChange={(e) => setNewStaff({ ...newStaff, mobile: e.target.value })}
                                        placeholder="9876543210" maxLength={10} pattern="[6-9][0-9]{9}" />
                                    {fieldErrors.mobile && <div className="field-error">{fieldErrors.mobile}</div>}
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Save Staff</button>
                            </form>
                        </div>
                    )}

                    {/* Staff grid */}
                    {staff.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <Users size={40} style={{ opacity: 0.3 }} />
                            <p style={{ marginTop: '1rem' }}>No staff members registered yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                            {staff.map(s => (
                                <div key={s._id} style={{
                                    padding: '1.25rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    position: 'relative',
                                    transition: 'border-color 0.2s'
                                }}>
                                    {/* Name + Role */}
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>{s.name}</h3>
                                        <span style={{
                                            display: 'inline-block', marginTop: '0.3rem',
                                            fontSize: '0.75rem', padding: '0.15rem 0.5rem',
                                            borderRadius: '20px', background: 'rgba(78,205,196,0.12)',
                                            color: 'var(--brand-secondary)', fontWeight: 600, textTransform: 'uppercase'
                                        }}>{s.role}</span>
                                    </div>

                                    {s.mobile && (
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                            📞 {s.mobile}
                                        </p>
                                    )}
                                    {s.email && (
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            ✉️ {s.email}
                                        </p>
                                    )}

                                    {/* Delete button */}
                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                        {deletingId === s._id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>Confirm delete?</span>
                                                <button onClick={() => handleDeleteStaff(s._id)}
                                                    style={{ padding: '0.25rem 0.6rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    Yes
                                                </button>
                                                <button onClick={() => setDeletingId(null)}
                                                    style={{ padding: '0.25rem 0.6rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setDeletingId(s._id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        )}
                                    </div>
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
