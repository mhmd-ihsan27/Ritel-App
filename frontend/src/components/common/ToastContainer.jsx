import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();
        const newToast = { id, message, type, duration };

        setToasts((prevToasts) => [...prevToasts, newToast]);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((message, duration) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const showWarning = useCallback((message, duration) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    const showInfo = useCallback((message, duration) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    // Fungsi showToast untuk kompatibilitas dengan kode yang ada
    const showToast = useCallback((type, message, duration = 3000) => {
        return addToast(message, type, duration);
    }, [addToast]);

    return (
        <ToastContext.Provider
            value={{
                addToast,
                removeToast,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                showToast
            }}
        >
            {children}
            <div className="fixed top-4 right-4 z-50">
                {toasts.map((toast, index) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                        index={index}
                        totalToasts={toasts.length}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
