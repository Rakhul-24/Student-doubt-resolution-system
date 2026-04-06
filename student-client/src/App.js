import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import StudentLogin from './pages/StudentLogin';
import StudentRegister from './pages/StudentRegister';
import StudentDashboard from './pages/StudentDashboard';
import AskDoubtPage from './pages/AskDoubtPage';
import ChatPage from './pages/ChatPage';
import MaterialsPage from './pages/MaterialsPage';

function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<StudentLogin />} />
            <Route path="/register" element={<StudentRegister />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Navbar />
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/doubts"
              element={
                <PrivateRoute>
                  <AskDoubtPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/doubts/staff"
              element={
                <PrivateRoute>
                  <Navbar />
                  <AskDoubtPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/doubts/ai"
              element={
                <PrivateRoute>
                  <Navbar />
                  <AskDoubtPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Navbar />
                  <ChatPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <PrivateRoute>
                  <Navbar />
                  <MaterialsPage />
                </PrivateRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
