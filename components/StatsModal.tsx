
import React, { useMemo, useState } from 'react';
import { MuscleData, MuscleId, WorkoutLog, UserStats } from '../types';
import { X, BarChart3, History, Calendar, AlertTriangle, Trophy, Flame, Star, Medal, Image as ImageIcon, Camera, Trash2 } from 'lucide-react';
import { formatDate, getLevelProgress, getNextLevelXp, ACHIEVEMENTS_LIST } from '../utils';

interface StatsModalProps {
  muscles: Record<MuscleId, MuscleData>;
  history: WorkoutLog[];
  userStats: UserStats;
  onClose: () => void;
  onDeleteLog?: (logId: string) => void;
}

const StatsModal: React.FC<StatsModalProps> = ({ muscles, history, userStats, onClose, onDeleteLog }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'chart' | 'gallery' | 'history'>('profile');
  const [galleryFilter, setGalleryFilter] = useState<MuscleId | 'all'>('all');

  // --- Data Prep ---
  const sortedMuscles = useMemo(() => {
    return (Object.values(muscles) as MuscleData[]).sort((a, b) => b.workoutCount - a.workoutCount);
  }, [muscles]);

  const maxCount = sortedMuscles[0]?.workoutCount || 1;

  const reversedHistory = useMemo(() => {
    return [...history].reverse();
  }, [history]);

  // Gallery Photos
  const allPhotos = useMemo(() => {
      const photos: { url: string, date: number, muscleName: string, muscleId: string }[] = [];
      Object.values(muscles).forEach(m => {
          if (m.photos) {
              m.photos.forEach(p => {
                  photos.push({
                      url: p.dataUrl,
                      date: p.timestamp,
                      muscleName: m.name,
                      muscleId: m.id
                  });
              });
          }
      });
      return photos.sort((a, b) => b.date - a.date);
  }, [muscles]);

  const filteredPhotos = galleryFilter === 'all' 
    ? allPhotos 
    : allPhotos.filter(p => p.muscleId === galleryFilter);

  // Daily volume for chart (SVG generation)
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    const last7Days = new Array(7).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    last7Days.forEach(date => map.set(date, 0));

    history.forEach(log => {
        const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
        if (map.has(dateStr)) {
            map.set(dateStr, (map.get(dateStr) || 0) + 1);
        }
    });

    const data = last7Days.map(date => ({
        date: date.slice(5), // MM-DD
        count: map.get(date) || 0
    }));

    // Find max for scaling
    const maxVal = Math.max(...data.map(d => d.count), 5); // Minimum scale of 5
    
    // Generate SVG points
    const width = 300;
    const height = 150;
    const padding = 20;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * chartW;
        const y = height - padding - (d.count / maxVal) * chartH;
        return `${x},${y}`;
    }).join(' ');
    
    const areaPath = `${points} ${width - padding},${height - padding} ${padding},${height - padding}`;

    return { data, points, areaPath, maxVal };
  }, [history]);


  // Gamification Calc
  const progress = getLevelProgress(userStats.xp, userStats.level);
  const nextLevelXp = getNextLevelXp(userStats.level);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/50 flex-none">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            荣誉室
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 border-b border-gray-700/50 bg-gray-800 overflow-x-auto flex-none">
          {[
              { id: 'profile', icon: <Star size={16}/>, label: '个人' },
              { id: 'chart', icon: <BarChart3 size={16}/>, label: '分析' },
              { id: 'gallery', icon: <ImageIcon size={16}/>, label: '相册' },
              { id: 'history', icon: <History size={16}/>, label: '记录' },
          ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[70px] py-2 px-2 rounded-lg text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                activeTab === tab.id ? 'bg-slate-700 text-white shadow' : 'bg-transparent text-gray-500 hover:text-gray-300'
                }`}
            >
                {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-900/30">
          
          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
                {/* Level Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-2xl shadow-xl relative overflow-hidden border border-white/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex justify-between items-end mb-4 relative z-10">
                        <div>
                            <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Current Level</p>
                            <h3 className="text-4xl font-black text-white italic">LV.{userStats.level}</h3>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center gap-1 text-yellow-400 font-bold text-xl justify-end">
                                <Flame size={24} className={userStats.currentStreak > 0 ? "fill-yellow-400 animate-pulse" : "text-gray-500"} />
                                <span>{userStats.currentStreak} 天连胜</span>
                             </div>
                             <p className="text-xs text-gray-400">最佳: {userStats.bestStreak} 天</p>
                        </div>
                    </div>
                    
                    {/* XP Bar */}
                    <div className="relative z-10">
                        <div className="flex justify-between text-xs text-indigo-200 mb-1">
                            <span>EXP</span>
                            <span>{Math.floor(userStats.xp)} / {Math.floor(nextLevelXp)}</span>
                        </div>
                        <div className="h-4 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div 
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000 ease-out"
                                style={{ width: `${progress * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Achievements Grid */}
                <div>
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Medal size={18} className="text-yellow-500"/>
                        成就勋章 ({userStats.unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {ACHIEVEMENTS_LIST.map(ach => {
                            const isUnlocked = userStats.unlockedAchievements.includes(ach.id);
                            return (
                                <div 
                                    key={ach.id} 
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center border transition-all ${
                                        isUnlocked 
                                        ? 'bg-gray-700/50 border-yellow-500/30 text-white' 
                                        : 'bg-gray-800/50 border-gray-700 text-gray-600 grayscale opacity-60'
                                    }`}
                                >
                                    <div className="text-2xl mb-1 filter drop-shadow-md">{ach.icon}</div>
                                    <p className="text-[10px] font-bold leading-tight">{ach.title}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
          )}

          {/* --- CHART TAB --- */}
          {activeTab === 'chart' && (
            <div className="space-y-6">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h4 className="text-sm font-bold text-gray-400 mb-4">近7天训练量趋势</h4>
                    <div className="w-full aspect-[2/1] relative">
                        <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
                            <line x1="20" y1="130" x2="280" y2="130" stroke="#374151" strokeWidth="1" />
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={chartData.areaPath} fill="url(#chartGradient)" />
                            <polyline 
                                points={chartData.points} 
                                fill="none" 
                                stroke="#3b82f6" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-400">部位训练占比</h4>
                    {sortedMuscles.map((m) => {
                        const percentage = Math.max((m.workoutCount / maxCount) * 100, 2);
                        return (
                        <div key={m.id} className="group">
                            <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300 font-medium">{m.name}</span>
                            <span className="text-gray-500">{m.workoutCount}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            />
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
          )}

          {/* --- GALLERY TAB --- */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
                {/* Filter */}
                <select 
                    value={galleryFilter}
                    onChange={(e) => setGalleryFilter(e.target.value as any)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-sm text-white focus:outline-none"
                >
                    <option value="all">所有部位</option>
                    {sortedMuscles.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                    {filteredPhotos.length > 0 ? (
                        filteredPhotos.map((photo, index) => (
                            <div key={index} className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
                                <img src={photo.url} alt="Muscle Check" className="w-full h-32 object-cover" />
                                <div className="p-2">
                                    <p className="text-xs font-bold text-white">{photo.muscleName}</p>
                                    <p className="text-[10px] text-gray-400">{formatDate(photo.date)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 py-10 flex flex-col items-center justify-center text-gray-500 gap-3 border-2 border-dashed border-gray-700 rounded-xl">
                            <Camera size={32} />
                            <p className="text-sm">暂无照片</p>
                            <p className="text-xs">在训练详情中上传照片来记录变化</p>
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {reversedHistory.length > 0 ? (
                reversedHistory.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-800 p-2 rounded-lg text-blue-400">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-200 text-sm">{muscles[log.muscleId].name}</p>
                            {log.isForced && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 rounded flex items-center gap-1">
                                    <AlertTriangle size={10} /> 强练
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500">{formatDate(log.timestamp)}</p>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    {onDeleteLog && (
                        <button 
                            onClick={() => {
                                if(window.confirm('确定要删除这条训练记录吗？相关的经验值和计划状态也将回滚。')) {
                                    onDeleteLog(log.id);
                                }
                            }}
                            className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="撤销训练"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                   <p>暂无记录</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StatsModal;
