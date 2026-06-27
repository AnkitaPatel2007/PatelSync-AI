export type CategoryType = 'assignment' | 'meeting' | 'bill' | 'interview' | 'commitment' | 'other';
export type PriorityType = 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'not_urgent_not_important';
export type StatusType = 'pending' | 'in_progress' | 'completed' | 'missed';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskActionPlanItem {
  step: string;
  minutes: number;
  tip: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD or full date
  duration: number; // in minutes
  category: CategoryType;
  energyLevel: 'high' | 'medium' | 'low';
  priority: PriorityType;
  status: StatusType;
  subtasks: SubTask[];
  aiDifficulty?: number; // 1 to 100
  aiImpactScore?: number; // 1 to 100
  aiActionPlan?: TaskActionPlanItem[];
  completedAt?: string;
  reasoning?: string;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  completedDates: string[]; // YYYY-MM-DD
}

export interface WeeklyGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface TimeBlock {
  id: string;
  time: string; // e.g. "09:00 - 10:30"
  taskTitle: string;
  activityType: 'focus' | 'meeting' | 'break' | 'admin' | 'leisure' | 'routine';
  description: string;
}

export interface ProductivitySummary {
  completionRate: number;
  completedCount: number;
  totalCount: number;
  longestStreak: number;
  efficiencyRating: string;
}

export interface AIRecResponse {
  recommendations: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: 'time_blocking' | 'energy_management' | 'focus_hack' | 'inertia_breaker';
  }[];
  generalAnalysis: string;
}

export interface AIPlanningResponse {
  difficulty: number;
  impactScore: number;
  actionPlan: TaskActionPlanItem[];
}

export interface AIPrioritizationResponse {
  taskId: string;
  priority: PriorityType;
  aiDifficulty: number;
  aiImpactScore: number;
  reasoning: string;
}

export interface AIChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AIChatResponse {
  text: string;
  extractedTask?: {
    title: string;
    description: string;
    deadline?: string;
    category?: CategoryType;
    duration?: number;
    priority?: PriorityType;
    energyLevel?: 'high' | 'medium' | 'low';
  };
  extractedHabit?: {
    title: string;
  };
  extractedGoal?: {
    title: string;
  };
}
