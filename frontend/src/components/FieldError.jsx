import React from 'react';

const FieldError = ({ fieldErrors = {}, name }) => {
  const msg = fieldErrors?.[name] || fieldErrors?.[name.replace('.', '_')];
  if (!msg) return null;
  return <div className="field-error" style={{ color: 'var(--danger)', marginTop: '0.25rem', fontSize: '0.85rem' }}>{msg}</div>;
};

export default FieldError;
