
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Reveal immediately (next frame to allow transition)
    const enterTimer = requestAnimationFrame(() => setIsVisible(true));

    // 2. Start fade out after 1.5 seconds (Read time)
    const leaveTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    // 3. Unmount after animation completes (1 second fade duration)
    const closeTimer = setTimeout(() => {
      onClose();
    }, 2500);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

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
    <div 
        className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center w-full max-w-xs px-4 pointer-events-none transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div 
        className={`
          pointer-events-auto
          relative flex items-center gap-3 px-4 py-3
          rounded-2xl
          backdrop-blur-md shadow-2xl
          border ${currentStyle.border}
          ${currentStyle.bg}
          cursor-pointer
          transform transition-transform active:scale-95
        `}
        onClick={() => {
            setIsVisible(false);
            // Close faster on manual click
            setTimeout(onClose, 300);
        }}
      >
        <div className="shrink-0">
          {currentStyle.icon}
        </div>
        
        <div className="flex-1">
          <p className={`text-sm font-bold ${currentStyle.text}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Toast;
