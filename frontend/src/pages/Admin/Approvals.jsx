import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Check, X, FileText, ArrowLeft, ExternalLink } from 'lucide-react';

const Approvals = ({ onBack, onApproved }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ id: null, action: null, remarks: '' });
  const [docModal, setDocModal] = useState({ isOpen: false, docs: [], studentName: '' });
  const [isProcessing, setIsProcessing] = useState(false);

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

  const openConfirm = (id, action) => {
    setConfirmState({ id, action, remarks: '' });
  };

  const handleConfirmAction = async () => {
    const { id, action, remarks } = confirmState;
    if (action === 'reject' && !remarks.trim()) return;
    setIsProcessing(true);
    try {
      await api.patch(`/admin/verify/${id}`, {
        action,
        remarks: remarks || (action === 'approve' ? 'Verification successful' : 'Details rejected')
      });
      setConfirmState({ id: null, action: null, remarks: '' });
      fetchPending();
      if (action === 'approve' && onApproved) {
        onApproved(); // Navigate to room layout after approval
      }
    } catch (err) {
      console.error(err);
      // Try alternate endpoint
      try {
        await api.put(`/admin/students/verify/${id}`, { action, remarks });
        setConfirmState({ id: null, action: null, remarks: '' });
        fetchPending();
        if (action === 'approve' && onApproved) onApproved();
      } catch (e) {
        console.error(e);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDocuments = async (student) => {
    try {
      const res = await api.get(`/students/${student._id}`);
      const docs = res.data.data.documents || [];
      setDocModal({ isOpen: true, docs, studentName: student.userId?.name });
    } catch (err) {
      console.error(err);
      setDocModal({ isOpen: true, docs: [], studentName: student.userId?.name });
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading pending approvals...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Back Button */}
      <button onClick={onBack} className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ArrowLeft size={16} /> Back to Overview
      </button>

      <h2 style={{ color: 'var(--text-primary)' }}>Pending Approvals ({pending.length})</h2>

      {pending.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--text-primary)' }}>All Caught Up!</h2>
          <p style={{ color: 'var(--text-muted)' }}>No pending approvals at the moment.</p>
        </div>
      ) : (
        pending.map(student => (
          <div key={student._id} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
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

                {/* Fixed: actually fetches documents */}
                <button
                  onClick={() => handleViewDocuments(student)}
                  style={{ marginTop: '1rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, fontSize: '0.9rem' }}
                >
                   <FileText size={16} /> View Uploaded Documents
                </button>
              </div>

              {/* Inline confirm buttons — no popup */}
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', minWidth: '140px' }}>
                {confirmState.id === student._id ? (
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Confirm {confirmState.action === 'approve' ? 'Approval' : 'Rejection'}?
                    </p>
                    {confirmState.action === 'reject' && (
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Reason (required)"
                        value={confirmState.remarks}
                        onChange={(e) => setConfirmState(s => ({ ...s, remarks: e.target.value }))}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={handleConfirmAction}
                        disabled={isProcessing || (confirmState.action === 'reject' && !confirmState.remarks.trim())}
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.85rem', background: confirmState.action === 'approve' ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {isProcessing ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmState({ id: null, action: null, remarks: '' })}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '0.85rem' }}
                        disabled={isProcessing}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={() => openConfirm(student._id, 'approve')} className="btn btn-primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                      <Check size={16} style={{ marginRight: '0.5rem' }} /> Approve
                    </button>
                    <button onClick={() => openConfirm(student._id, 'reject')} className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                      <X size={16} style={{ marginRight: '0.5rem' }} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Document View Modal */}
      {docModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '520px', width: '100%', background: 'var(--bg-primary)', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Documents — {docModal.studentName}
            </h3>
            {docModal.docs.length === 0 ? (
              <p style={{ color: 'var(--warning)' }}>No documents uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {docModal.docs.map(doc => (
                  <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{doc.type?.replace(/_/g, ' ')}</span>
                    <a
                      href={doc.fileData || doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={doc.fileName}
                      style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <ExternalLink size={14} /> View / Download
                    </a>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => setDocModal({ isOpen: false, docs: [], studentName: '' })}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approvals;
