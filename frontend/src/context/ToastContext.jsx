import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (content, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    let message = content;
    let toastType = type;

    if (typeof content === 'object' && content !== null) {
      message = content.message || content.title || JSON.stringify(content);
      toastType = content.type === 'danger' ? 'error' : (content.type || type);
      if (content.duration) duration = content.duration;
    } else if (type === 'danger') {
      toastType = 'error';
    }

    setToasts((prev) => [...prev, { id, message: String(message), type: toastType }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
