import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import BackgroundGrid from './components/ui/BackgroundGrid';

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

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing page with feature overview */}
        <Route path="/" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <HomePage />
          </motion.div>
        } />

        {/* Voice verification/authentication page */}
        <Route path="/verify" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <VerifyPage />
          </motion.div>
        } />

        {/* New user enrollment with voice samples */}
        <Route path="/enroll" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EnrollPage />
          </motion.div>
        } />

        {/* Admin login gateway */}
        <Route path="/admin" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminLoginPage />
          </motion.div>
        } />

        {/* Admin dashboard (requires authentication) */}
        <Route path="/admin/dashboard" element={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ToastProvider>
      <Router>
        {/* Fixed Background (remains static) */}
        <BackgroundGrid />

        <div className="app-container">
          {/* Application routes with transitions */}
          <AnimatedRoutes />

          {/* Persistent footer across all pages */}
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;