
import React, { useState, useEffect } from 'react';
import { MuscleId, MuscleData, AppState, ViewSide, WorkoutLog, RecoverySettings, WorkoutPlan, UserStats, Achievement, UserPhoto } from './types';
import BodyMap from './components/BodyMap';
import MuscleModal from './components/MuscleModal';
import StatsModal from './components/StatsModal';
import SettingsModal from './components/SettingsModal';
import CalendarModal from './components/CalendarModal';
import PlanListModal from './components/PlanListModal';
import Toast, { ToastType } from './components/Toast';
import AchievementToast from './components/AchievementToast';
import { Users, ArrowLeftRight, Settings, Clock, Zap, Undo2, CalendarDays, Trophy, Activity, Flame, ChevronRight, BarChart, ClipboardList } from 'lucide-react';
import { formatFullDate, calculateLevel, checkAchievements, getMuscleScale, getLevelProgress, getNextLevelXp, calculateXpGain, getMuscleTier, XP_PLAN_CREATE, XP_PLAN_COMPLETE, XP_PLAN_MISS } from './utils';
import confetti from 'canvas-confetti';

// Initial data structure
const INITIAL_MUSCLES: Record<MuscleId, MuscleData> = {
  chest: { id: 'chest', name: '胸肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  abs: { id: 'abs', name: '腹肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  biceps: { id: 'biceps', name: '二头肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  quads: { id: 'quads', name: '股四头肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  'front-delt': { id: 'front-delt', name: '前束三角肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  traps: { id: 'traps', name: '斜方肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  lats: { id: 'lats', name: '背阔肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  triceps: { id: 'triceps', name: '三头肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  hamstrings: { id: 'hamstrings', name: '腘绳肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  'rear-delt': { id: 'rear-delt', name: '后束三角肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  glutes: { id: 'glutes', name: '臀大肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
  calves: { id: 'calves', name: '小腿肌', workoutCount: 0, lastWorkoutTimestamp: null, muscleGrowth: 1, photos: [] },
};

const INITIAL_SETTINGS: RecoverySettings = {
  yellowDuration: 24, 
  redDuration: 24,    
  greenDuration: 72,  
  colors: {
    trained: '#facc15', 
    sore: '#ef4444',    
    ready: '#10b981',   
    stale: '#94a3b8',   
    neutral: '#475569'  
  }
};

const INITIAL_USER_STATS: UserStats = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveTimestamp: 0,
  unlockedAchievements: []
};

export default function App() {
  // State
  const [muscles, setMuscles] = useState<Record<MuscleId, MuscleData>>(INITIAL_MUSCLES);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [settings, setSettings] = useState<RecoverySettings>(INITIAL_SETTINGS);
  const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER_STATS);
  const [view, setView] = useState<ViewSide>('front');
  
  // Modals
  const [selectedMuscleId, setSelectedMuscleId] = useState<MuscleId | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPlanReport, setShowPlanReport] = useState(false);
  
  // Notifications
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);
  const [achievementToast, setAchievementToast] = useState<{title: string, description: string, type: 'levelup' | 'achievement', icon?: React.ReactNode} | null>(null);
  
  // Animation
  const [animatingMuscleId, setAnimatingMuscleId] = useState<MuscleId | 'all' | null>(null);
  
  // Time simulation state
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [offsetTime, setOffsetTime] = useState<number>(0);
  const [lastPlanCheckDate, setLastPlanCheckDate] = useState<string>('');
  const [lastPunishmentCheckDate, setLastPunishmentCheckDate] = useState<string>('');
  const [streakDanger, setStreakDanger] = useState(false);

  // Helper to show toast
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('muscleTracker_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.muscles) {
           // Migration logic
           const loadedMuscles = parsed.muscles;
           Object.keys(loadedMuscles).forEach(key => {
             const mKey = key as MuscleId;
             if (typeof loadedMuscles[mKey].muscleGrowth === 'undefined') {
                loadedMuscles[mKey].muscleGrowth = getMuscleScale(loadedMuscles[mKey].workoutCount || 0);
             }
             if (!loadedMuscles[mKey].photos) {
                loadedMuscles[mKey].photos = [];
             }
           });
           setMuscles(prev => ({ ...prev, ...loadedMuscles }));
        }
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
        if (Array.isArray(parsed.plans)) setPlans(parsed.plans);
        if (parsed.settings) {
            setSettings(prev => ({ ...prev, ...parsed.settings, colors: { ...prev.colors, ...(parsed.settings.colors || {}) } }));
        }
        if (parsed.userStats) setUserStats(parsed.userStats);
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    const stateToSave = { muscles, history, plans, settings, userStats };
    localStorage.setItem('muscleTracker_v1', JSON.stringify(stateToSave));
  }, [muscles, history, plans, settings, userStats]);

  // Handle Real-time updates & Checks
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now() + offsetTime;
      setCurrentTime(now);

      const dateStr = new Date(now).toDateString(); // For basic comparison
      const todayYMD = new Date(now).toISOString().split('T')[0];
      
      // 1. Daily Plan Reminder
      if (dateStr !== lastPlanCheckDate) {
        setLastPlanCheckDate(dateStr);
        const todaysPlans = plans.filter(p => p.dateStr === todayYMD && !p.completed);
        if (todaysPlans.length > 0) {
           showToast(`📅 提醒：今日有 ${todaysPlans.length} 个训练计划`, 'info');
        }
      }

      // 2. CHECK FOR MISSED PLANS (Penalty System)
      // Check if any plan is from the past (date < today), not completed, and not yet processed
      const missedPlans = plans.filter(p => p.dateStr < todayYMD && !p.completed && !p.processed);
      if (missedPlans.length > 0) {
        let totalPenalty = 0;
        const updatedPlans = plans.map(p => {
          if (p.dateStr < todayYMD && !p.completed && !p.processed) {
            totalPenalty += XP_PLAN_MISS;
            return { ...p, processed: true };
          }
          return p;
        });
        setPlans(updatedPlans);
        
        // Deduct XP
        setUserStats(prev => ({
          ...prev,
          xp: Math.max(0, prev.xp - totalPenalty)
        }));
        
        showToast(`❌ ${missedPlans.length} 个计划未完成，扣除 ${totalPenalty} XP`, 'error');
      }

      // 3. Punishment Check (Streak Reset & Danger Warning)
      if (userStats.lastActiveTimestamp > 0) {
        const hoursSinceActive = (now - userStats.lastActiveTimestamp) / (1000 * 60 * 60);
        
        // Warning Zone: 36 to 48 hours
        if (hoursSinceActive > 36 && hoursSinceActive < 48) {
            if (!streakDanger) setStreakDanger(true);
        } else {
            if (streakDanger) setStreakDanger(false);
        }

        // Reset Zone: > 48 hours
        if (hoursSinceActive > 48 && userStats.currentStreak > 0) {
             if (dateStr !== lastPunishmentCheckDate) {
                 setLastPunishmentCheckDate(dateStr);
                 setUserStats(prev => ({ ...prev, currentStreak: 0 }));
                 showToast("连续记录中断：超过48小时未训练", 'error');
             }
        }
      }

    }, 1000); 
    return () => clearInterval(interval);
  }, [offsetTime, plans, lastPlanCheckDate, lastPunishmentCheckDate, userStats.lastActiveTimestamp, userStats.currentStreak, streakDanger]);

  // Helper: Gamification Logic
  const processGamification = (newLog: WorkoutLog, currentMuscles: Record<MuscleId, MuscleData>, specificDateTimestamp?: number) => {
    let newStats = { ...userStats };
    const now = specificDateTimestamp || newLog.timestamp;

    // 1. Streak Logic (Only update streak if it's a recent workout, i.e., not a very old retroactive one)
    // If it's a retroactive log for "yesterday" or "today", it might save a streak or extend it.
    const lastActiveDate = new Date(newStats.lastActiveTimestamp).toDateString();
    const currentLogDate = new Date(now).toDateString();
    
    // Only update streak logic if the log is effectively "new" or "latest"
    if (now >= newStats.lastActiveTimestamp) {
        if (lastActiveDate !== currentLogDate) {
            const msPerDay = 24 * 60 * 60 * 1000;
            // Check if it is consecutive to the *stored* last active timestamp
            const diffMs = now - newStats.lastActiveTimestamp;
            const isConsecutive = diffMs < (msPerDay * 2);
            
            if (newStats.lastActiveTimestamp === 0 || isConsecutive) {
                newStats.currentStreak += 1;
                if (newStats.currentStreak > newStats.bestStreak) {
                    newStats.bestStreak = newStats.currentStreak;
                }
            } else {
                // Only reset if we are logging a "current" workout and the streak was broken
                if (!specificDateTimestamp) {
                    newStats.currentStreak = 1; 
                    showToast("新的一天，重新开始计数。", 'info');
                }
            }
            newStats.lastActiveTimestamp = now;
        } else {
            newStats.lastActiveTimestamp = now; 
        }
    }

    // 2. XP Calculation
    let xpGain = calculateXpGain(!!newLog.isForced, newStats.currentStreak);
    
    // Check for PLAN COMPLETION BONUS on the Specific Date
    const logYMD = new Date(now).toISOString().split('T')[0];
    const matchingPlanIndex = plans.findIndex(p => 
        p.dateStr === logYMD && 
        p.muscleId === newLog.muscleId && 
        !p.completed
    );

    if (matchingPlanIndex !== -1) {
        // Mark plan as completed
        const updatedPlans = [...plans];
        updatedPlans[matchingPlanIndex] = { 
            ...updatedPlans[matchingPlanIndex], 
            completed: true, 
            processed: true // No penalty for this one
        };
        setPlans(updatedPlans);
        xpGain += XP_PLAN_COMPLETE; // Bonus
    }

    newStats.xp += xpGain;

    // 3. Level Up Check
    const newLevel = calculateLevel(newStats.xp);
    if (newLevel > newStats.level) {
        newStats.level = newLevel;
        triggerLevelUp(newLevel);
    }

    // 4. Achievement Check
    const newAchievements = checkAchievements(newStats, currentMuscles, [...history, newLog], newLog);
    if (newAchievements.length > 0) {
        newAchievements.forEach(ach => {
            newStats.unlockedAchievements.push(ach.id);
            newStats.xp += ach.xpReward; 
            triggerAchievement(ach);
        });
    }

    setUserStats(newStats);
    
    // Return XP gain for toast display and log saving
    return xpGain;
  };

  const triggerLevelUp = (level: number) => {
    confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6']
    });
    setAchievementToast({
        title: "等级提升!",
        description: `健身等级提升至 Lv.${level}`,
        type: 'levelup'
    });
  };

  const triggerAchievement = (ach: Achievement) => {
    setAchievementToast({
        title: "解锁成就!",
        description: ach.title,
        type: 'achievement',
        icon: ach.icon
    });
  };

  // Handlers
  const handleMuscleClick = (id: MuscleId) => {
    setSelectedMuscleId(id);
  };

  const handleWorkout = (id: string, isForced: boolean = false) => {
    const muscleId = id as MuscleId;
    const now = currentTime; 
    
    const newCount = muscles[muscleId].workoutCount + 1;
    const newGrowth = getMuscleScale(newCount);

    const updatedMuscles = {
        ...muscles,
        [muscleId]: {
            ...muscles[muscleId],
            workoutCount: newCount,
            lastWorkoutTimestamp: now, // Always update to now
            muscleGrowth: newGrowth
        }
    };
    setMuscles(updatedMuscles);

    const tempLog: WorkoutLog = {
        id: Date.now().toString() + Math.random().toString().slice(2),
        muscleId,
        timestamp: now,
        isForced
    };
    
    const earnedXp = processGamification(tempLog, updatedMuscles);

    // Save actual log with XP
    const newLog = { ...tempLog, xpGained: earnedXp };
    setHistory(prev => [...prev, newLog]);

    setAnimatingMuscleId(muscleId);
    setTimeout(() => setAnimatingMuscleId(null), 700);
    // Don't close modal immediately so user can see feedback or do other things
    // setSelectedMuscleId(null); 
    
    if (isForced) {
        showToast(`⚠️ 强制训练已记录 (+${earnedXp} XP)`, 'warning');
    } else {
        showToast(`💪 训练完成! (+${earnedXp} XP)`, 'success');
    }
  };

  // RETROACTIVE WORKOUT (补打卡)
  const handleRetroactiveWorkout = (id: string, dateStr: string) => {
      const muscleId = id as MuscleId;
      // Set time to noon of that day to be safe, or current time on that day
      const targetDate = new Date(dateStr);
      targetDate.setHours(12, 0, 0, 0);
      const timestamp = targetDate.getTime();

      const newCount = muscles[muscleId].workoutCount + 1;
      const newGrowth = getMuscleScale(newCount);
      
      // Only update lastWorkoutTimestamp if this retroactive date is newer than what we have
      const currentLast = muscles[muscleId].lastWorkoutTimestamp;
      const newLast = (currentLast === null || timestamp > currentLast) ? timestamp : currentLast;

      const updatedMuscles = {
        ...muscles,
        [muscleId]: {
            ...muscles[muscleId],
            workoutCount: newCount,
            lastWorkoutTimestamp: newLast,
            muscleGrowth: newGrowth
        }
      };
      setMuscles(updatedMuscles);

      const tempLog: WorkoutLog = {
        id: Date.now().toString() + Math.random().toString().slice(2),
        muscleId,
        timestamp: timestamp,
        isForced: false
      };

      const earnedXp = processGamification(tempLog, updatedMuscles, timestamp);
      
      const newLog = { ...tempLog, xpGained: earnedXp };
      // Sort history to keep chronological order usually, but simpler to just append and sort when viewing
      setHistory(prev => [...prev, newLog].sort((a,b) => a.timestamp - b.timestamp));

      showToast(`📅 补录成功! (+${earnedXp} XP)`, 'success');
  };

  // UNDO / DELETE LOG FUNCTION
  const handleDeleteLog = (logId: string) => {
    const logToDelete = history.find(l => l.id === logId);
    if (!logToDelete) return;

    // 1. Revert History Array
    const newHistory = history.filter(l => l.id !== logId);
    setHistory(newHistory);

    // 2. Revert Muscle Data (Count and Last Timestamp)
    const muscleId = logToDelete.muscleId;
    const remainingLogs = newHistory.filter(l => l.muscleId === muscleId).sort((a, b) => a.timestamp - b.timestamp);
    const newLastTimestamp = remainingLogs.length > 0 ? remainingLogs[remainingLogs.length - 1].timestamp : null;
    const newCount = Math.max(0, muscles[muscleId].workoutCount - 1);
    
    setMuscles(prev => ({
        ...prev,
        [muscleId]: {
            ...prev[muscleId],
            workoutCount: newCount,
            lastWorkoutTimestamp: newLastTimestamp,
            muscleGrowth: getMuscleScale(newCount)
        }
    }));

    // 3. Revert XP
    const xpToDeduct = logToDelete.xpGained || 20; // Default to base 20 if undefined
    setUserStats(prev => ({
        ...prev,
        xp: Math.max(0, prev.xp - xpToDeduct)
        // Note: We don't revert streak/level perfectly here to avoid complexity
    }));

    // 4. Revert Plan Status (if applicable)
    // Check if there was a plan for this day that is marked complete
    const logDateStr = new Date(logToDelete.timestamp).toISOString().split('T')[0];
    setPlans(prev => prev.map(p => {
        if (p.muscleId === muscleId && p.dateStr === logDateStr && p.completed) {
            // Revert plan to incomplete
            return { ...p, completed: false, processed: false };
        }
        return p;
    }));

    showToast(`🗑️ 记录已删除 (-${xpToDeduct} XP)`, 'info');
  };

  const handleSavePhoto = (muscleId: MuscleId, photoData: string) => {
      const newPhoto: UserPhoto = {
          id: Date.now().toString(),
          muscleId,
          timestamp: currentTime,
          dataUrl: photoData
      };
      
      const updatedMuscles = {
          ...muscles,
          [muscleId]: {
              ...muscles[muscleId],
              photos: [...(muscles[muscleId].photos || []), newPhoto]
          }
      };
      setMuscles(updatedMuscles);
      showToast('照片已保存到相册', 'success');
      
      // Trigger achievement check again for photo
      const newAchievements = checkAchievements(userStats, updatedMuscles, history, history[history.length-1]);
      if (newAchievements.length > 0) {
        const newStats = { ...userStats };
        newAchievements.forEach(ach => {
             if (!newStats.unlockedAchievements.includes(ach.id)) {
                newStats.unlockedAchievements.push(ach.id);
                newStats.xp += ach.xpReward; 
                triggerAchievement(ach);
             }
        });
        setUserStats(newStats);
      }
  };

  const handleFullWorkout = () => {
    const now = currentTime;
    const muscleIds = Object.keys(muscles) as MuscleId[];
    const updatedMuscles = { ...muscles };
    const newLogs: WorkoutLog[] = [];
    
    // Note: Simple loop here, doesn't check plans individually for the bonus logic in `processGamification` helper
    // To properly support full workout plan bonuses, we'd need to refactor logic. 
    // For now, we apply basic logic for full workout.
    
    muscleIds.forEach(id => {
      const newCount = updatedMuscles[id].workoutCount + 1;
      const newGrowth = getMuscleScale(newCount);
      
      updatedMuscles[id] = {
        ...updatedMuscles[id],
        workoutCount: newCount,
        lastWorkoutTimestamp: now,
        muscleGrowth: newGrowth
      };
      const log = {
        id: Date.now().toString() + Math.random().toString().slice(2) + id,
        muscleId: id,
        timestamp: now,
        isForced: false,
        xpGained: 20 // Approx for full workout split
      };
      newLogs.push(log);
    });

    setMuscles(updatedMuscles);
    setHistory(prev => [...prev, ...newLogs]);

    // We'll just take the last log to trigger gamification, but manual loop to check plans for all
    // Check for plans for ALL muscles
    const todayYMD = new Date(now).toISOString().split('T')[0];
    let totalPlanBonus = 0;
    const updatedPlans = [...plans];
    
    muscleIds.forEach(mid => {
        const idx = updatedPlans.findIndex(p => p.dateStr === todayYMD && p.muscleId === mid && !p.completed);
        if (idx !== -1) {
            updatedPlans[idx] = { ...updatedPlans[idx], completed: true, processed: true };
            totalPlanBonus += XP_PLAN_COMPLETE;
        }
    });
    setPlans(updatedPlans);

    const xpGain = calculateXpGain(false, userStats.currentStreak) + totalPlanBonus;
    
    setUserStats(prev => ({
        ...prev,
        xp: prev.xp + xpGain,
        lastActiveTimestamp: now
    }));

    setAnimatingMuscleId('all');
    showToast(`⚡ 全身打卡完成! (+${xpGain} XP)`, 'success');
    setTimeout(() => setAnimatingMuscleId(null), 700);
  };

  const handleAddPlan = (dateStr: string, muscleIds: MuscleId[]) => {
    const newPlans = muscleIds.map(mid => ({
      id: Date.now().toString() + Math.random().toString().slice(2) + mid,
      dateStr,
      muscleId: mid,
      completed: false
    }));
    setPlans(prev => [...prev, ...newPlans]);
    
    // Reward XP for Planning
    const xpReward = newPlans.length * XP_PLAN_CREATE;
    setUserStats(prev => ({ ...prev, xp: prev.xp + xpReward }));

    showToast(`添加了 ${newPlans.length} 个计划 (+${xpReward} XP)`, 'success');
  };

  const handleDeletePlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
    showToast("计划已删除", 'info');
  };

  const toggleView = () => setView(prev => prev === 'front' ? 'back' : 'front');

  const getEffectiveTime = () => Date.now() + offsetTime;

  // Get Latest Log for Selected Muscle (For Deletion)
  const getLatestLogForSelected = () => {
      if (!selectedMuscleId) return null;
      const logs = history.filter(l => l.muscleId === selectedMuscleId);
      return logs.length > 0 ? logs[logs.length - 1] : null;
  };

  return (
    <div className="h-screen w-full font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col bg-[#0f172a] text-slate-200">
      
      {/* Notifications */}
      {toast && (
        <Toast 
            key={Date.now()} 
            message={toast.message} 
            type={toast.type}
            onClose={() => setToast(null)} 
        />
      )}
      
      {achievementToast && (
        <AchievementToast 
            title={achievementToast.title}
            description={achievementToast.description}
            type={achievementToast.type}
            icon={achievementToast.icon}
            onClose={() => setAchievementToast(null)}
        />
      )}

      {/* 1. COMPACT HEADER BAR */}
      <header className="flex-none bg-slate-900 border-b border-slate-800 p-2 z-30 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            
            {/* Left: Level Badge & Streak */}
            <div className="flex items-center gap-3" onClick={() => setShowStats(true)}>
                 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex flex-col items-center justify-center shadow border border-slate-600 cursor-pointer">
                    <span className="text-[8px] font-bold text-yellow-100 leading-none">LV</span>
                    <span className="text-xl font-black text-white leading-none">{userStats.level}</span>
                 </div>
                 <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-20 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${getLevelProgress(userStats.xp, userStats.level) * 100}%` }} />
                         </div>
                         <span className="text-[10px] text-slate-400 font-mono">{Math.floor(userStats.xp)} XP</span>
                    </div>
                    {userStats.currentStreak > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                             <Flame size={10} className={streakDanger ? "fill-red-500 text-red-500 animate-pulse" : "fill-orange-500 text-orange-500"} />
                             <span className={`text-[10px] font-bold ${streakDanger ? 'text-red-400' : 'text-orange-400'}`}>
                                {userStats.currentStreak} 天连胜
                             </span>
                        </div>
                    )}
                 </div>
            </div>

            {/* Right: Date & Settings */}
            <div className="flex items-center gap-2">
                 <div className="hidden sm:flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs text-slate-400 border border-slate-700">
                    <Clock size={12} />
                    {formatFullDate(currentTime).split(' ')[0]}
                 </div>
                 <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-700">
                    <Settings size={18} />
                 </button>
            </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-2">
        
        {/* Toggle View Button */}
        <div className="absolute top-4 z-10">
            <button 
                onClick={toggleView}
                className="flex items-center gap-2 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all shadow-lg"
            >
                <ArrowLeftRight size={14} />
                {view === 'front' ? '正面' : '背面'}
            </button>
        </div>

        {/* The Body Map */}
        <div className="w-full max-w-sm aspect-[2/3] animate-fade-in relative">
           <BodyMap 
              view={view}
              muscles={muscles}
              onMuscleClick={handleMuscleClick}
              currentTime={getEffectiveTime()}
              animatingMuscleId={animatingMuscleId}
              settings={settings}
           />
        </div>

      </main>

      {/* 3. BOTTOM CONTROL BAR */}
      <div className="flex-none bg-slate-900 border-t border-slate-800 p-4 z-30 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-2">
            
            <button 
              onClick={() => setShowStats(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <BarChart size={20} />
              <span className="text-[10px] font-bold">统计</span>
            </button>

            <button 
              onClick={() => setShowCalendar(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <CalendarDays size={20} />
              <span className="text-[10px] font-bold">日历</span>
            </button>

             <button 
              onClick={() => setShowPlanReport(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors relative"
            >
              <ClipboardList size={20} />
              <span className="text-[10px] font-bold">任务</span>
              {plans.some(p => p.dateStr === new Date(currentTime).toISOString().split('T')[0] && !p.completed) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            <button 
              onClick={handleFullWorkout}
              className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Zap size={20} className="fill-white" />
              全身打卡
            </button>

        </div>
      </div>

      {/* Modals */}
      {selectedMuscleId && (
        <MuscleModal 
          muscle={muscles[selectedMuscleId]}
          latestLog={getLatestLogForSelected()}
          currentTime={getEffectiveTime()}
          onClose={() => setSelectedMuscleId(null)}
          onWorkout={handleWorkout}
          onRetroactiveWorkout={handleRetroactiveWorkout}
          onDeleteLog={handleDeleteLog}
          onSavePhoto={handleSavePhoto}
          settings={settings}
        />
      )}

      {showStats && (
        <StatsModal 
            muscles={muscles}
            history={history}
            userStats={userStats}
            onClose={() => setShowStats(false)}
            onDeleteLog={handleDeleteLog}
        />
      )}
      
      {showCalendar && (
        <CalendarModal
          history={history}
          plans={plans}
          muscles={muscles}
          currentTime={getEffectiveTime()}
          onClose={() => setShowCalendar(false)}
          onAddPlan={handleAddPlan}
          onDeletePlan={handleDeletePlan}
        />
      )}

      {showPlanReport && (
          <PlanListModal 
            plans={plans}
            muscles={muscles}
            currentTime={getEffectiveTime()}
            onClose={() => setShowPlanReport(false)}
          />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  );
}
