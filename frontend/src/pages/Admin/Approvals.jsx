import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Check, X, FileText } from 'lucide-react';

const Approvals = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/verify/pending');
      setPending(res.data.data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (id, action) => {
    try {
      const remarks = prompt(action === 'approve' ? 'Optional remarks for approval:' : 'Reason for rejection:');
      if (action === 'reject' && !remarks) return; // requiring remarks for rejection

      await api.put(`/admin/students/verify/${id}`, { action, remarks });
      fetchPending();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading pending approvals...</div>;

  if (pending.length === 0) return (
    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-primary)' }}>All Caught Up!</h2>
      <p style={{ color: 'var(--text-muted)' }}>No pending approvals at the moment.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ color: 'var(--text-primary)' }}>Pending Approvals ({pending.length})</h2>
      {pending.map(student => (
        <div key={student._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {student.userId?.name} ({student.sspId || 'No SSP ID'})
                {student.proposedUpdates && <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--warning)', color: '#000', borderRadius: '4px' }}>Modification Request</span>}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{student.userId?.email} • {student.mobile}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.9rem' }}>
              <div><strong>Course:</strong> {student.course} ({student.year})</div>
              <div><strong>Institution:</strong> {student.institution}</div>
              <div><strong>DOB:</strong> {new Date(student.dateOfBirth).toLocaleDateString()}</div>
              <div><strong>Blood Group:</strong> {student.bloodGroup}</div>
            </div>

            {student.proposedUpdates && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,193,7,0.1)', border: '1px solid var(--warning)', borderRadius: '4px' }}>
                    <strong style={{ color: 'var(--warning)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Proposed Changes</strong>
                    <ul style={{ margin: '0.5rem 0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {Object.entries(student.proposedUpdates).map(([k, v]) => {
                            if (typeof v === 'object' && v !== null) {
                                return <li key={k}><strong>{k}:</strong> {JSON.stringify(v)}</li>;
                            }
                            return <li key={k}><strong>{k}:</strong> {String(v)}</li>;
                        })}
                    </ul>
                </div>
            )}

            {/* Ideally we would fetch and show documents here, for now MVP */}
            <p style={{ marginTop: '1rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
               <FileText size={16} /> View Uploaded Documents
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
             <button onClick={() => handleVerify(student._id, 'approve')} className="btn btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
               <Check size={16} style={{ marginRight: '0.5rem' }} /> Approve
             </button>
             <button onClick={() => handleVerify(student._id, 'reject')} className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
               <X size={16} style={{ marginRight: '0.5rem' }} /> Reject
             </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Approvals;
