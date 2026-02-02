import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VerifyPage from './pages/VerifyPage';
import EnrollPage from './pages/EnrollPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Global styles
import './styles/global.css';
import './styles/animations.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';

// UI components
import Footer from './components/ui/Footer';
import BackgroundEffect from './components/ui/BackgroundEffect';

// Context providers
import { ToastProvider } from './context/ToastContext';

/**
 * Main Application Component
 * Sets up routing, global providers, and persistent UI elements.
 * 
 * Provider hierarchy:
 * - ToastProvider: Enables toast notifications throughout the app
 * - Router: Handles client-side routing
 */
function App() {
  return (
    <ToastProvider>
      <Router>
        {/* Fixed Background (remains static) */}
        <BackgroundEffect />

        <div className="app-container">
          {/* Application routes */}
          <Routes>
            {/* Landing page with feature overview */}
            <Route path="/" element={<HomePage />} />

            {/* Voice verification/authentication page */}
            <Route path="/verify" element={<VerifyPage />} />

            {/* New user enrollment with voice samples */}
            <Route path="/enroll" element={<EnrollPage />} />

            {/* Admin login gateway */}
            <Route path="/admin" element={<AdminLoginPage />} />

            {/* Admin dashboard (requires authentication) */}
            <Route path="/admin/dashboard" element={<AdminPage />} />
          </Routes>

          {/* Persistent footer across all pages */}
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;