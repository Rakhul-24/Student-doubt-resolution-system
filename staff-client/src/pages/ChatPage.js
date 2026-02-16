import React, { useState, useEffect, useContext, useRef } from 'react';
import { chatAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    socket.current = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    socket.current.emit('user_join', user?._id);

    socket.current.on('receive_message', (data) => {
      if (data.senderId === selectedUser?._id) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socket.current.disconnect();
  }, [user, selectedUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await chatAPI.getChats();
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    }
  };

  const handleSelectUser = async (student) => {
    setSelectedUser(student);
    setLoading(true);
    try {
      const res = await chatAPI.getChatHistory(student._id);
      setMessages(res.data.messages || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const messageData = {
        receiverId: selectedUser._id,
        message: newMessage.trim(),
      };

      await chatAPI.sendMessage(messageData);
      socket.current.emit('send_message', {
        senderId: user._id,
        receiverId: selectedUser._id,
        message: newMessage.trim(),
      });

      setMessages((prev) => [
        ...prev,
        {
          senderId: user._id,
          senderName: user.name,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <h1 className="display-5 fw-bold text-success">💬 Chat with Students</h1>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="row g-0" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Users List */}
          <div className="col-md-3 bg-white border shadow-sm">
            <div className="p-3 border-bottom">
              <h5 className="mb-0 fw-bold">Students</h5>
            </div>
            <div style={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {users.length === 0 ? (
                <div className="p-3 text-muted text-center">No messages yet</div>
              ) : (
                users.map((student) => (
                  <button
                    key={student._id}
                    className={`w-100 text-start p-3 border-bottom btn ${
                      selectedUser?._id === student._id
                        ? 'bg-success text-white'
                        : 'bg-white text-dark'
                    }`}
                    onClick={() => handleSelectUser(student)}
                  >
                    <div className="fw-bold">{student.name}</div>
                    <small>{student.email}</small>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-md-9 d-flex flex-column bg-white">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-bottom bg-success text-white">
                  <h5 className="mb-0">{selectedUser.name}</h5>
                  <small>{selectedUser.email}</small>
                </div>

                {/* Messages */}
                <div
                  className="flex-grow-1 p-3"
                  style={{ overflowY: 'auto', height: 'calc(100vh - 350px)' }}
                >
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`d-flex mb-3 ${
                          msg.senderId === user._id ? 'justify-content-end' : 'justify-content-start'
                        }`}
                      >
                        <div
                          className={`p-2 rounded ${
                            msg.senderId === user._id
                              ? 'bg-success text-white'
                              : 'bg-light text-dark'
                          }`}
                          style={{ maxWidth: '70%', wordWrap: 'break-word' }}
                        >
                          <p className="mb-1">{msg.message}</p>
                          <small className="text-muted">
                            {formatTime(msg.timestamp)}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-top bg-light">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      className="btn btn-success"
                      type="button"
                      onClick={handleSendMessage}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center justify-content-center h-100">
                <div className="text-center text-muted">
                  <h5>Select a student to start chatting</h5>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
