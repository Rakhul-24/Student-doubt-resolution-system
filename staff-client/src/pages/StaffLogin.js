import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const StaffLogin = () => {
  const { googleLogin, googleRegister } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Registration State
  const [requiresRegistration, setRequiresRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    role: 'staff',
    subject: '',
    googleToken: '',
    name: '',
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (requiresRegistration) {
      setRegistrationData((prev) => ({ ...prev, [name]: value }));
    }
  };



  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const res = await googleLogin({ token: credentialResponse.credential, role: 'staff' });
      
      if (res?.requiresRegistration) {
        setRequiresRegistration(true);
        setRegistrationData((prev) => ({
          ...prev,
          googleToken: res.googleToken,
          name: res.name,
          email: res.email,
        }));
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Login failed completely.');
  };

  const handleGoogleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await googleRegister(registrationData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Google Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (requiresRegistration) {
    return (
      <>
        <div className="animated-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="island-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="nav-unread" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '4px 12px', display: 'inline-block', marginBottom: '1rem' }}>Complete Profile</span>
              <h2 className="island-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome, {registrationData.name.split(' ')[0]}!</h2>
              <p className="island-desc">Please complete your profile to finish creating your account.</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{error}</span>
                <button onClick={() => setError('')} style={{ color: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer' }}>x</button>
              </div>
            )}

            <form onSubmit={handleGoogleRegisterSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="role" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>I am a...</label>
                <select
                  className="form-input"
                  style={{ width: '100%' }}
                  id="role"
                  name="role"
                  value={registrationData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff / Guide</option>
                </select>
              </div>

              {registrationData.role === 'staff' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="subject" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Department / Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%' }}
                    id="subject"
                    name="subject"
                    value={registrationData.subject}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Computer Science"
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Registration'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setRequiresRegistration(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="island-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="nav-unread" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '4px 12px', display: 'inline-block', marginBottom: '1rem' }}>GuideDesk</span>
            <h2 className="island-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>GuideDesk Login</h2>
            <p className="island-desc">Sign in to manage students, sessions, and learning materials.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ color: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer' }}>x</button>
            </div>
          )}

          <div style={{ padding: '2rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.6' }}>
              Welcome! Please sign in using your Google account to access your guide dashboard.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                size="large"
                text="continue_with"
                width="300px"
              />
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>Secure SSO Login</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffLogin;
