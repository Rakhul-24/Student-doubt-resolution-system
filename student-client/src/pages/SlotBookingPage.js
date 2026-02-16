import React, { useState, useEffect } from 'react';
import { slotAPI, authAPI } from '../services/api';

const SlotBookingPage = () => {
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('available');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const [availableRes, bookedRes] = await Promise.all([
        slotAPI.getAvailableSlots(),
        slotAPI.getMySlots(),
      ]);
      setSlots(availableRes.data.slots || []);
      setBookedSlots(bookedRes.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId, staffId) => {
    try {
      await slotAPI.bookSlot({ slotId });
      setSuccessMessage('Slot booked successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book slot');
    }
  };

  const handleCancelBooking = async (slotId) => {
    try {
      await slotAPI.cancelBooking(slotId);
      setSuccessMessage('Booking cancelled successfully! ✅');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
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
            <h1 className="display-5 fw-bold text-primary">📅 Slot Booking</h1>
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

        {/* View Toggle */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn ${view === 'available' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('available')}
              >
                Available Slots
              </button>
              <button
                type="button"
                className={`btn ${view === 'booked' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('booked')}
              >
                My Bookings ({bookedSlots.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : view === 'available' ? (
          <div className="row g-4">
            {slots.length === 0 ? (
              <div className="col-12">
                <div className="alert alert-info text-center">
                  No available slots at the moment. Check back later!
                </div>
              </div>
            ) : (
              slots.map((slot) => (
                <div key={slot._id} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0 fw-bold">{slot.staffId?.name || 'Staff'}</h6>
                      <small>{slot.staffId?.subject || 'Subject'}</small>
                    </div>
                    <div className="card-body">
                      <p className="mb-2">
                        <strong>📅 Date & Time:</strong><br />
                        {formatDateTime(slot.date, slot.time)}
                      </p>
                      <p className="mb-2">
                        <strong>⏱️ Duration:</strong> {slot.duration} minutes
                      </p>
                      {slot.topic && (
                        <p className="mb-2">
                          <strong>📝 Topic:</strong> {slot.topic}
                        </p>
                      )}
                      <p>
                        <span className="badge bg-success">Available</span>
                      </p>
                    </div>
                    <div className="card-footer">
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => handleBookSlot(slot._id, slot.staffId?._id)}
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="row g-4">
            {bookedSlots.length === 0 ? (
              <div className="col-12">
                <div className="alert alert-info text-center">
                  You haven't booked any slots yet. Start by booking an available slot!
                </div>
              </div>
            ) : (
              bookedSlots.map((slot) => (
                <div key={slot._id} className="col-md-6 col-lg-4">
                  <div className="card h-100 shadow">
                    <div className="card-header bg-success text-white">
                      <h6 className="mb-0 fw-bold">{slot.staffId?.name || 'Staff'}</h6>
                      <small>{slot.staffId?.subject || 'Subject'}</small>
                    </div>
                    <div className="card-body">
                      <p className="mb-2">
                        <strong>📅 Date & Time:</strong><br />
                        {formatDateTime(slot.date, slot.time)}
                      </p>
                      <p className="mb-2">
                        <strong>⏱️ Duration:</strong> {slot.duration} minutes
                      </p>
                      {slot.topic && (
                        <p className="mb-2">
                          <strong>📝 Topic:</strong> {slot.topic}
                        </p>
                      )}
                      <p>
                        <span className="badge bg-success">Booked</span>
                      </p>
                    </div>
                    <div className="card-footer">
                      <button
                        className="btn btn-danger w-100"
                        onClick={() => handleCancelBooking(slot._id)}
                      >
                        Cancel Booking
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotBookingPage;
