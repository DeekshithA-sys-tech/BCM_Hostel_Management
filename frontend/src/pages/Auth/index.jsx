import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LogIn, UserPlus } from 'lucide-react';
import './auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    name: '',
    sspId: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const EMPTY_FORM = { email: '', password: '', name: '', sspId: '' };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormData(EMPTY_FORM);  // clear all fields when switching modes
    useAuthStore.setState({ error: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const data = await login({ email: formData.email, password: formData.password });
        if (data.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      } else {
        await register(formData);
        // Switch to login view on successful registration with empty fields
        setFormData(EMPTY_FORM);
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container flex-center">
      <div className="glass-panel animate-fade-in auth-card">
        
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            {isLogin ? <LogIn size={32} color="var(--brand-primary)" /> : <UserPlus size={32} color="var(--brand-primary)" />}
          </div>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Login to access your dashboard' : 'Register to get started with HMS'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="input-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  id="name"
                  name="name"
                  className="input-field" 
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="sspId">SSP ID</label>
                <input 
                  type="text" 
                  id="sspId"
                  name="sspId"
                  className="input-field" 
                  placeholder="SSP12345"
                  value={formData.sspId}
                  onChange={handleChange}
                  required 
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email"
              name="email"
              className="input-field" 
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password"
              className="input-field" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required 
            />
            {!isLogin && <small style={{color: 'var(--text-muted)'}}>Must contain uppercase, lowercase & number.</small>}
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <>Need an account? <span className="auth-link" onClick={toggleMode}>Create one</span></>
          ) : (
            <>Already have an account? <span className="auth-link" onClick={toggleMode}>Sign In</span></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
