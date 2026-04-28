import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import './student.css';

const EMPTY_FORM = {
  sspId: '', dateOfBirth: '', gender: '', bloodGroup: '',
  mobile: '', institution: '', course: '', year: '', rollNumber: '',
  guardianName: '', guardianMobile: '',
  street: '', city: '', state: '', pincode: ''
};

const Profile = ({ studentInfo, onProfileUpdate, onBack }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [documentFiles, setDocumentFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' }); // type: info | success | error
  const formRef = useRef(null);

  // Populate form from studentInfo (but only if student is not in a 'just submitted' state)
  useEffect(() => {
    if (studentInfo) {
      setFormData({
        sspId: studentInfo.sspId || '',
        dateOfBirth: studentInfo.dateOfBirth ? studentInfo.dateOfBirth.split('T')[0] : '',
        gender: studentInfo.gender || '',
        bloodGroup: studentInfo.bloodGroup || '',
        mobile: studentInfo.mobile || '',
        institution: studentInfo.institution || '',
        course: studentInfo.course || '',
        year: studentInfo.year || '',
        rollNumber: studentInfo.rollNumber || '',
        guardianName: studentInfo.guardian?.name || '',
        guardianMobile: studentInfo.guardian?.mobile || '',
        street: studentInfo.address?.street || '',
        city: studentInfo.address?.city || '',
        state: studentInfo.address?.state || '',
        pincode: studentInfo.address?.pincode || ''
      });
    }
  }, [studentInfo]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    setDocumentFiles({ ...documentFiles, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: 'info' });

    try {
      const form = new FormData();

      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) form.append(key, formData[key]);
      });

      // Append files
      const docTypes = ['aadhar', 'admission_letter', 'income_certificate', 'caste_certificate', 'sslc', 'puc'];
      docTypes.forEach(type => {
        if (documentFiles[type]) {
          form.append(type, documentFiles[type]);
        }
      });

      await api.put('/students/profile', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ text: '✅ Profile submitted successfully. Awaiting Admin verification.', type: 'success' });

      // Clear the form after successful submission
      setFormData(EMPTY_FORM);
      setDocumentFiles({});
      // Reset file inputs by resetting the form element
      if (formRef.current) formRef.current.reset();

      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verificationStatus = studentInfo?.verificationStatus;
  const rejectionRemarks = studentInfo?.verificationRemarks;
  const isRejected = verificationStatus === 'rejected';
  const isPending = verificationStatus === 'pending';
  const isApproved = verificationStatus === 'approved';

  const statusConfig = {
    approved: { color: 'var(--success)', icon: <CheckCircle size={16} />, label: 'APPROVED' },
    rejected: { color: 'var(--danger)', icon: <XCircle size={16} />, label: 'REJECTED' },
    pending:  { color: 'var(--warning)', icon: <Clock size={16} />, label: 'PENDING REVIEW' },
  };
  const statusInfo = statusConfig[verificationStatus] || { color: 'var(--text-muted)', icon: null, label: 'NOT SUBMITTED' };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {onBack && (
        <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Overview
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, color: 'var(--brand-secondary)' }}>
          {isApproved ? 'Update My Profile' : 'Complete Your Enrollment'}
        </h2>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.75rem', borderRadius: '20px',
          background: `${statusInfo.color}22`, color: statusInfo.color,
          fontWeight: 700, fontSize: '0.8rem', border: `1px solid ${statusInfo.color}`
        }}>
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>

      {/* Rejection banner — shows reason and allows resubmit */}
      {isRejected && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid var(--danger)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 700, fontSize: '0.95rem' }}>
            <XCircle size={18} /> Profile Rejected
          </div>
          {rejectionRemarks && (
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <strong>Reason:</strong> {rejectionRemarks}
            </p>
          )}
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Please correct your details below and resubmit for verification.
          </p>
        </div>
      )}

      {isPending && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          color: 'var(--warning)',
          fontSize: '0.9rem'
        }}>
          ⏳ Your profile is under review. You may update and resubmit if needed.
        </div>
      )}

      {message.text && (
        <div style={{
          padding: '1rem', marginBottom: '1rem', borderRadius: '4px',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)',
          color: message.type === 'success' ? 'var(--success)' : message.type === 'error' ? 'var(--danger)' : 'var(--info)',
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : message.type === 'error' ? 'var(--danger)' : 'var(--border-color)'}`
        }}>
          {message.text}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Personal Details */}
        <div>
           <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Personal Details</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div style={{ gridColumn: 'span 2' }}>
                <label className="input-label">SSP ID (State Scholarship Portal)</label>
                <input type="text" name="sspId" value={formData.sspId} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Mobile Number</label>
                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="input-field" placeholder="10 Digit Number" required />
             </div>
             <div>
                <label className="input-label">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="input-field" required>
                   <option value="">Select</option>
                   <option value="male">Male</option>
                   <option value="female">Female</option>
                   <option value="other">Other</option>
                </select>
             </div>
             <div>
                <label className="input-label">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="input-field" required>
                   <option value="">Select</option>
                   <option value="A+">A+</option><option value="A-">A-</option>
                   <option value="B+">B+</option><option value="B-">B-</option>
                   <option value="AB+">AB+</option><option value="AB-">AB-</option>
                   <option value="O+">O+</option><option value="O-">O-</option>
                </select>
             </div>
           </div>
        </div>

        {/* Academic Details */}
        <div>
           <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Academic Details</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div>
                <label className="input-label">College / Institution</label>
                <input type="text" name="institution" value={formData.institution} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Course</label>
                <input type="text" name="course" value={formData.course} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Year of Study</label>
                <input type="number" name="year" min="1" max="6" value={formData.year} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Roll Number</label>
                <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="input-field" required />
             </div>
           </div>
        </div>

        {/* Parent Details */}
        <div>
           <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Parent/Guardian Details</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div>
                <label className="input-label">Guardian Name</label>
                <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Guardian Mobile</label>
                <input type="text" name="guardianMobile" value={formData.guardianMobile} onChange={handleChange} className="input-field" required />
             </div>
           </div>
        </div>

        {/* Address */}
        <div>
           <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Permanent Address</h3>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             <div style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Street / Area</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field" required />
             </div>
             <div>
                <label className="input-label">Pincode</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="input-field" required />
             </div>
           </div>
        </div>

        {/* Documents */}
        <div>
           <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Upload Documents</h3>
           <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div><label className="input-label">Aadhar Card</label><input type="file" name="aadhar" onChange={handleFileChange} className="input-field" accept=".pdf,image/*" /></div>
             <div><label className="input-label">Admission Order</label><input type="file" name="admission_letter" onChange={handleFileChange} className="input-field" accept=".pdf,image/*" /></div>
             <div><label className="input-label">Income Certificate</label><input type="file" name="income_certificate" onChange={handleFileChange} className="input-field" accept=".pdf,image/*" /></div>
             <div><label className="input-label">Caste Certificate</label><input type="file" name="caste_certificate" onChange={handleFileChange} className="input-field" accept=".pdf,image/*" /></div>
             <div><label className="input-label">SSLC Marks</label><input type="file" name="sslc" onChange={handleFileChange} className="input-field" accept=".pdf,image/*" /></div>
             <div><label className="input-label">PUC Marks</label><input type="file" name="puc" onChange={handleFileChange} className="input-field" accept=".pdf,image/*" /></div>
           </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isSubmitting}>
           {isSubmitting ? (
             <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving Profile...</>
           ) : (
             isRejected ? '↩ Resubmit Profile for Verification' : 'Submit Profile for Verification'
           )}
        </button>

      </form>
    </div>
  );
};

export default Profile;
