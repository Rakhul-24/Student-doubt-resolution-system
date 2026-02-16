import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="container-fluid py-5 bg-light min-vh-100">
      <div className="container">
        {/* Welcome Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card bg-primary text-white shadow-lg">
              <div className="card-body p-4">
                <h1 className="card-title mb-2">Welcome, {user?.name}! 👋</h1>
                <p className="card-text mb-0">
                  Ready to resolve your academic doubts? Let's get started!
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
                  <h5 className="card-title fw-bold">Book Slots</h5>
                  <p className="card-text text-muted small">
                    Schedule sessions with staff
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
                    Real-time discussion with staff
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
                    Access study materials
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
                  <h5 className="card-title fw-bold">My Bookings</h5>
                  <p className="card-text text-muted small">
                    View your booked sessions
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
                ℹ️ How to Use
              </div>
              <div className="card-body">
                <ol className="mb-0">
                  <li className="mb-2">Browse available staff slots</li>
                  <li className="mb-2">Book a slot that suits your schedule</li>
                  <li className="mb-2">Chat with staff in real-time</li>
                  <li className="mb-2">Access study materials uploaded by staff</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow">
              <div className="card-header bg-success text-white fw-bold">
                💡 Tips
              </div>
              <div className="card-body">
                <ul className="mb-0">
                  <li className="mb-2">Book slots early to get preferred timings</li>
                  <li className="mb-2">Prepare your questions before the session</li>
                  <li className="mb-2">Download materials for offline access</li>
                  <li className="mb-2">Rate and provide feedback after sessions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
