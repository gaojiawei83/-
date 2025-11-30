import React, { useEffect } from 'react';
import { Trophy, Star, X } from 'lucide-react';

interface AchievementToastProps {
  title: string;
  description: string;
  type: 'levelup' | 'achievement';
  icon?: React.ReactNode;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ title, description, type, icon, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isLevelUp = type === 'levelup';

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-bounce-in">
      <div className={`
        relative p-6 rounded-2xl shadow-2xl border-2 flex flex-col items-center text-center min-w-[300px]
        ${isLevelUp 
          ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 border-yellow-400' 
          : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-yellow-500/50'
        }
      `}>
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-yellow-500/10 blur-xl rounded-2xl -z-10"></div>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Icon Header */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg text-3xl
          ${isLevelUp ? 'bg-yellow-400 text-purple-900' : 'bg-gray-800 border border-yellow-500/30'}
        `}>
          {icon || (isLevelUp ? <Star size={32} /> : <Trophy size={32} />)}
        </div>

        {/* Text */}
        <h3 className={`text-2xl font-black italic tracking-wider mb-2 ${isLevelUp ? 'text-yellow-400' : 'text-white'}`}>
          {title}
        </h3>
        <p className="text-gray-300 font-medium">
          {description}
        </p>
        
        {/* Footer decoration */}
        <div className="mt-4 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-150"></div>
        </div>

      </div>
    </div>
  );
};

export default AchievementToast;
