import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { authAPI, chatAPI, doubtAPI, slotAPI, SOCKET_URL } from '../services/api';


const STAFF_TABS = ['ask', 'doubts', 'slots', 'join'];
const AI_PROMPTS = [
  'Explain this topic in simple words with an example.',
  'Give me 5 practice questions from easy to hard.',
  'Make a quick revision sheet with formulas and mistakes to avoid.',
  'Compare two related concepts in a clean table.',
];

const starterMessages = () => [
  {
    senderId: 'chatbot',
    senderName: 'AI Assistant',
    message:
      'Ask anything you are studying. I can explain concepts, create quizzes, summarize chapters, and help you prepare before you move to a staff member.',
    timestamp: new Date().toISOString(),
    isStarter: true,
  },
];

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const createAiSession = () => ({
  _id: `chatbot-${Date.now()}`,
  name: 'New Chat',
  subject: 'AI study session',
  preview: 'Start a new conversation',
  updatedAt: new Date().toISOString(),
});

const sortSessions = (sessions) =>
  [...sessions].sort(
    (left, right) =>
      new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime()
  );

const getSessionStorageKey = (userId) => `ai_sessions_${userId}`;
const getHistoryStorageKey = (userId, sessionId) => `ai_chat_history_${userId}_${sessionId}`;

const shortenTitle = (message) => {
  const clean = message.replace(/\s+/g, ' ').trim();
  if (!clean) return 'New Chat';
  return clean.length > 34 ? `${clean.slice(0, 34).trim()}...` : clean;
};

const previewText = (message) =>
  (message || '')
    .replace(/[#>*`_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Start a new conversation';

const extractLinkId = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    return (
      url.searchParams.get('linkId') ||
      url.searchParams.get('slotId') ||
      url.pathname.split('/').filter(Boolean).pop() ||
      trimmed
    );
  } catch {
    return trimmed.split('/').filter(Boolean).pop() || trimmed;
  }
};

const formatHistory = (messages) =>
  messages
    .filter((entry) => !entry.isStarter && entry.message?.trim())
    .slice(-12)
    .map((entry) => ({
      role: entry.senderId === 'chatbot' ? 'assistant' : 'user',
      message: entry.message.trim(),
    }));

const formatTimestamp = (value) => {
  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Just now';
  }
};

const AskDoubtPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(
    STAFF_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'ask'
  );
  const [doubts, setDoubts] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    targetStaffId: '',
    question: '',
    requestSlot: searchParams.get('requestSlot') === '1',
  });
  const [aiSessions, setAiSessions] = useState([]);
  const [activeAiSessionId, setActiveAiSessionId] = useState('');
  const [aiMessages, setAiMessages] = useState(starterMessages());
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const socketRef = useRef(null);
  const aiScrollRef = useRef(null);
  const mode = location.pathname.endsWith('/ai') ? 'ai' : 'staff';
  const legacyMode = searchParams.get('mode') === 'ai' ? 'ai' : 'staff';
  const legacyRedirectTo = useMemo(() => {
    if (location.pathname !== '/doubts') {
      return '';
    }

    const redirectParams = new URLSearchParams();

    if (legacyMode === 'staff') {
      const tab = STAFF_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'ask';
      redirectParams.set('tab', tab);

      if (searchParams.get('requestSlot') === '1') {
        redirectParams.set('requestSlot', '1');
      }

      if (searchParams.get('linkId')) {
        redirectParams.set('linkId', searchParams.get('linkId'));
      }
    }

    if (legacyMode === 'ai' && searchParams.get('session')) {
      redirectParams.set('session', searchParams.get('session'));
    }

    const redirectPath = legacyMode === 'ai' ? '/doubts/ai' : '/doubts/staff';
    return `${redirectPath}${redirectParams.toString() ? `?${redirectParams.toString()}` : ''}`;
  }, [legacyMode, location.pathname, searchParams]);

  const activeAiSession = useMemo(
    () => aiSessions.find((session) => session._id === activeAiSessionId) || null,
    [aiSessions, activeAiSessionId]
  );

  const metrics = useMemo(
    () => [
      { label: 'Open Doubts', value: doubts.filter((item) => item.status !== 'Resolved').length },
      { label: 'My Sessions', value: mySlots.length },
      {
        label: 'Confirmed',
        value: mySlots.filter((item) => item.status === 'Confirmed').length,
      },
    ],
    [doubts, mySlots]
  );

  const aiIsFresh = useMemo(
    () => !aiMessages.some((message) => !message.isStarter && message.senderId !== 'chatbot'),
    [aiMessages]
  );

  const setRouteState = useCallback(
    (nextMode, nextView, extras = {}) => {
      const params = new URLSearchParams();

      if (nextMode === 'staff') {
        params.set('tab', nextView || 'ask');
        if (extras.requestSlot) params.set('requestSlot', '1');
        if (extras.linkId) params.set('linkId', extras.linkId);
      }

      if (nextMode === 'ai' && extras.sessionId) {
        params.set('session', extras.sessionId);
      }

      navigate(
        {
          pathname: nextMode === 'ai' ? '/doubts/ai' : '/doubts/staff',
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true }
      );
    },
    [navigate]
  );

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  const showError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(''), 4000);
  }, []);

  const persistSessions = useCallback(
    (sessions) => {
      if (!user?._id) return;
      localStorage.setItem(getSessionStorageKey(user._id), JSON.stringify(sortSessions(sessions)));
    },
    [user]
  );

  const persistMessages = useCallback(
    (sessionId, messages) => {
      if (!user?._id || !sessionId) return;
      localStorage.setItem(getHistoryStorageKey(user._id, sessionId), JSON.stringify(messages));
    },
    [user]
  );

  const mutateSessions = useCallback(
    (updater) => {
      setAiSessions((previous) => {
        const next = sortSessions(typeof updater === 'function' ? updater(previous) : updater);
        persistSessions(next);
        return next;
      });
    },
    [persistSessions]
  );

  const updateSessionMeta = useCallback(
    (sessionId, changes) => {
      mutateSessions((previous) =>
        previous.map((session) =>
          session._id === sessionId
            ? { ...session, ...changes, updatedAt: changes.updatedAt || new Date().toISOString() }
            : session
        )
      );
    },
    [mutateSessions]
  );

  const fetchStaff = useCallback(async () => {
    try {
      const response = await authAPI.getAllStaff();
      setStaffList(response.data.staff || []);
    } catch {
      console.error('Failed to fetch staff');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [doubtResponse, slotResponse] = await Promise.all([
        doubtAPI.getMyDoubts(),
        slotAPI.getMySlots(),
      ]);
      setDoubts(doubtResponse.data.doubts || []);
      setMySlots(slotResponse.data.slots || []);
    } catch {
      showError('Failed to refresh your support data.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadSessionMessages = useCallback(
    (sessionId) => {
      if (!user?._id || !sessionId) return starterMessages();
      const raw = localStorage.getItem(getHistoryStorageKey(user._id, sessionId));
      const parsed = parseJson(raw, []);
      return parsed.length ? parsed : starterMessages();
    },
    [user]
  );

  useEffect(() => {
    fetchStaff();
    fetchData();
  }, [fetchData, fetchStaff]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: sessionStorage.getItem('token') || localStorage.getItem('token'),
      },
    });

    socketRef.current.on('doubt_updated', fetchData);
    socketRef.current.on('slot_updated', fetchData);

    return () => {
      socketRef.current?.off('doubt_updated', fetchData);
      socketRef.current?.off('slot_updated', fetchData);
      socketRef.current?.disconnect();
    };
  }, [fetchData]);

  useEffect(() => {
    const requestedView = STAFF_TABS.includes(searchParams.get('tab'))
      ? searchParams.get('tab')
      : 'ask';
    const requestedLinkId = searchParams.get('linkId');

    if (mode === 'staff') {
      setView(requestedView);
      if (searchParams.get('requestSlot') === '1') {
        setFormData((previous) =>
          previous.requestSlot ? previous : { ...previous, requestSlot: true }
        );
      }
      if (requestedLinkId) setJoinLink(requestedLinkId);
    }
  }, [mode, searchParams]);

  useEffect(() => {
    if (!user?._id) return;
    const stored = parseJson(localStorage.getItem(getSessionStorageKey(user._id)), []);
    const nextSessions = stored.length
      ? sortSessions(
          stored.map((session) => ({
            ...session,
            name: session.name || 'New Chat',
            subject: session.subject || 'AI study session',
            preview: session.preview || 'Start a new conversation',
          }))
        )
      : [createAiSession()];
    setAiSessions(nextSessions);
    if (!stored.length) persistSessions(nextSessions);
  }, [persistSessions, user]);

  useEffect(() => {
    if (!aiSessions.length) return;
    const requestedSessionId = searchParams.get('session');
    if (requestedSessionId && aiSessions.some((session) => session._id === requestedSessionId)) {
      setActiveAiSessionId(requestedSessionId);
      return;
    }
    if (!activeAiSessionId || !aiSessions.some((session) => session._id === activeAiSessionId)) {
      setActiveAiSessionId(aiSessions[0]._id);
    }
  }, [activeAiSessionId, aiSessions, searchParams]);

  useEffect(() => {
    if (activeAiSessionId) {
      setAiMessages(loadSessionMessages(activeAiSessionId));
    }
  }, [activeAiSessionId, loadSessionMessages]);

  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTo({
        top: aiScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [aiLoading, aiMessages]);

  if (legacyRedirectTo) {
    return <Navigate replace to={legacyRedirectTo} />;
  }

  const handleModeChange = (nextMode) => {
    if (nextMode === 'ai') {
      const fallbackSessionId = activeAiSessionId || aiSessions[0]?._id;
      setRouteState('ai', view, { sessionId: fallbackSessionId });
      return;
    }

    setRouteState('staff', view);
  };

  const handleStaffTabChange = (nextView) => {
    setView(nextView);
    setRouteState('staff', nextView);
  };

  const handleStaffSelect = (targetStaffId) => {
    const selectedStaff = staffList.find((staffMember) => staffMember._id === targetStaffId);
    setFormData((previous) => ({
      ...previous,
      targetStaffId,
      subject: previous.subject || selectedStaff?.subject || '',
    }));
  };

  const handleAskDoubt = async (event) => {
    event.preventDefault();
    if (!formData.question.trim()) {
      showError('Please enter your question before submitting.');
      return;
    }
    if (!formData.subject && !formData.targetStaffId) {
      showError('Please choose a subject or a specific staff member.');
      return;
    }
    try {
      await doubtAPI.createDoubt(formData);
      setFormData({ subject: '', targetStaffId: '', question: '', requestSlot: false });
      setView('doubts');
      setRouteState('staff', 'doubts');
      showSuccess('Your doubt was sent to staff.');
      fetchData();
    } catch (requestError) {
      showError(requestError.response?.data?.error || 'Failed to submit your doubt.');
    }
  };

  const handleJoinSlot = async (event) => {
    event.preventDefault();
    const linkId = extractLinkId(joinLink);
    if (!linkId) {
      showError('Enter a valid invite link or session code.');
      return;
    }
    try {
      await slotAPI.joinSlot(linkId);
      setJoinLink('');
      setView('slots');
      setRouteState('staff', 'slots');
      showSuccess('You joined the session successfully.');
      fetchData();
    } catch (requestError) {
      showError(requestError.response?.data?.error || 'Failed to join the session.');
    }
  };

  const handleConfirmSlot = async (slotId) => {
    try {
      await slotAPI.confirmSlot(slotId);
      showSuccess('Session confirmed successfully.');
      fetchData();
    } catch (requestError) {
      showError(requestError.response?.data?.error || 'Failed to confirm the session.');
    }
  };

  const handleCopyInviteLink = async (shareableLink) => {
    const inviteLink = `${window.location.origin}/doubts/staff?tab=join&linkId=${shareableLink}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        showSuccess('Invite link copied to clipboard.');
      }
    } catch {
      showError('Could not copy the invite link automatically.');
    }
  };

  const handleNewAiSession = () => {
    const session = createAiSession();
    mutateSessions((previous) => [session, ...previous]);
    setActiveAiSessionId(session._id);
    setAiMessages(starterMessages());
    setAiDraft('');
    setRouteState('ai', view, { sessionId: session._id });
  };

  const handleSelectAiSession = (sessionId) => {
    setActiveAiSessionId(sessionId);
    setRouteState('ai', view, { sessionId });
  };

  const handleResetAiChat = () => {
    if (!activeAiSessionId) return;
    const freshMessages = starterMessages();
    setAiMessages(freshMessages);
    persistMessages(activeAiSessionId, freshMessages);
    updateSessionMeta(activeAiSessionId, {
      name: 'New Chat',
      preview: 'Start a new conversation',
      updatedAt: new Date().toISOString(),
    });
    setAiDraft('');
    showSuccess('AI conversation reset.');
  };

  const handleAiSend = async (presetPrompt) => {
    const message = (presetPrompt ?? aiDraft).trim();
    if (!message || !user?._id || !activeAiSessionId || aiLoading) return;

    const userMessage = {
      senderId: user._id,
      senderName: user.name,
      message,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...aiMessages, userMessage];

    setAiMessages(nextMessages);
    persistMessages(activeAiSessionId, nextMessages);
    setAiDraft('');
    setAiLoading(true);

    updateSessionMeta(activeAiSessionId, {
      name:
        !activeAiSession || activeAiSession.name === 'New Chat'
          ? `AI: ${shortenTitle(message)}`
          : activeAiSession.name,
      preview: previewText(message),
      updatedAt: userMessage.timestamp,
    });

    try {
      const response = await chatAPI.getChatbotResponse({
        message,
        history: formatHistory(nextMessages),
      });
      const assistantMessage = {
        senderId: 'chatbot',
        senderName: 'AI Assistant',
        message: response.data.response,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...nextMessages, assistantMessage];
      setAiMessages(finalMessages);
      persistMessages(activeAiSessionId, finalMessages);
      updateSessionMeta(activeAiSessionId, {
        preview: previewText(assistantMessage.message),
        updatedAt: assistantMessage.timestamp,
      });
    } catch (requestError) {
      const fallbackMessage = {
        senderId: 'chatbot',
        senderName: 'AI Assistant',
        message:
          requestError.response?.data?.response ||
          'The AI assistant is unavailable right now. You can continue with the staff route for guided support.',
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...nextMessages, fallbackMessage];
      setAiMessages(finalMessages);
      persistMessages(activeAiSessionId, finalMessages);
      updateSessionMeta(activeAiSessionId, {
        preview: previewText(fallbackMessage.message),
        updatedAt: fallbackMessage.timestamp,
      });
    } finally {
      setAiLoading(false);
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

  const renderStaffContent = () => {
    if (loading) {
      return <div className="island-card support-empty-card">Loading your support activity...</div>;
    }

    if (view === 'ask') {
      return (
        <div className="island-card support-panel-card">
          <h3>Send a doubt to staff</h3>
          <p className="support-muted">
            Pick a subject, optionally target a specific staff member, and enable the live slot
            request if you need one.
          </p>
          <form onSubmit={handleAskDoubt} className="support-form-stack">
            <div className="support-form-grid">
              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Subject</span>
                <select
                  className="form-input"
                  value={formData.subject}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      subject: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a subject</option>
                  {[...new Set(staffList.map(s => s.subject).filter(Boolean))].map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-group" style={{ marginBottom: 0 }}>
                <span className="form-label">Specific Staff</span>
                <select
                  className="form-input"
                  value={formData.targetStaffId}
                  onChange={(event) => handleStaffSelect(event.target.value)}
                >
                  <option value="">Anyone available</option>
                  {staffList.map((staffMember) => (
                    <option key={staffMember._id} value={staffMember._id}>
                      {staffMember.name} ({staffMember.subject})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="form-group" style={{ marginBottom: 0 }}>
              <span className="form-label">Your Question</span>
              <textarea
                rows="6"
                className="form-input"
                style={{ resize: 'vertical', minHeight: '170px' }}
                value={formData.question}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    question: event.target.value,
                  }))
                }
                placeholder="Explain the doubt clearly, what you tried, and where you got stuck."
              />
            </label>

            <label className="support-checkbox">
              <input
                type="checkbox"
                checked={formData.requestSlot}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    requestSlot: event.target.checked,
                  }))
                }
              />
              <span>Request a live slot for this doubt.</span>
            </label>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={!formData.question.trim() || (!formData.subject && !formData.targetStaffId)}
            >
              Submit to Staff
            </button>
          </form>
        </div>
      );
    }

    if (view === 'doubts') {
      return (
        <div className="support-stack">
          {doubts.length === 0 ? (
            <div className="island-card support-empty-card">No doubts submitted yet.</div>
          ) : (
            doubts.map((doubt) => (
              <div key={doubt._id} className="island-card support-list-card">
                <div className="support-list-topline">
                  <div>
                    <h3>{doubt.subject}</h3>
                    <p className="support-muted">
                      {doubt.targetStaffId?.name
                        ? `Directed to ${doubt.targetStaffId.name}`
                        : 'Open to matching staff'}
                    </p>
                  </div>
                  <span className="support-status">{doubt.status}</span>
                </div>
                <p>{doubt.question}</p>
                {doubt.reply && (
                  <div className="support-note-box" style={{ marginTop: '1rem', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderLeft: '4px solid var(--accent-primary)' }}>
                    <strong>Staff Reply:</strong> <p style={{ margin: 0 }}>{doubt.reply}</p>
                  </div>
                )}
                <div className="support-list-footer">
                  <span>Requested slot: {doubt.requestSlot ? 'Yes' : 'No'}</span>
                  <span>Asked on {new Date(doubt.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    if (view === 'slots') {
      return (
        <div className="support-stack">
          {mySlots.length === 0 ? (
            <div className="island-card support-empty-card">No sessions scheduled yet.</div>
          ) : (
            mySlots.map((slot) => (
              <div key={slot._id} className="island-card support-list-card">
                <div className="support-list-topline">
                  <div>
                    <h3>{slot.topic || 'Live session'}</h3>
                    <p className="support-muted">
                      {slot.staffId?.name || 'Staff member'}
                      {slot.staffId?.subject ? ` - ${slot.staffId.subject}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{formatDateTime(slot.date, slot.time)}</strong>
                    <p className="support-muted">{slot.duration} mins</p>
                  </div>
                </div>

                {slot.notes && <div className="support-note-box">{slot.notes}</div>}

                <div className="support-list-footer">
                  <span className="support-status">
                    {isSlotExpired(slot.date, slot.time) && slot.status === 'Pending Student Confirmation' 
                      ? 'Expired / Not Booked' 
                      : slot.status}
                  </span>
                  <div className="support-action-row">
                    <button
                      type="button"
                      className="support-secondary-btn"
                      onClick={() => handleCopyInviteLink(slot.shareableLink)}
                    >
                      Copy Invite Link
                    </button>
                    {slot.status === 'Pending Student Confirmation' && !isSlotExpired(slot.date, slot.time) && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleConfirmSlot(slot._id)}
                      >
                        Confirm Attendance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="island-card support-panel-card">
        <h3>Join a session with a link</h3>
        <p className="support-muted">
          Paste the full invite URL or only the raw code. Both work here.
        </p>
        <form onSubmit={handleJoinSlot} className="support-form-stack">
          <input
            className="form-input"
            value={joinLink}
            onChange={(event) => setJoinLink(event.target.value)}
            placeholder="Paste invite link or session code"
          />
          <button className="btn btn-primary" type="submit" disabled={!joinLink.trim()}>
            Join Session
          </button>
        </form>
      </div>
    );
  };

  const renderAiContent = () => (
    <div className="support-ai-layout" style={{ flex: 1, minHeight: '600px', margin: 0 }}>
      <aside className="support-ai-sidebar">
        <div className="support-ai-sidebar-top">
          <div>
            <span className="support-pill">AI workspace</span>
            <h3>History</h3>
          </div>
          <button type="button" className="support-secondary-btn" onClick={handleNewAiSession}>
            New Chat
          </button>
        </div>

        <div className="support-ai-session-list">
          {aiSessions.map((session) => (
            <button
              key={session._id}
              type="button"
              className={`support-ai-session ${activeAiSessionId === session._id ? 'active' : ''}`}
              onClick={() => handleSelectAiSession(session._id)}
            >
              <strong>{session.name}</strong>
              <span>{session.preview}</span>
              <small>{formatTimestamp(session.updatedAt)}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="support-ai-main" style={{ overflow: 'hidden' }}>
        <div className="support-ai-toolbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>{activeAiSession?.name || 'AI Study Assistant'}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="button" className="support-secondary-btn" onClick={() => handleModeChange('staff')} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Switch to Staff
            </button>
            <button type="button" className="btn btn-primary" onClick={handleResetAiChat} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              New Topic
            </button>
          </div>
        </div>

        <div className="support-ai-messages" ref={aiScrollRef}>
          {aiMessages.map((message, index) => {
            const isUserMessage = message.senderId === user?._id;
            return (
              <div
                key={`${message.timestamp}-${index}`}
                className={`support-ai-message ${isUserMessage ? 'user' : 'assistant'}`}
              >
                <div className="support-ai-message-meta">
                  <span>{isUserMessage ? 'You' : 'AI Assistant'}</span>
                  <span>{formatTimestamp(message.timestamp)}</span>
                </div>
                {isUserMessage ? (
                  <p>{message.message}</p>
                ) : (
                  <div className="support-ai-markdown">
                    <ReactMarkdown>{message.message}</ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}

          {aiLoading && (
            <div className="support-ai-message assistant">
              <div className="support-ai-message-meta">
                <span>AI Assistant</span>
                <span>Thinking...</span>
              </div>
              <p>Working through your question...</p>
            </div>
          )}
        </div>

        {aiIsFresh && (
          <div className="support-ai-prompts">
            {AI_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="support-ai-prompt"
                onClick={() => handleAiSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="support-ai-composer">
          <textarea
            rows="3"
            className="support-ai-textarea"
            value={aiDraft}
            onChange={(event) => setAiDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleAiSend();
              }
            }}
            placeholder="Ask for an explanation, quiz, summary, or study plan..."
          />
          <button
            type="button"
            className="btn btn-primary support-ai-send"
            onClick={() => handleAiSend()}
            disabled={!aiDraft.trim() || aiLoading}
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="page-content" style={mode === 'ai' ? { display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)', padding: '1rem 2rem' } : {}}>
        {mode === 'staff' && (
          <div className="support-header support-header-row">
            <div>
              <span className="support-pill">Teacher-guided help</span>
              <h1 className="dashboard-title">Ask Staff</h1>
              <p className="dashboard-subtitle">
                Use the staff page to submit doubts, request a live slot, and manage your scheduled teacher sessions.
              </p>
            </div>
            <button
              type="button"
              className="support-secondary-btn"
              onClick={() => handleModeChange('ai')}
            >
              Open AI Page
            </button>
          </div>
        )}

        {error && <div className="support-alert error">{error}</div>}
        {successMessage && <div className="support-alert success">{successMessage}</div>}

        {mode === 'staff' ? (
          <>
            <div className="support-metric-grid">
              {metrics.map((item) => (
                <div key={item.label} className="support-metric-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="support-tab-strip">
              {STAFF_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`support-tab ${view === tab ? 'active' : ''}`}
                  onClick={() => handleStaffTabChange(tab)}
                >
                  {tab === 'ask' && 'Ask Staff'}
                  {tab === 'doubts' && `My Doubts (${doubts.length})`}
                  {tab === 'slots' && `My Sessions (${mySlots.length})`}
                  {tab === 'join' && 'Join Link'}
                </button>
              ))}
            </div>

            {renderStaffContent()}
          </>
        ) : (
          renderAiContent()
        )}
      </div>
    </>
  );
};

export default AskDoubtPage;
