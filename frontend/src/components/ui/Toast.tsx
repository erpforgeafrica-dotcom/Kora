import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
}

const colorMap = {
  success: '#00e5c8',
  error: '#ef4444',
  warning: '#f59e0b',
};

export default function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '12px 16px',
        background: '#1a1f2e',
        border: `1px solid ${colorMap[type]}`,
        borderRadius: '8px',
        color: colorMap[type],
        fontSize: 12,
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  );
}
