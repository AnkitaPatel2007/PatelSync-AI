import { Task, Habit, WeeklyGoal, TimeBlock } from "./types";

export const SAMPLE_TASKS: Task[] = [
  {
    id: "t1",
    title: "Prep for Technical Mock Interview",
    description: "Practice sliding window algorithms and design questions. Focus on active recall.",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    duration: 90,
    category: "interview",
    energyLevel: "high",
    priority: "urgent_important",
    status: "in_progress",
    subtasks: [
      { id: "s1_1", title: "Review sliding window templates", completed: true },
      { id: "s1_2", title: "Practice 2 LeetCode Medium questions", completed: false },
      { id: "s1_3", title: "Record a mock response on camera", completed: false }
    ],
    aiDifficulty: 78,
    aiImpactScore: 92,
    aiActionPlan: [
      { step: "Revise core concepts", minutes: 20, tip: "Quickly read patterns in notebook first." },
      { step: "Problem execution", minutes: 50, tip: "Limit yourself to 25 minutes per problem. Do not peek at solutions." },
      { step: "Behavioral review", minutes: 20, tip: "Practice the STAR framework out loud." }
    ]
  },
  {
    id: "t2",
    title: "Settle Electricity & Internet Bill",
    description: "Autopay failed last cycle. Due soon to prevent service interruption.",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day from now
    duration: 15,
    category: "bill",
    energyLevel: "low",
    priority: "urgent_important",
    status: "pending",
    subtasks: [
      { id: "s2_1", title: "Log into utility portal", completed: false },
      { id: "s2_2", title: "Verify transaction receipt", completed: false }
    ],
    aiDifficulty: 10,
    aiImpactScore: 85
  },
  {
    id: "t3",
    title: "Draft Project Proposal Milestone 1",
    description: "Draft architecture outline, API routes, and database schema diagrams for group submission.",
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
    duration: 120,
    category: "assignment",
    energyLevel: "high",
    priority: "important_not_urgent",
    status: "pending",
    subtasks: [
      { id: "s3_1", title: "Create Mermaid.js architecture flow", completed: false },
      { id: "s3_2", title: "Draft API table specs", completed: false },
      { id: "s3_3", title: "Share draft link with team members", completed: false }
    ],
    aiDifficulty: 65,
    aiImpactScore: 80
  },
  {
    id: "t4",
    title: "1-on-1 Coffee Chat with Sarah",
    description: "Discuss potential networking referral at Stripe.",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    duration: 45,
    category: "commitment",
    energyLevel: "medium",
    priority: "important_not_urgent",
    status: "pending",
    subtasks: []
  },
  {
    id: "t_comp_1",
    title: "Read React 19 Documentation",
    description: "Reviewed the new compiler and transition APIs.",
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: 45,
    category: "assignment",
    energyLevel: "medium",
    priority: "urgent_not_important",
    status: "completed",
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: []
  },
  {
    id: "t_comp_2",
    title: "Review Stripe Integration Specs",
    description: "Looked over webhooks and payment intent APIs.",
    deadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: 60,
    category: "assignment",
    energyLevel: "high",
    priority: "important_not_urgent",
    status: "completed",
    completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: []
  },
  {
    id: "t_comp_3",
    title: "Organize Digital Tax Folder",
    description: "Structured PDF receipts and calculated quarterly estimates.",
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: 90,
    category: "bill",
    energyLevel: "low",
    priority: "urgent_important",
    status: "completed",
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    subtasks: []
  }
];

export const SAMPLE_HABITS: Habit[] = [
  {
    id: "h1",
    title: "LeetCode Daily Challenge",
    streak: 4,
    completedDates: [
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ]
  },
  {
    id: "h2",
    title: "Review Financial Dashboard",
    streak: 1,
    completedDates: [
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ]
  },
  {
    id: "h3",
    title: "Daily Focus Planning",
    streak: 5,
    completedDates: [
      new Date().toISOString().split('T')[0],
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ]
  }
];

export const SAMPLE_GOALS: WeeklyGoal[] = [
  { id: "g1", title: "Complete all code mock challenges", completed: false },
  { id: "g2", title: "Review monthly family and utility bills", completed: true },
  { id: "g3", title: "Exercise at least 3 times", completed: false }
];

export const SAMPLE_TIME_BLOCKS: TimeBlock[] = [
  {
    id: "tb1",
    time: "08:00 - 08:30",
    taskTitle: "Morning Wakeup & Hydration",
    activityType: "routine",
    description: "Get some sunlight and schedule tasks for the day."
  },
  {
    id: "tb2",
    time: "09:00 - 10:30",
    taskTitle: "Prep for Technical Mock Interview",
    activityType: "focus",
    description: "Revise sliding window algorithm and solve 2 Medium challenges."
  },
  {
    id: "tb3",
    time: "10:30 - 11:00",
    taskTitle: "Coffee & Light Stroll",
    activityType: "break",
    description: "Reset attention, step away from screens."
  },
  {
    id: "tb4",
    time: "11:00 - 11:30",
    taskTitle: "Settle Electricity & Internet Bill",
    activityType: "admin",
    description: "Log into portals and process due bills."
  },
  {
    id: "tb5",
    time: "13:00 - 14:00",
    taskTitle: "Inbox review and email replies",
    activityType: "admin",
    description: "Clean up correspondence and set reminders."
  }
];
