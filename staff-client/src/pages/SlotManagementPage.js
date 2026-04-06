import React, { useState, useEffect, useRef } from 'react';
import { slotAPI, doubtAPI } from '../services/api';
import io from 'socket.io-client';

const SlotManagementPage = () => {
  const [doubts, setDoubts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [view, setView] = useState('doubts');
  
  const [showModal, setShowModal] = useState(false);
  const [activeDoubt, setActiveDoubt] = useState(null);
  
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: 30,
    topic: '',
    notes: ''
  });

  const socketRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      auth: { token: sessionStorage.getItem('token') || localStorage.getItem('token') },
    });

    socketRef.current.on('doubt_updated', () => fetchData());
    socketRef.current.on('slot_updated', () => fetchData());

    return () => {
      socketRef.current.off('doubt_updated');
      socketRef.current.off('slot_updated');
      socketRef.current.disconnect();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [doubtsRes, slotsRes] = await Promise.all([
        doubtAPI.getStaffDoubts(),
        slotAPI.getMySlots(),
      ]);
      setDoubts(doubtsRes.data.doubts || []);
      setSlots(slotsRes.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleOpenModal = (doubt) => {
    setActiveDoubt(doubt);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      duration: 30,
      topic: doubt.subject,
      notes: ''
    });
    setShowModal(true);
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await slotAPI.createSlotForDoubt({
        doubtId: activeDoubt._id,
        ...formData
      });
      showSuccess('Session generated and assigned successfully.');
      setShowModal(false);
      setActiveDoubt(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to schedule session');
    }
  };

  const handleResolveDoubt = async (e) => {
    e.preventDefault();
    try {
      const payload = { status: 'Resolved' };
      if (replyText.trim()) {
         payload.reply = replyText.trim();
      }
      await doubtAPI.updateDoubtStatus(activeDoubt._id, payload);
      
      setShowReplyModal(false);
      setReplyText('');
      setActiveDoubt(null);
      
      showSuccess('Doubt marked as resolved.');
      fetchData();
    } catch (err) {
      setError('Failed to resolve doubt');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await slotAPI.deleteSlot(slotId);
      showSuccess('Session deleted successfully.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete session');
    }
  };

  const formatDateTime = (date, time) => {
    try {
      return `${new Date(date).toLocaleDateString()} at ${time}`;
    } catch {
      return `${date} at ${time}`;
    }
  };

  const isSlotExpired = (date, time) => {
    if (!date || !time) return false;
    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const slotDateTime = new Date(`${date}T${normalizedTime}`);
    return !Number.isNaN(slotDateTime.getTime()) && slotDateTime <= new Date();
  };

  const activeDoubts = doubts.filter(d => d.status === 'Open');
  const pastDoubts = doubts.filter(d => d.status !== 'Open');

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="dashboard-title">Doubts & Sessions</h1>
            <p className="dashboard-subtitle">Manage student queries and schedule live sessions.</p>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ color: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        )}

        {successMessage && (
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--status-success)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} style={{ color: 'inherit', background: 'transparent', border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            style={{ padding: '0.5rem 1.5rem', borderRadius: '999px', border: 'none', fontWeight: 'bold', background: view === 'doubts' ? 'var(--accent-primary)' : 'var(--bg-surface-solid)', color: view === 'doubts' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer'}}
            onClick={() => setView('doubts')}
          >
            Student Doubts ({activeDoubts.length})
          </button>
          <button
            style={{ padding: '0.5rem 1.5rem', borderRadius: '999px', border: 'none', fontWeight: 'bold', background: view === 'slots' ? 'var(--accent-primary)' : 'var(--bg-surface-solid)', color: view === 'slots' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer'}}
            onClick={() => setView('slots')}
          >
            My Sessions ({slots.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <>
            {view === 'doubts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Active Queries</h2>
                {activeDoubts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No pending queries right now.</p>
                ) : activeDoubts.map(doubt => (
                  <div key={doubt._id} className="island-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <strong>{doubt.studentId?.name}</strong> asked about <strong>{doubt.subject}</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(doubt.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p style={{ background: 'var(--bg-document)', padding: '1rem', borderRadius: '8px' }}>
                      {doubt.question}
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {doubt.requestSlot ? (
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                           🎓 Student requested a live session
                        </span>
                      ) : null}
                      <div style={{ flex: 1 }}></div>
                      
                      <button className="btn btn-secondary" onClick={() => { setActiveDoubt(doubt); setReplyText(''); setShowReplyModal(true); }}>
                         Reply & Resolve
                      </button>
                      
                      <button className="btn btn-primary" onClick={() => handleOpenModal(doubt)}>Schedule Session</button>
                    </div>
                  </div>
                ))}

                {pastDoubts.length > 0 && (
                  <>
                    <h2 style={{ fontSize: '1.25rem', marginTop: '2rem' }}>Past Queries</h2>
                    {pastDoubts.map(doubt => (
                      <div key={doubt._id} className="island-card" style={{ padding: '1.5rem', opacity: 0.7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div><strong>{doubt.studentId?.name}</strong> - {doubt.subject}</div>
                          <span style={{ color: 'var(--status-success)', fontWeight: 'bold' }}>{doubt.status}</span>
                        </div>
                        <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>{doubt.question}</p>
                        {doubt.reply && (
                          <div style={{ padding: '0.75rem', marginTop: '0.75rem', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                            <strong style={{ fontSize: '0.85rem' }}>Your Reply:</strong>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{doubt.reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {view === 'slots' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {slots.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>You haven't scheduled any sessions.</p>
                ) : slots.map(slot => (
                  <div key={slot._id} className="island-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>{slot.topic}</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                             <strong>Enrolled Students:</strong> {slot.studentIds.map(s => s.name).join(', ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{formatDateTime(slot.date, slot.time)}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{slot.duration} mins</div>
                        </div>
                     </div>
                     
                     {slot.notes && (
                       <div style={{ padding: '0.75rem', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                         <strong style={{ fontSize: '0.85rem' }}>Meeting Notes / External Link:</strong>
                         <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{slot.notes}</p>
                       </div>
                     )}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <span style={{ 
                            padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold',
                            background: slot.status === 'Confirmed' ? 'rgba(34,197,94,0.2)' : (isSlotExpired(slot.date, slot.time) && slot.status === 'Pending Student Confirmation' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245,158,11,0.2)'),
                            color: slot.status === 'Confirmed' ? 'var(--status-success)' : (isSlotExpired(slot.date, slot.time) && slot.status === 'Pending Student Confirmation' ? 'var(--status-danger)' : 'var(--status-warning)')
                          }}>
                            {isSlotExpired(slot.date, slot.time) && slot.status === 'Pending Student Confirmation' ? 'Expired / Not Booked' : slot.status}
                        </span>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                           <button 
                             style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-document)', border: '1px solid rgba(255,255,255,0.2)', color: 'inherit', cursor: 'pointer' }}
                             onClick={() => { navigator.clipboard.writeText(slot.shareableLink); showSuccess('Link copied successfully!'); }}
                           >
                             Copy Share Link
                           </button>
                           <button 
                             style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--status-danger)', border: '1px solid var(--status-danger)', cursor: 'pointer' }}
                             onClick={() => handleDeleteSlot(slot._id)}
                           >
                             Delete
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for Scheduling Session */}
      {showModal && activeDoubt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="island-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Schedule Session</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Generating a session link for <strong>{activeDoubt.studentId?.name}</strong> regarding {activeDoubt.subject}.</p>
            
            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Time</label>
                  <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (mins)</label>
                  <input type="number" required min="15" step="15" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit' }} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Topic</label>
                  <input type="text" required value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Meeting Notes / External Link (Optional)</label>
                <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit' }}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Generate Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Replying & Resolving */}
      {showReplyModal && activeDoubt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="island-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Reply & Resolve</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Provide an answer to <strong>{activeDoubt.studentId?.name}</strong>.</p>
            
            <form onSubmit={handleResolveDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Answer / Reply</label>
                <textarea 
                   rows="4" 
                   required
                   value={replyText} 
                   onChange={e => setReplyText(e.target.value)} 
                   placeholder="Write your explanation here..."
                   style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', color: 'inherit', resize: 'vertical' }}>
                </textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowReplyModal(false); setActiveDoubt(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Reply & Resolve</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SlotManagementPage;
