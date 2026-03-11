import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Alerts from './components/Alerts';
import Incidents from './components/Incidents';
import Contacts from './components/Contacts';
import MapDashboard from './components/MapDashboard';
import DisasterReport from './components/DisasterReport';
import Donations from './components/Donations';
import Volunteers from './components/Volunteers';
import SDGGoals from './components/SDGGoals';
import KnowledgeBase from './components/KnowledgeBase';
import Layout from './components/Layout';
import socketService from './services/socket';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/dashboard" /> : 
            <Login onLogin={handleLogin} />
          } 
        />
        <Route
          path="/"
          element={
            isAuthenticated ? 
            <Layout user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="map" element={<MapDashboard />} />
          <Route path="disasters" element={<DisasterReport />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="donations" element={<Donations />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="sdg-goals" element={<SDGGoals />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
