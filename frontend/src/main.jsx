/**
 * Application Entry Point
 * Initializes the React application and mounts it to the DOM.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Create root using React 18's createRoot API (replaces legacy ReactDOM.render)
// This enables concurrent features like automatic batching and transitions
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

// Render app with StrictMode enabled
// StrictMode helps identify potential problems by:
// - Detecting unsafe lifecycles
// - Warning about legacy APIs
// - Detecting unexpected side effects
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);