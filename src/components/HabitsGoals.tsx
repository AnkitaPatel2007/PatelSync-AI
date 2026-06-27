import React, { useState } from "react";
import { Habit, WeeklyGoal } from "../types";
import { Plus, Trophy, Flame, Check, Sparkles, Goal, Trash2, CheckCircle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";

interface HabitsGoalsProps {
  habits: Habit[];
  goals: WeeklyGoal[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (title: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleGoal: (id: string) => void;
  onAddGoal: (title: string) => void;
  onDeleteGoal: (id: string) => void;
}

export default function HabitsGoals({
  habits,
  goals,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onToggleGoal,
  onAddGoal,
  onDeleteGoal
}: HabitsGoalsProps) {
  const { t, language } = useLanguage();
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [habitTitle, setHabitTitle] = useState("");
  const [goalTitle, setGoalTitle] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitTitle.trim()) {
      onAddHabit(habitTitle.trim());
      setHabitTitle("");
      setShowHabitForm(false);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (goalTitle.trim()) {
      onAddGoal(goalTitle.trim());
      setGoalTitle("");
      setShowGoalForm(false);
    }
  };

  return (
    <div id="habits-goals-container" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* Daily Habits Tracker (Streaks and completion dates) */}
      <div id="habits-card" className="bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            {t("myDailyHabits")}
          </h3>
          <button
            id="btn-add-habit"
            onClick={() => setShowHabitForm(!showHabitForm)}
            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Expandable habit addition form */}
        {showHabitForm && (
          <form onSubmit={handleCreateHabit} className="flex gap-1.5 p-1">
            <input
              type="text"
              required
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              placeholder={t("habitPlaceholder")}
              className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg focus:outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer"
            >
              {t("addBtn")}
            </button>
          </form>
        )}

        {/* Habit List */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {habits.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-slate-400 italic">{t("noHabitsAdded")}</div>
          ) : (
            habits.map((habit) => {
              const isCompletedToday = habit.completedDates.includes(todayStr);

              return (
                <div 
                  key={habit.id}
                  className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-2.5 rounded-xl hover:border-slate-300 transition shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-toggle-habit-${habit.id}`}
                      onClick={() => onToggleHabit(habit.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        isCompletedToday 
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                      }`}
                    >
                      {isCompletedToday && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </button>
                    <span className={`text-xs font-semibold ${isCompletedToday ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {habit.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Streak Indicator */}
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 font-mono">
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 stroke-[1.5]" />
                      {habit.streak}{language === "hi" ? " दिन" : "d"}
                    </span>
                    <button
                      id={`btn-delete-habit-${habit.id}`}
                      onClick={() => onDeleteHabit(habit.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Weekly High-Level Goals */}
      <div id="goals-card" className="bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Goal className="w-4 h-4 text-indigo-500" />
            {t("myWeeklyGoals")}
          </h3>
          <button
            id="btn-add-goal"
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Expandable goal addition form */}
        {showGoalForm && (
          <form onSubmit={handleCreateGoal} className="flex gap-1.5 p-1">
            <input
              type="text"
              required
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder={t("goalPlaceholder")}
              className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg focus:outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-indigo-700 font-semibold cursor-pointer"
            >
              {t("addBtn")}
            </button>
          </form>
        )}

        {/* Goal List */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
          {goals.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-slate-400 italic">{t("noGoalsAdded")}</div>
          ) : (
            goals.map((goal) => {
              return (
                <div 
                  key={goal.id}
                  className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-2.5 rounded-xl hover:border-slate-300 transition shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-toggle-goal-${goal.id}`}
                      onClick={() => onToggleGoal(goal.id)}
                      className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {goal.completed ? (
                        <CheckCircle className="w-5 h-5 text-indigo-500 fill-indigo-50 dark:fill-indigo-950/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                    <span className={`text-xs font-semibold ${goal.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {goal.completed && <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded font-extrabold uppercase mr-1">{language === "hi" ? "पूर्ण" : "Done"}</span>}
                      {goal.title}
                    </span>
                  </div>

                  <button
                    id={`btn-delete-goal-${goal.id}`}
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
