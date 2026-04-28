import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './student.css';

const Profile = ({ studentInfo, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    sspId: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    mobile: '',
    institution: '',
    course: '',
    year: '',
    rollNumber: '',
    guardianName: '',
    guardianMobile: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [documentFiles, setDocumentFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

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
    setMessage('');
    
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

      setMessage('Profile and documents updated successfully. Awaiting Admin verification.');
      if (onProfileUpdate) onProfileUpdate();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--brand-secondary)' }}>Complete Your Enrollment</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Status: <strong style={{ color: studentInfo?.verificationStatus === 'approved' ? 'var(--success)' : 'var(--warning)' }}>
          {studentInfo?.verificationStatus?.toUpperCase() || 'UNKNOWN'}
        </strong>
      </p>

      {message && <div style={{ padding: '1rem', background: 'var(--bg-secondary)', color: 'var(--info)', marginBottom: '1rem', borderRadius: '4px' }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
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

        <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem', alignSelf: 'flex-start' }} disabled={isSubmitting}>
           {isSubmitting ? 'Saving Profile...' : 'Submit Profile for Verification'}
        </button>

      </form>
    </div>
  );
};

export default Profile;
