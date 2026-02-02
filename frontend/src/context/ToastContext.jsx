import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/core/Toast';

/**
 * Context for managing application-wide toast notifications.
 * Provides a centralized way to display temporary messages to users.
 */
const ToastContext = createContext(null);

/**
 * Provider component that manages toast notification state and rendering.
 * Wraps the application to make toast functionality available everywhere.
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    /**
     * Displays a new toast notification.
     * Automatically dismisses after 5 seconds.
     * 
     * @param {string} message - Text to display in the notification
     * @param {string} type - Notification type: 'info', 'success', 'warning', or 'error'
     */
    /**
     * Manually dismisses a toast notification.
     * Called automatically after timeout or when user clicks close button.
     * 
     * @param {number} notificationId - Unique ID of the toast to remove
     */
    const dismissNotification = useCallback((notificationId) => {
        setToasts(prev => prev.filter(toast => toast.id !== notificationId));
    }, []);

    /**
     * Displays a new toast notification.
     * Automatically dismisses after 5 seconds.
     * 
     * @param {string} message - Text to display in the notification
     * @param {string} type - Notification type: 'info', 'success', 'warning', or 'error'
     */
    const displayNotification = useCallback((message, type = 'info') => {
        // Generate unique ID using timestamp (simple but effective for this use case)
        const notificationId = Date.now();
        setToasts(prev => [...prev, { id: notificationId, message, type }]);

        // Auto-dismiss after 5 seconds to prevent notification buildup
        setTimeout(() => {
            dismissNotification(notificationId);
        }, 5000);
    }, [dismissNotification]);

    return (
        <ToastContext.Provider value={{ showToast: displayNotification }}>
            {children}
            {/* Toast container - fixed to bottom-right corner */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none'  // Allow clicks to pass through empty space
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{ pointerEvents: 'auto' }}>  {/* Re-enable clicks on actual toasts */}
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => dismissNotification(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

/**
 * Hook to access toast notification functionality.
 * Must be used within a ToastProvider.
 * 
 * @returns {Object} Toast controls
 * @returns {Function} showToast - Function to display a new notification
 * @throws {Error} If used outside of ToastProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
