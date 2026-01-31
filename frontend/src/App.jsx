import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';
import EnrollPage from './pages/EnrollPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import './styles/global.css';
import './styles/animations.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';

import Footer from './components/ui/Footer';
import BackgroundEffect from './components/ui/BackgroundEffect';

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="app-container">
          <BackgroundEffect />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/enroll" element={<EnrollPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;