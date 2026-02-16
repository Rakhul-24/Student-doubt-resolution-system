import React, { useState, useEffect } from 'react';
import { slotAPI } from '../services/api';

const SlotManagementPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 30,
    topic: '',
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await slotAPI.getMySlots();
      setSlots(res.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value,
    }));
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await slotAPI.createSlot(formData);
      setSuccessMessage('Slot created successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      setFormData({ date: '', time: '', duration: 30, topic: '' });
      setShowForm(false);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      try {
        await slotAPI.deleteSlot(slotId);
        setSuccessMessage('Slot deleted successfully! ✅');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchSlots();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete slot');
      }
    }
  };

  const formatDateTime = (date, time) => {
    try {
      return `${new Date(date).toLocaleDateString()} at ${time}`;
    } catch {
      return `${date} at ${time}`;
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container">
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-5 fw-bold text-success">📅 Slot Management</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}

        {/* Create Slot Form */}
        <div className="row mb-4">
          <div className="col-12">
            <button
              className="btn btn-success mb-3"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '❌ Cancel' : '➕ Create New Slot'}
            </button>

            {showForm && (
              <div className="card shadow">
                <div className="card-header bg-success text-white fw-bold">
                  Create New Slot
                </div>
                <div className="card-body">
                  <form onSubmit={handleCreateSlot}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="date" className="form-label">
                          Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="time" className="form-label">
                          Time
                        </label>
                        <input
                          type="time"
                          className="form-control"
                          id="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="duration" className="form-label">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="duration"
                          name="duration"
                          value={formData.duration}
                          onChange={handleInputChange}
                          min="15"
                          max="120"
                          step="15"
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label htmlFor="topic" className="form-label">
                          Topic (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="topic"
                          name="topic"
                          value={formData.topic}
                          onChange={handleInputChange}
                          placeholder="e.g., Algebra Basics"
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-success w-100">
                      Create Slot
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Slots Table */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div className="alert alert-info text-center">
            No slots created yet. Create your first slot!
          </div>
        ) : (
          <div className="card shadow">
            <div className="card-header bg-success text-white fw-bold">
              Your Slots
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Student</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot) => (
                    <tr key={slot._id}>
                      <td className="fw-bold">{formatDateTime(slot.date, slot.time)}</td>
                      <td>{slot.duration} min</td>
                      <td>{slot.topic || '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            slot.status === 'Booked'
                              ? 'bg-success'
                              : 'bg-warning'
                          }`}
                        >
                          {slot.status}
                        </span>
                      </td>
                      <td>{slot.studentId?.name || '—'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteSlot(slot._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotManagementPage;
