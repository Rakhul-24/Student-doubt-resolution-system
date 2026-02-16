import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const StaffDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="container">
        {/* Welcome Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card bg-success text-white shadow-lg">
              <div className="card-body p-4">
                <h1 className="card-title mb-2">Welcome, {user?.name}! 👋</h1>
                <p className="card-text mb-0">
                  Manage your slots, interact with students, and upload study materials.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row g-4 mb-5">
          <div className="col-md-6 col-lg-3">
            <Link to="/slots" className="text-decoration-none">
              <div className="card h-100 shadow hover-shadow" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body text-center">
                  <div style={{ fontSize: '2.5rem' }} className="mb-3">📅</div>
                  <h5 className="card-title fw-bold">Manage Slots</h5>
                  <p className="card-text text-muted small">
                    Create & manage your time slots
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-md-6 col-lg-3">
            <Link to="/chat" className="text-decoration-none">
              <div className="card h-100 shadow hover-shadow" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body text-center">
                  <div style={{ fontSize: '2.5rem' }} className="mb-3">💬</div>
                  <h5 className="card-title fw-bold">Chat</h5>
                  <p className="card-text text-muted small">
                    Chat with students in real-time
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-md-6 col-lg-3">
            <Link to="/materials" className="text-decoration-none">
              <div className="card h-100 shadow hover-shadow" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body text-center">
                  <div style={{ fontSize: '2.5rem' }} className="mb-3">📚</div>
                  <h5 className="card-title fw-bold">Materials</h5>
                  <p className="card-text text-muted small">
                    Upload & manage study materials
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-md-6 col-lg-3">
            <Link to="/slots?view=booked" className="text-decoration-none">
              <div className="card h-100 shadow hover-shadow" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="card-body text-center">
                  <div style={{ fontSize: '2.5rem' }} className="mb-3">✅</div>
                  <h5 className="card-title fw-bold">Bookings</h5>
                  <p className="card-text text-muted small">
                    View student bookings
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card shadow">
              <div className="card-header bg-info text-white fw-bold">
                ℹ️ Your Profile
              </div>
              <div className="card-body">
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Subject:</strong> {user?.subject || 'Not specified'}</p>
                <p><strong>Role:</strong> <span className="badge bg-success">Staff</span></p>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow">
              <div className="card-header bg-success text-white fw-bold">
                💡 Quick Tips
              </div>
              <div className="card-body">
                <ul className="mb-0">
                  <li className="mb-2">Create multiple time slots for flexibility</li>
                  <li className="mb-2">Upload materials regularly for students</li>
                  <li className="mb-2">Respond to student messages promptly</li>
                  <li className="mb-2">Manage bookings efficiently</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
