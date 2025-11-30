
import { MuscleStatus, RecoverySettings, UserStats, WorkoutLog, MuscleId, MuscleData, Achievement } from './types';

const ONE_HOUR = 60 * 60 * 1000;

// XP CONSTANTS
export const XP_PLAN_CREATE = 5;
export const XP_PLAN_COMPLETE = 25;
export const XP_PLAN_MISS = 20; // Penalty

export const getMuscleStatus = (
  lastWorkout: number | null, 
  currentTime: number,
  settings: RecoverySettings
): MuscleStatus => {
  if (!lastWorkout) return 'neutral';

  const diff = currentTime - lastWorkout;
  const hoursDiff = diff / ONE_HOUR;

  // Phase 1: Yellow (Trained)
  if (hoursDiff < settings.yellowDuration) {
    return 'trained';
  } 
  // Phase 2: Red (Sore)
  else if (hoursDiff < (settings.yellowDuration + settings.redDuration)) {
    return 'sore';
  } 
  // Phase 3: Green (Ready)
  else if (hoursDiff < (settings.yellowDuration + settings.redDuration + settings.greenDuration)) {
    return 'ready';
  } 
  // Phase 4: Grey (Stale/Inactive)
  else {
    return 'stale';
  }
};

export const getStatusColor = (status: MuscleStatus, colors?: RecoverySettings['colors']): string => {
  const defaultColors = {
    trained: '#facc15', // Yellow-400
    sore: '#ef4444',    // Red-500
    ready: '#10b981',   // Emerald-500
    stale: '#94a3b8',   // Slate-400
    neutral: '#475569'  // Slate-600
  };

  const palette = colors || defaultColors;

  switch (status) {
    case 'trained': return palette.trained;
    case 'sore': return palette.sore;
    case 'ready': return palette.ready;
    case 'stale': return palette.stale;
    case 'neutral': default: return palette.neutral;
  }
};

export const getStatusText = (status: MuscleStatus): string => {
  switch (status) {
    case 'trained': return '刚刚练完';     
    case 'sore': return '肌肉酸痛';        
    case 'ready': return '完全恢复';       
    case 'stale': return '需要激活';       
    case 'neutral': return '从未训练';       
  }
};

export const getMuscleScale = (count: number): number => {
  const maxScale = 1.4;
  const growthRate = 0.02; 
  return Math.min(1 + (count * growthRate), maxScale);
};

// --- New Muscle Tier System ---
export const getMuscleTier = (count: number): { title: string, level: number, nextThreshold: number } => {
  if (count < 5) return { title: '基础唤醒', level: 1, nextThreshold: 5 };
  if (count < 10) return { title: '神经适应', level: 2, nextThreshold: 10 };
  if (count < 20) return { title: '肌肉充血', level: 3, nextThreshold: 20 };
  if (count < 50) return { title: '塑形强化', level: 4, nextThreshold: 50 };
  return { title: '极致刻画', level: 5, nextThreshold: 100 };
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

export const formatFullDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
};

export const formatDuration = (hours: number): string => {
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days} 天`;
  }
  return `${hours} 小时`;
};

// --- Image Helper ---
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70% quality
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};


// --- Gamification Utils ---

const XP_BASE_CONST = 30;

export const calculateLevel = (xp: number): number => {
  return Math.floor(1 + Math.sqrt(xp / XP_BASE_CONST));
};

export const getNextLevelXp = (level: number): number => {
  return XP_BASE_CONST * Math.pow(level, 2);
};

export const getLevelProgress = (xp: number, level: number) => {
  const currentLevelMinXp = XP_BASE_CONST * Math.pow(level - 1, 2);
  const nextLevelXp = XP_BASE_CONST * Math.pow(level, 2);
  const progress = (xp - currentLevelMinXp) / (nextLevelXp - currentLevelMinXp);
  return Math.max(0, Math.min(1, progress)); 
};

export const calculateXpGain = (isForced: boolean, currentStreak: number) => {
    let xp = 20; 
    if (isForced) xp += 10;
    xp += Math.min(currentStreak * 2, 20);
    return xp;
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_blood', title: '新的开始', description: '完成第一次训练记录', icon: '📝', xpReward: 50 },
  { id: 'streak_3', title: '习惯养成', description: '连续训练 3 天', icon: '🌱', xpReward: 100 },
  { id: 'streak_7', title: '坚持不懈', description: '连续训练 7 天', icon: '🔥', xpReward: 300 },
  { id: 'streak_30', title: '健身达人', description: '连续训练 30 天', icon: '🏅', xpReward: 1000 },
  { id: 'chest_master', title: '胸肌强化', description: '胸肌训练超过 10 次', icon: '🛡️', xpReward: 150 },
  { id: 'leg_day_warrior', title: '练腿日', description: '腿部训练超过 10 次', icon: '🦵', xpReward: 150 },
  { id: 'full_body', title: '全身唤醒', description: '所有部位至少训练过 1 次', icon: '🌐', xpReward: 200 },
  { id: 'photographer', title: '记录自我', description: '上传第一张体态照片', icon: '📸', xpReward: 100 },
];

export const checkAchievements = (
  stats: UserStats, 
  muscles: Record<MuscleId, MuscleData>, 
  history: WorkoutLog[],
  currentLog: WorkoutLog
): Achievement[] => {
  const unlocked: Achievement[] = [];
  
  // Helpers
  const isUnlocked = (id: string) => stats.unlockedAchievements.includes(id);
  const muscleList = Object.values(muscles);
  const hasPhotos = muscleList.some(m => m.photos && m.photos.length > 0);

  // 1. First Blood
  if (!isUnlocked('first_blood') && history.length >= 1) {
    unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'first_blood')!);
  }

  // 2. Streaks
  if (!isUnlocked('streak_3') && stats.currentStreak >= 3) unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'streak_3')!);
  if (!isUnlocked('streak_7') && stats.currentStreak >= 7) unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'streak_7')!);
  if (!isUnlocked('streak_30') && stats.currentStreak >= 30) unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'streak_30')!);

  // 3. Muscle Specific
  if (!isUnlocked('chest_master') && muscles['chest'].workoutCount >= 10) unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'chest_master')!);
  if (!isUnlocked('leg_day_warrior') && muscles['quads'].workoutCount >= 10) unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'leg_day_warrior')!);

  // 4. Full Body
  if (!isUnlocked('full_body') && muscleList.every(m => m.workoutCount > 0)) {
    unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'full_body')!);
  }

  // 5. Photos
  if (!isUnlocked('photographer') && hasPhotos) {
    unlocked.push(ACHIEVEMENTS_LIST.find(a => a.id === 'photographer')!);
  }

  return unlocked;
};