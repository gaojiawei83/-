
export type ViewSide = 'front' | 'back';

export type MuscleId = 
  | 'chest' 
  | 'abs' 
  | 'biceps' 
  | 'quads' 
  | 'front-delt'
  | 'traps'
  | 'lats'
  | 'triceps'
  | 'hamstrings'
  | 'rear-delt'
  | 'glutes'
  | 'calves';

export type MuscleStatus = 'neutral' | 'trained' | 'sore' | 'ready' | 'stale';

export interface UserPhoto {
  id: string;
  muscleId: MuscleId | 'all'; // 'all' for full body check
  timestamp: number;
  dataUrl: string; // Base64 string
  note?: string;
}

export interface MuscleData {
  id: MuscleId;
  name: string;
  workoutCount: number;
  lastWorkoutTimestamp: number | null;
  muscleGrowth: number; // Scale factor, e.g., 1.0 to 1.4
  photos?: UserPhoto[]; // New: Photo history
}

export interface WorkoutLog {
  id: string;
  muscleId: MuscleId;
  timestamp: number;
  isForced?: boolean;
  xpGained?: number; // Records how much XP was earned to allow rollback
}

export interface WorkoutPlan {
  id: string;
  dateStr: string; // Format: YYYY-MM-DD
  muscleId: MuscleId;
  completed: boolean;
  processed?: boolean; // If true, score has been settled (added or deducted)
}

export interface RecoverySettings {
  yellowDuration: number;
  redDuration: number;
  greenDuration: number;
  colors: {
    trained: string;
    sore: string;
    ready: string;
    stale: string;
    neutral: string;
  };
}

// --- Gamification Types ---

export interface UserStats {
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveTimestamp: number; // Start of the day timestamp of last workout
  unlockedAchievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode; 
  xpReward: number;
}

export interface AppState {
  muscles: Record<MuscleId, MuscleData>;
  history: WorkoutLog[];
  plans: WorkoutPlan[];
  settings: RecoverySettings;
  userStats: UserStats;
  lastOpenTimestamp: number;
}
