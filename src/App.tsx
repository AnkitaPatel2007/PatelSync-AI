import React, { useState, useEffect } from "react";
import { Task, Habit, WeeklyGoal, TimeBlock, AIRecResponse } from "./types";
import { SAMPLE_TASKS, SAMPLE_HABITS, SAMPLE_GOALS, SAMPLE_TIME_BLOCKS } from "./data";
import TaskBoard from "./components/TaskBoard";
import ScheduleView from "./components/ScheduleView";
import HabitsGoals from "./components/HabitsGoals";
import CoPilot from "./components/CoPilot";
import AuthScreen from "./components/AuthScreen";
import ProductivityChart from "./components/ProductivityChart";
import { useAuth } from "./AuthContext";
import { db } from "./lib/firebase";
import { 
  collection, query, where, onSnapshot, doc, setDoc, deleteDoc, writeBatch, getDocs 
} from "firebase/firestore";
import { 
  Trophy, AlertCircle, LogOut, Loader2
} from "lucide-react";
import { useLanguage } from "./LanguageContext";

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const { user, userProfile, loading: authLoading, logout, updatePreferences } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  // Schedule setup configurations
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [focusPreferences, setFocusPreferences] = useState("Maximize focus in the morning, review bills in the afternoon");

  // AI query loading triggers
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);

  // Recommendations cache
  const [recommendationData, setRecommendationData] = useState<AIRecResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load preferences when profile is ready
  useEffect(() => {
    if (userProfile) {
      if (userProfile.wakeTime) setWakeTime(userProfile.wakeTime);
      if (userProfile.sleepTime) setSleepTime(userProfile.sleepTime);
      if (userProfile.focusPreferences) setFocusPreferences(userProfile.focusPreferences);
    }
  }, [userProfile]);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!user) return;

    // Listen to Tasks
    const qTasks = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubscribeTasks = onSnapshot(qTasks, async (snapshot) => {
      const loadedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedTasks.push({
          id: doc.id,
          title: data.title,
          description: data.description || "",
          deadline: data.deadline || "",
          duration: data.duration || 30,
          category: data.category || "assignment",
          energyLevel: data.energyLevel || "medium",
          priority: data.priority || "important_not_urgent",
          status: data.status || "pending",
          subtasks: data.subtasks || [],
          aiDifficulty: data.aiDifficulty,
          aiImpactScore: data.aiImpactScore,
          reasoning: data.reasoning
        });
      });

      // If database collections are completely empty for this user, seed them with sample tasks
      if (loadedTasks.length === 0 && snapshot.metadata.fromCache === false) {
        // Double-check if we should seed
        const localSaved = localStorage.getItem(`ai_tasks_${user.uid}`);
        const initialTasks = localSaved ? JSON.parse(localSaved) : SAMPLE_TASKS;
        if (initialTasks && initialTasks.length > 0) {
          const batch = writeBatch(db);
          initialTasks.forEach((t: Task) => {
            const docRef = doc(collection(db, "tasks"));
            batch.set(docRef, { ...t, id: docRef.id, userId: user.uid });
          });
          await batch.commit();
          return;
        }
      }
      setTasks(loadedTasks);
      localStorage.setItem(`ai_tasks_${user.uid}`, JSON.stringify(loadedTasks));
    });

    // Listen to Habits
    const qHabits = query(collection(db, "habits"), where("userId", "==", user.uid));
    const unsubscribeHabits = onSnapshot(qHabits, async (snapshot) => {
      const loadedHabits: Habit[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedHabits.push({
          id: doc.id,
          title: data.title,
          streak: data.streak || 0,
          completedDates: data.completedDates || []
        });
      });

      if (loadedHabits.length === 0 && snapshot.metadata.fromCache === false) {
        const localSaved = localStorage.getItem(`ai_habits_${user.uid}`);
        const initialHabits = localSaved ? JSON.parse(localSaved) : SAMPLE_HABITS;
        if (initialHabits && initialHabits.length > 0) {
          const batch = writeBatch(db);
          initialHabits.forEach((h: Habit) => {
            const docRef = doc(collection(db, "habits"));
            batch.set(docRef, { ...h, id: docRef.id, userId: user.uid });
          });
          await batch.commit();
          return;
        }
      }
      setHabits(loadedHabits);
      localStorage.setItem(`ai_habits_${user.uid}`, JSON.stringify(loadedHabits));
    });

    // Listen to Goals
    const qGoals = query(collection(db, "goals"), where("userId", "==", user.uid));
    const unsubscribeGoals = onSnapshot(qGoals, async (snapshot) => {
      const loadedGoals: WeeklyGoal[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedGoals.push({
          id: doc.id,
          title: data.title,
          completed: data.completed || false
        });
      });

      if (loadedGoals.length === 0 && snapshot.metadata.fromCache === false) {
        const localSaved = localStorage.getItem(`ai_goals_${user.uid}`);
        const initialGoals = localSaved ? JSON.parse(localSaved) : SAMPLE_GOALS;
        if (initialGoals && initialGoals.length > 0) {
          const batch = writeBatch(db);
          initialGoals.forEach((g: WeeklyGoal) => {
            const docRef = doc(collection(db, "goals"));
            batch.set(docRef, { ...g, id: docRef.id, userId: user.uid });
          });
          await batch.commit();
          return;
        }
      }
      setGoals(loadedGoals);
      localStorage.setItem(`ai_goals_${user.uid}`, JSON.stringify(loadedGoals));
    });

    // Listen to Time Blocks
    const qBlocks = query(collection(db, "timeBlocks"), where("userId", "==", user.uid));
    const unsubscribeBlocks = onSnapshot(qBlocks, async (snapshot) => {
      const loadedBlocks: TimeBlock[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedBlocks.push({
          id: doc.id,
          time: data.time || "",
          taskTitle: data.taskTitle || "",
          activityType: data.activityType || "focus",
          description: data.description || ""
        });
      });

      if (loadedBlocks.length === 0 && snapshot.metadata.fromCache === false) {
        const localSaved = localStorage.getItem(`ai_blocks_${user.uid}`);
        const initialBlocks = localSaved ? JSON.parse(localSaved) : SAMPLE_TIME_BLOCKS;
        if (initialBlocks && initialBlocks.length > 0) {
          const batch = writeBatch(db);
          initialBlocks.forEach((tb: TimeBlock) => {
            const docRef = doc(collection(db, "timeBlocks"));
            batch.set(docRef, { ...tb, id: docRef.id, userId: user.uid });
          });
          await batch.commit();
          return;
        }
      }
      setTimeBlocks(loadedBlocks);
      localStorage.setItem(`ai_blocks_${user.uid}`, JSON.stringify(loadedBlocks));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
      unsubscribeGoals();
      unsubscribeBlocks();
    };
  }, [user]);

  // Compute Active Productivity Score out of 100!
  const calculateProductivityScore = (): number => {
    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter(t => t.status === "completed").length;
    
    const taskRatio = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 40 : 20;

    // Habit completion streak metric
    const totalStreak = habits.reduce((acc, h) => acc + h.streak, 0);
    const habitScore = Math.min((totalStreak / (habits.length * 5 || 1)) * 40, 40);

    // Goal ratios
    const totalGoalsCount = goals.length;
    const completedGoalsCount = goals.filter(g => g.completed).length;
    const goalRatio = totalGoalsCount > 0 ? (completedGoalsCount / totalGoalsCount) * 20 : 10;

    return Math.round(taskRatio + habitScore + goalRatio);
  };

  const productivityScore = calculateProductivityScore();

  // Task operation handlers (persisted to Firestore)
  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'subtasks'> & { subtasks: string[] }) => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, "tasks"));
      const task: Task = {
        ...newTaskData,
        id: docRef.id,
        subtasks: newTaskData.subtasks.map((st, i) => ({
          id: `s_${Date.now()}_${i}`,
          title: st,
          completed: false
        }))
      };
      await setDoc(docRef, { ...task, userId: user.uid });
    } catch (err) {
      console.error("Error adding task:", err);
      setErrorMessage("Failed to add task to Cloud Firestore.");
    }
  };

  const handleUpdateTask = async (updated: Task) => {
    if (!user) return;
    try {
      const docRef = doc(db, "tasks", updated.id);
      await setDoc(docRef, { ...updated, userId: user.uid }, { merge: true });
    } catch (err) {
      console.error("Error updating task:", err);
      setErrorMessage("Failed to update task in Cloud Firestore.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "tasks", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting task:", err);
      setErrorMessage("Failed to delete task from Cloud Firestore.");
    }
  };

  // Habits operations
  const handleToggleHabit = async (id: string) => {
    if (!user) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const existing = habits.find(h => h.id === id);
      if (!existing) return;

      const completed = existing.completedDates.includes(todayStr);
      let newDates = [...existing.completedDates];
      let newStreak = existing.streak;

      if (completed) {
        newDates = newDates.filter(d => d !== todayStr);
        newStreak = Math.max(0, newStreak - 1);
      } else {
        newDates.push(todayStr);
        newStreak += 1;
      }

      const docRef = doc(db, "habits", id);
      await setDoc(docRef, { streak: newStreak, completedDates: newDates }, { merge: true });
    } catch (err) {
      console.error("Error toggling habit:", err);
    }
  };

  const handleAddHabit = async (title: string) => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, "habits"));
      const habit: Habit = {
        id: docRef.id,
        title,
        streak: 0,
        completedDates: []
      };
      await setDoc(docRef, { ...habit, userId: user.uid });
    } catch (err) {
      console.error("Error adding habit:", err);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "habits", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting habit:", err);
    }
  };

  // Goals operations
  const handleToggleGoal = async (id: string) => {
    if (!user) return;
    try {
      const existing = goals.find(g => g.id === id);
      if (!existing) return;

      const docRef = doc(db, "goals", id);
      await setDoc(docRef, { completed: !existing.completed }, { merge: true });
    } catch (err) {
      console.error("Error toggling goal:", err);
    }
  };

  const handleAddGoal = async (title: string) => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, "goals"));
      const goal: WeeklyGoal = {
        id: docRef.id,
        title,
        completed: false
      };
      await setDoc(docRef, { ...goal, userId: user.uid });
    } catch (err) {
      console.error("Error adding goal:", err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "goals", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting goal:", err);
    }
  };

  // AI-Extraction callbacks from the vocal chat companion
  const handleAddExtractedTask = async (extTask: any) => {
    if (!user) return;
    try {
      const docRef = doc(collection(db, "tasks"));
      const task: Task = {
        id: docRef.id,
        title: extTask.title,
        description: extTask.description || "",
        deadline: extTask.deadline || new Date().toISOString().split('T')[0],
        duration: extTask.duration || 30,
        category: extTask.category || "assignment",
        energyLevel: extTask.energyLevel || "medium",
        priority: extTask.priority || "important_not_urgent",
        status: "pending",
        subtasks: []
      };
      await setDoc(docRef, { ...task, userId: user.uid });
    } catch (err) {
      console.error("Error adding extracted task:", err);
    }
  };

  const handleAddExtractedHabit = (habitTitle: string) => {
    handleAddHabit(habitTitle);
  };

  const handleAddExtractedGoal = (goalTitle: string) => {
    handleAddGoal(goalTitle);
  };

  // Server-side AI Prioritization execution
  const triggerAIPrioritize = async () => {
    try {
      setIsPrioritizing(true);
      setErrorMessage(null);
      const res = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tasks: tasks.map(t => ({ id: t.id, title: t.title, description: t.description, category: t.category, deadline: t.deadline })),
          context: focusPreferences
        })
      });

      if (!res.ok) throw new Error("Prioritization endpoint failed");
      const data = await res.json();

      if (data && data.tasks && user) {
        const batch = writeBatch(db);
        data.tasks.forEach((aiMatch: any) => {
          const docRef = doc(db, "tasks", aiMatch.id);
          batch.set(docRef, {
            priority: aiMatch.priority,
            aiDifficulty: aiMatch.aiDifficulty,
            aiImpactScore: aiMatch.aiImpactScore,
            reasoning: aiMatch.reasoning
          }, { merge: true });
        });
        await batch.commit();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not re-prioritize. Please confirm your GEMINI_API_KEY is active in Settings.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Server-side AI Hourly Daily Schedule time-blocking
  const triggerAIScheduling = async () => {
    if (!user) return;
    try {
      setIsScheduling(true);
      setErrorMessage(null);
      const activeTasks = tasks.filter(t => t.status !== "completed");

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: activeTasks,
          wakeTime,
          sleepTime,
          focusPreferences
        })
      });

      if (!res.ok) throw new Error("Scheduling endpoint failed");
      const data = await res.json();

      if (data && data.blocks) {
        const batch = writeBatch(db);
        
        // Delete old blocks
        const existingBlocksSnap = await getDocs(query(collection(db, "timeBlocks"), where("userId", "==", user.uid)));
        existingBlocksSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Add new blocks
        data.blocks.forEach((b: any) => {
          const docRef = doc(collection(db, "timeBlocks"));
          batch.set(docRef, {
            userId: user.uid,
            time: b.time,
            taskTitle: b.taskTitle,
            activityType: b.activityType,
            description: b.description || ""
          });
        });

        await batch.commit();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to calculate time-blocks. Please make sure the Gemini secret is configured.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Server-side AI Performance analysis recommendations
  const triggerAIRecommendations = async () => {
    if (!user) return;
    try {
      setIsRecommending(true);
      setErrorMessage(null);
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits, goals })
      });

      if (!res.ok) throw new Error("Recommendations endpoint failed");
      const data = await res.json();
      setRecommendationData(data);

      // Save recommendation inside the user's Firestore profile so it is synced
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { recommendationData: data }, { merge: true });
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Could not pull personalized recommendations. Check your API token.");
    } finally {
      setIsRecommending(false);
    }
  };

  // Loading indicator for Auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans antialiased">
        <div className="p-8 text-center max-w-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">
            Loading Workspace
          </h3>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Preparing your secure cloud environment...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to Sign In / Sign Up if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div id="app-root" className="min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased font-sans">
      
      {/* Top polished header row */}
      <header id="top-navbar" className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-white block leading-tight">
                {t("logoTitle")}
              </span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none">
                {t("smartPlanner")}
              </span>
            </div>
          </div>

          {/* AI Status and Profile section */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Language Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/40">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                  language === "hi"
                    ? "bg-white text-indigo-600 dark:bg-slate-900 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Status bubble */}
            <div className="bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-full hidden md:flex items-center gap-2 border border-slate-200/50 dark:border-slate-800/40">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t("aiAssistantActive")}
              </span>
            </div>

            {/* Productivity score display */}
            <div id="score-badge" className="bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 px-3 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm">
              <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
              <div>
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider leading-none">
                  {t("productivityScore")}
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                  {productivityScore}%
                </span>
              </div>
              
              {/* Score rating interpretation */}
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800 hidden sm:block">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {productivityScore >= 80 ? t("excellentProgress") : productivityScore >= 50 ? t("steadyProgress") : t("gettingStarted")}
                </span>
              </div>
            </div>

            {/* Profile section with Dynamic user name & Sign Out */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 sm:pl-6">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs shadow-inner uppercase">
                {(userProfile?.displayName || user.displayName || user.email || "U").substring(0, 2)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                  {userProfile?.displayName || user.displayName || "User"}
                </p>
                <p className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase">
                  {user.email}
                </p>
              </div>
              <button 
                onClick={logout}
                title={t("signOutBtn")}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Warning/Error notification banner */}
      {errorMessage && (
        <div id="error-notification" className="bg-rose-50 border-b border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="ml-auto underline hover:text-rose-950 text-[11px]"
            >
              {t("dismiss")}
            </button>
          </div>
        </div>
      )}

      {/* Main Multi-grid Dashboard Layout */}
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left main pane (Tasks focus stack, prioritize actions, etc.) - Takes 7 columns */}
        <section id="left-pane" className="lg:col-span-8 space-y-6">
          <TaskBoard 
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onTriggerPrioritize={triggerAIPrioritize}
            isPrioritizing={isPrioritizing}
          />

          {/* Data Visualization Weekly Productivity Chart */}
          <ProductivityChart tasks={tasks} />

          {/* Goals & Habits horizontal layout */}
          <HabitsGoals 
            habits={habits}
            goals={goals}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleGoal={handleToggleGoal}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        </section>

        {/* Right sidebar pane (Schedule blocking timeline, vocal assistant) - Takes 4 columns */}
        <section id="right-pane" className="lg:col-span-4 space-y-6">
          <ScheduleView 
            tasks={tasks}
            timeBlocks={timeBlocks}
            wakeTime={wakeTime}
            sleepTime={sleepTime}
            focusPreferences={focusPreferences}
            onUpdateTimes={async (wake, sleep, pref) => { 
              setWakeTime(wake); 
              setSleepTime(sleep); 
              setFocusPreferences(pref); 
              await updatePreferences(wake, sleep, pref);
            }}
            onTriggerGenerateSchedule={triggerAIScheduling}
            isScheduling={isScheduling}
          />

          <CoPilot 
            tasks={tasks}
            habits={habits}
            goals={goals}
            onAddExtractedTask={handleAddExtractedTask}
            onAddExtractedHabit={handleAddExtractedHabit}
            onAddExtractedGoal={handleAddExtractedGoal}
            recommendationData={recommendationData}
            onRefreshRecommendations={triggerAIRecommendations}
            isRecommending={isRecommending}
          />
        </section>

      </main>

      {/* Footer credits and environment labels */}
      <footer id="dashboard-footer" className="h-10 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("cloudSync")}
            </span>
            <span>{t("secureStorage")}</span>
            <span>{t("aiStatusOnline")}</span>
          </div>
          <div className="italic hidden sm:block text-slate-400">
            {t("systemFooterDesc")}
          </div>
        </div>
      </footer>

    </div>
  );
}
