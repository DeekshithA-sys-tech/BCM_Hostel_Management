import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Check, X, FileText, User } from 'lucide-react';

const VerificationList = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showModal, setShowModal] = useState({ isOpen: false, action: null });

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/verify/pending');
      setPendingStudents(res.data.data.students);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelect = async (studentId) => {
    try {
      // Get complete student details including documents
      const res = await api.get(`/students/${studentId}`);
      setSelectedStudent(studentId);
      setStudentDetails(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = (action) => {
    setShowModal({ isOpen: true, action });
  };

  const confirmAction = async () => {
    setIsProcessing(true);
    const { action } = showModal;
    try {
      await api.patch(`/admin/verify/${selectedStudent}`, {
        action,
        remarks: action === 'approve' ? 'Verification successful' : 'Details rejected'
      });
      setSelectedStudent(null);
      setStudentDetails(null);
      setShowModal({ isOpen: false, action: null });
      fetchPending();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', height: '100%', alignItems: 'flex-start' }}>
      
      {/* List Sidebar */}
      <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--brand-primary)' }}>Pending Approvals ({pendingStudents.length})</h3>
        {pendingStudents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pending verifications.</p>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingStudents.map(student => (
                <div 
                  key={student._id} 
                  onClick={() => handleSelect(student._id)}
                  style={{ 
                    padding: '1rem', 
                    background: selectedStudent === student._id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)', 
                    border: `1px solid ${selectedStudent === student._id ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{student.userId?.name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SSP ID: {student.sspId}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Applied: {new Date(student.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
        )}
      </div>

      {/* Details Panel */}
      <div className="glass-panel" style={{ flex: 1, padding: '2rem', minHeight: '600px', position: 'relative' }}>
         {selectedStudent && studentDetails ? (
             <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                   <div>
                     <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{studentDetails.student.userId?.name}</h2>
                     <p style={{ color: 'var(--text-secondary)' }}>SSP ID: <strong style={{color: 'var(--info)'}}>{studentDetails.student.sspId}</strong> | Course: {studentDetails.student.course}</p>
                   </div>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <button onClick={() => handleVerify('reject')} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }} disabled={isProcessing}>
                       <X size={18} /> Reject
                     </button>
                     <button onClick={() => handleVerify('approve')} className="btn btn-primary" style={{ background: 'var(--success)' }} disabled={isProcessing}>
                       <Check size={18} /> Approve
                     </button>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  
                  {/* Info Column */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}><User size={18} /> Personal Info</h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <li><span style={{ color: 'var(--text-muted)' }}>Email:</span> {studentDetails.student.userId?.email}</li>
                      <li><span style={{ color: 'var(--text-muted)' }}>Phone:</span> {studentDetails.student.mobile}</li>
                      <li><span style={{ color: 'var(--text-muted)' }}>DOB:</span> {new Date(studentDetails.student.dateOfBirth).toLocaleDateString()}</li>
                      <li><span style={{ color: 'var(--text-muted)' }}>Blood Group:</span> {studentDetails.student.bloodGroup}</li>
                      <li><span style={{ color: 'var(--text-muted)' }}>Institution:</span> {studentDetails.student.institution}</li>
                      <li><span style={{ color: 'var(--text-muted)' }}>Guardian:</span> {studentDetails.student.guardian?.name} ({studentDetails.student.guardian?.mobile})</li>
                    </ul>
                  </div>

                  {/* Documents Column */}
                  <div>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}><FileText size={18} /> Uploaded Documents</h4>
                    {studentDetails.documents?.length === 0 ? (
                        <p style={{ color: 'var(--warning)' }}>No documents uploaded yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {studentDetails.documents?.map(doc => (
                              <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)' }}>{doc.type.replace('_', ' ')}</span>
                                <a href={doc.fileData} target="_blank" rel="noreferrer" download={doc.fileName} style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>View Database File</a>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>

                </div>
             </div>
         ) : (
             <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                 Select a student from the pending list to review their application.
             </div>
         )}
      </div>

      {showModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
           <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', background: 'var(--bg-primary)' }}>
              <h3 style={{ marginBottom: '1rem', marginTop: 0, color: 'var(--text-primary)' }}>Confirm {showModal.action === 'approve' ? 'Approval' : 'Rejection'}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                 Are you sure you want to {showModal.action} this student application? 
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                 <button className="btn btn-secondary" onClick={() => setShowModal({ isOpen: false, action: null })} disabled={isProcessing}>Cancel</button>
                 <button className="btn btn-primary" onClick={confirmAction} style={{ background: showModal.action === 'approve' ? 'var(--success)' : 'var(--danger)' }} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Confirm'}
                 </button>
              </div>
           </div>
        </div>
      )}
    
    </div>
  );
};

export default VerificationList;
