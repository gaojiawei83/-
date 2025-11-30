
import React from 'react';
import { RecoverySettings } from '../types';
import { X, Clock, AlertCircle, Palette, Info } from 'lucide-react';
import { formatDuration } from '../utils';

interface SettingsModalProps {
  settings: RecoverySettings;
  onSave: (newSettings: RecoverySettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = React.useState<RecoverySettings>(settings);

  const handleDurationChange = (key: keyof RecoverySettings, value: string) => {
    const numValue = Math.max(0, Number(value));
    setLocalSettings(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const handleColorChange = (key: keyof RecoverySettings['colors'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-purple-400" />
            系统设置 & 状态说明
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Legend Section (Fixes Inconsistency) */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Info size={14} /> 状态图例
             </h3>
             <div className="grid grid-cols-2 gap-2">
                 {[
                    { key: 'trained', label: '刚刚练完', desc: '需要休息' },
                    { key: 'sore', label: '修复酸痛', desc: '正在生长' },
                    { key: 'ready', label: '完全恢复', desc: '最佳状态' },
                    { key: 'stale', label: '消退期', desc: '需要激活' },
                    { key: 'neutral', label: '未激活', desc: '无记录' },
                 ].map(({ key, label, desc }) => (
                     <div key={key} className="bg-gray-700/30 p-2 rounded border border-gray-700/50 flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded shadow-sm shrink-0" 
                          style={{ backgroundColor: localSettings.colors[key as keyof RecoverySettings['colors']] }}
                        ></div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-300">{label}</span>
                            <span className="text-[10px] text-gray-500">{desc}</span>
                        </div>
                     </div>
                 ))}
             </div>
          </div>

          <div className="w-full h-px bg-gray-700/50"></div>

          {/* Time Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Clock size={14} /> 恢复周期调整 (小时)
            </h3>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 bg-gray-900/30 p-2 rounded">
                <span>充血持续时间</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={localSettings.yellowDuration}
                        onChange={(e) => handleDurationChange('yellowDuration', e.target.value)}
                        className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-right text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <span className="text-[10px] text-gray-500 w-10">小时</span>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 bg-gray-900/30 p-2 rounded">
                <span>酸痛持续时间</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={localSettings.redDuration}
                        onChange={(e) => handleDurationChange('redDuration', e.target.value)}
                        className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-right text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <span className="text-[10px] text-gray-500 w-10">小时</span>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-gray-300 bg-gray-900/30 p-2 rounded">
                <span>最佳状态窗口</span>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={localSettings.greenDuration}
                        onChange={(e) => handleDurationChange('greenDuration', e.target.value)}
                        className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-right text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <span className="text-[10px] text-gray-500 w-10">小时</span>
                </div>
              </label>
            </div>
          </div>
          
          <div className="w-full h-px bg-gray-700/50"></div>

          {/* Color Settings (Collapsed or Simplified) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Palette size={14} /> 自定义颜色
            </h3>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(localSettings.colors).map((key) => (
                <div key={key} className="relative group">
                    <input 
                      type="color"
                      value={localSettings.colors[key as keyof RecoverySettings['colors']]}
                      onChange={(e) => handleColorChange(key as keyof RecoverySettings['colors'], e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-none overflow-hidden"
                      title={key}
                    />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900/50 shrink-0">
          <button 
            onClick={handleSave}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-colors"
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
