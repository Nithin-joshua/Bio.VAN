import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
// Context providers
import { ToastProvider } from './context/ToastContext'; // Provides global toast notifications

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return null;
};

/**
 * Main Application Component
 * Sets up routing, global providers, and persistent UI elements.
 * 
 * Provider hierarchy:
 * - ToastProvider: Enables toast notifications throughout the app
 * - Router: Handles client-side routing
 */

// Animated Routes Component
// Handles route transitions using Framer Motion
const AnimatedRoutes = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const easePremium = [0.16, 1, 0.3, 1]; // cubic-bezier(0.16, 1, 0.3, 1)
  const routeMotionProps = shouldReduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.28, ease: easePremium },
      };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div className="app-route-shell" {...routeMotionProps}>
            <HomePage />
          </motion.div>
        } />

        <Route path="/verify" element={
          <motion.div className="app-route-shell" {...routeMotionProps}>
            <VerifyPage />
          </motion.div>
        } />

        <Route path="/enroll" element={
          <motion.div className="app-route-shell" {...routeMotionProps}>
            <EnrollPage />
          </motion.div>
        } />

        <Route path="/admin" element={
          <motion.div className="app-route-shell" {...routeMotionProps}>
            <AdminLoginPage />
          </motion.div>
        } />

        <Route path="/admin/dashboard" element={
          <motion.div className="app-route-shell" {...routeMotionProps}>
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
        <ScrollToTop />
        {/* Fixed Background (remains static across all pages for consistency) */}
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
