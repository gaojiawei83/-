import React, { useEffect } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  
  // Set to 1000ms (1 second) as requested
  const duration = 1000;

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: {
      bg: "bg-emerald-800/90",
      border: "border-emerald-500",
      icon: <CheckCircle2 className="text-emerald-300" size={20} />,
      text: "text-emerald-50"
    },
    info: {
      bg: "bg-blue-800/90",
      border: "border-blue-500",
      icon: <Info className="text-blue-300" size={20} />,
      text: "text-blue-50"
    },
    warning: {
      bg: "bg-amber-800/90",
      border: "border-amber-500",
      icon: <AlertTriangle className="text-amber-300" size={20} />,
      text: "text-amber-50"
    },
    error: {
      bg: "bg-red-800/90",
      border: "border-red-500",
      icon: <XCircle className="text-red-300" size={20} />,
      text: "text-red-50"
    }
  };

  const currentStyle = styles[type];

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-fade-in-down w-full max-w-xs px-4 pointer-events-none">
      <div 
        className={`
          pointer-events-auto
          relative flex items-center gap-3 px-4 py-2
          rounded-full
          backdrop-blur-md shadow-xl
          border ${currentStyle.border}
          ${currentStyle.bg}
          transition-all transform cursor-pointer
        `}
        onClick={onClose}
      >
        <div className="shrink-0">
          {currentStyle.icon}
        </div>
        
        <div className="flex-1">
          <p className={`text-sm font-medium ${currentStyle.text}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Toast;