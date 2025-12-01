
import React, { useRef, useState } from 'react';
import { MuscleData, RecoverySettings, MuscleId, UserPhoto, WorkoutLog } from '../types';
import { getMuscleStatus, getStatusColor, getStatusText, formatDate, getMuscleTier, compressImage } from '../utils';
import { Dumbbell, X, Trophy, CalendarClock, AlertTriangle, CheckCircle, Camera, Upload, Trash2, Check, RefreshCw, CalendarDays } from 'lucide-react';

interface MuscleModalProps {
  muscle: MuscleData | null;
  latestLog: WorkoutLog | null;
  currentTime: number;
  onClose: () => void;
  onWorkout: (id: string, isForced?: boolean) => void;
  onRetroactiveWorkout: (id: string, dateStr: string) => void;
  onDeleteLog: (logId: string) => void;
  onSavePhoto: (id: MuscleId, photoData: string) => void;
  settings: RecoverySettings;
}

const MuscleModal: React.FC<MuscleModalProps> = ({ muscle, latestLog, currentTime, onClose, onWorkout, onRetroactiveWorkout, onDeleteLog, onSavePhoto, settings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for Photo Preview (Before Upload)
  const [previewData, setPreviewData] = useState<string | null>(null);
  
  // State for Viewing Existing Photo
  const [viewingPhoto, setViewingPhoto] = useState<UserPhoto | null>(null);

  // State for Retroactive Mode
  const [showRetroactive, setShowRetroactive] = useState(false);
  const [retroDate, setRetroDate] = useState<string>('');

  if (!muscle) return null;

  const status = getMuscleStatus(muscle.lastWorkoutTimestamp, currentTime, settings);
  const color = getStatusColor(status, settings.colors);
  const statusText = getStatusText(status);
  const tier = getMuscleTier(muscle.workoutCount);

  // Get the latest photo for this muscle
  const latestPhoto = muscle.photos && muscle.photos.length > 0 
    ? muscle.photos[muscle.photos.length - 1] 
    : null;

  // Messages
  let message = "";
  let subMessage = "";
  let canWorkout = true;

  switch(status) {
    case 'neutral':
      message = "未开始训练";
      subMessage = "该部位尚未有任何训练记录。建议安排一次训练来激活它。";
      break;
    case 'ready':
      message = "状态极佳";
      subMessage = "肌肉已完全恢复，糖原储备充足，是进行高强度训练的最佳时机。";
      break;
    case 'trained':
      message = "刚刚练完";
      subMessage = "肌肉处于充血和疲劳状态，请让它充分休息，不要过度训练。";
      canWorkout = false; 
      break;
    case 'sore':
      message = "恢复中";
      subMessage = "可能会有酸痛感（DOMS），说明肌肉正在修复生长。建议进行轻度活动或休息。";
      canWorkout = true; 
      break;
    case 'stale':
      message = "需要激活";
      subMessage = "距离上次训练已经很久了，肌肉适应性正在下降，建议尽快安排训练。";
      break;
  }

  // Milestone check for Photo Prompt
  const isMilestone = muscle.workoutCount > 0 && muscle.workoutCount % 10 === 0;
  // Only prompt if no photo in the last 24 hours
  const showPhotoPrompt = isMilestone && (!latestPhoto || (latestPhoto.timestamp < Date.now() - 86400000));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessing(true);
      try {
        const compressedData = await compressImage(e.target.files[0]);
        setPreviewData(compressedData); // Set preview instead of saving immediately
      } catch (error) {
        console.error("Photo processing failed", error);
        alert("照片处理失败，请重试");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmUpload = () => {
    if (previewData) {
        onSavePhoto(muscle.id, previewData);
        setPreviewData(null); // Clear preview
    }
  };

  const handleCancelUpload = () => {
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitRetroactive = () => {
      if (retroDate) {
          onRetroactiveWorkout(muscle.id, retroDate);
          setShowRetroactive(false);
      }
  };

  // --- RENDER: VIEW PHOTO MODE ---
  if (viewingPhoto) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-fade-in">
        <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
           <div className="absolute top-2 right-2 z-10">
              <button onClick={() => setViewingPhoto(null)} className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white">
                 <X size={20} />
              </button>
           </div>
           <img src={viewingPhoto.dataUrl} alt="Record" className="w-full h-auto max-h-[70vh] object-contain bg-black" />
           <div className="p-4 bg-slate-800">
              <p className="text-white font-bold">{muscle.name} - 记录照片</p>
              <p className="text-slate-400 text-xs">{formatDate(viewingPhoto.timestamp)}</p>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: PREVIEW UPLOAD MODE ---
  if (previewData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
         <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-white font-bold">预览照片</h3>
                <button onClick={handleCancelUpload} className="text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="p-4 bg-black/20 flex justify-center">
                <img src={previewData} alt="Preview" className="max-h-[50vh] rounded-lg shadow-lg object-contain" />
            </div>

            <div className="p-4 flex gap-3">
                <button 
                    onClick={handleCancelUpload}
                    className="flex-1 py-3 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <RefreshCw size={16} /> 重拍
                </button>
                <button 
                    onClick={handleConfirmUpload}
                    className="flex-[2] py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                    <Check size={18} /> 确认保存
                </button>
            </div>
         </div>
      </div>
    );
  }

  // --- RENDER: DEFAULT MODAL ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-2"
        >
          <X size={24} />
        </button>

        <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
            <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-slate-700"
                style={{ backgroundColor: color }}
            >
                <Dumbbell size={32} className="text-white mix-blend-overlay" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-100">{muscle.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-700 uppercase">
                        {tier.title}
                    </span>
                    <span className="text-sm font-medium" style={{ color: color }}>• {statusText}</span>
                </div>
            </div>
            </div>

            {/* Level Progress */}
            <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>当前等级: Lv.{tier.level}</span>
                    <span>下个称号: {tier.nextThreshold - muscle.workoutCount} 次后</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(100, (muscle.workoutCount / tier.nextThreshold) * 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
                        <Trophy size={10} className="inline mr-1 text-yellow-500" /> 累计练级
                    </span>
                    <span className="text-xl font-sans font-bold text-slate-200">{muscle.workoutCount} 次</span>
                </div>
                
                {/* Last Workout & Delete Button & Photo Preview Box */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 relative overflow-visible group">
                    <div className="flex justify-between items-start mb-1 relative z-10">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                            <CalendarClock size={10} className="inline mr-1 text-blue-400" /> 上次训练
                        </span>
                        
                        {/* Improved Delete Button */}
                        {latestLog && (
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if(window.confirm(`确定要撤销 ${formatDate(latestLog.timestamp)} 的训练记录吗？\n\n撤销后：\n1. 肌肉状态将回滚到上一次\n2. 扣除获得的 XP`)) {
                                        onDeleteLog(latestLog.id);
                                    }
                                }}
                                className="absolute top-2 right-2 p-2 bg-slate-800 border border-slate-600 shadow-sm text-slate-400 hover:text-red-400 hover:border-red-500/50 rounded-lg transition-all z-30 transform hover:scale-110 active:scale-95"
                                title="删除这条记录"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    
                    <span className="text-xs font-sans font-bold text-slate-300 block truncate mt-1">
                        {muscle.lastWorkoutTimestamp ? formatDate(muscle.lastWorkoutTimestamp) : '无记录'}
                    </span>

                    {/* Latest Photo Button Overlay */}
                    {latestPhoto && (
                        <button 
                            onClick={() => setViewingPhoto(latestPhoto)}
                            className="mt-2 w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded px-2 py-1 transition-colors"
                        >
                            <div className="w-6 h-6 rounded overflow-hidden bg-black shrink-0 border border-slate-500">
                                <img src={latestPhoto.dataUrl} alt="Latest" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] text-slate-300">查看照片</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Message Box */}
            <div className="mb-6 bg-slate-900/30 p-4 rounded-xl border-l-4" style={{ borderColor: color }}>
                <h4 className="text-slate-200 font-bold text-sm mb-1">{message}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{subMessage}</p>
            </div>
            
            {/* Hidden File Input */}
             <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleFileChange}
            />

            {/* Photo Action */}
            {showPhotoPrompt ? (
                <div className="mb-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 rounded-xl border border-purple-500/30">
                    <div className="flex items-start gap-3">
                        <Camera className="text-purple-400 shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="text-purple-200 font-bold text-sm">里程碑时刻!</h4>
                            <p className="text-purple-300/80 text-xs mb-3">你已经完成了 {muscle.workoutCount} 次训练。现在是记录肌肉变化的最佳时机。</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-2"
                            >
                                {isProcessing ? '处理中...' : <><Upload size={12} /> 上传照片</>}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full mb-4 py-2 border border-dashed border-slate-600 rounded-xl text-slate-400 text-xs hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
                 >
                    {isProcessing ? '处理中...' : <><Camera size={14} /> 拍摄/上传照片</>}
                 </button>
            )}

            {/* Actions */}
            {showRetroactive ? (
                 <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600 mb-2 animate-fade-in-down">
                     <label className="text-xs text-slate-400 block mb-2">选择补录日期：</label>
                     <div className="flex gap-2">
                        <input 
                            type="date" 
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={retroDate}
                            onChange={(e) => setRetroDate(e.target.value)}
                        />
                        <button 
                            onClick={handleSubmitRetroactive}
                            className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold"
                        >
                            确定
                        </button>
                        <button 
                            onClick={() => setShowRetroactive(false)}
                            className="bg-slate-600 text-white px-3 rounded-lg text-xs font-bold"
                        >
                            取消
                        </button>
                     </div>
                 </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors text-sm"
                        >
                            关闭
                        </button>
                        <button 
                            onClick={() => onWorkout(muscle.id)}
                            disabled={!canWorkout && status === 'trained'} 
                            className={`flex-[2] py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg text-sm ${
                            (!canWorkout && status === 'trained')
                            ? 'bg-slate-700 opacity-50 cursor-not-allowed text-slate-500'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                            }`}
                        >
                            <CheckCircle size={18} />
                            {(!canWorkout && status === 'trained') ? '休息中' : '完成训练'}
                        </button>
                    </div>

                    <div className="flex justify-between items-center px-1">
                        {(!canWorkout && status === 'trained') && (
                            <button 
                                onClick={() => onWorkout(muscle.id, true)}
                                className="flex items-center gap-1 text-[10px] font-medium text-amber-500 hover:text-amber-400 hover:bg-amber-900/10 rounded px-2 py-1 transition-colors"
                            >
                                <AlertTriangle size={10} />
                                强制打卡
                            </button>
                        )}
                        
                        <button 
                            onClick={() => setShowRetroactive(true)}
                            className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-blue-400 hover:bg-blue-900/10 rounded px-2 py-1 transition-colors ml-auto"
                        >
                            <CalendarDays size={10} />
                            忘记记录？补打卡
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MuscleModal;
