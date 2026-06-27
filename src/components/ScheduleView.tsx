import React, { useState } from "react";
import { TimeBlock, Task } from "../types";
import { 
  Clock, Sparkles, AlertTriangle, Calendar, RefreshCw, 
  ChevronLeft, ChevronRight, CheckCircle, Info, BookOpen, DollarSign, Briefcase, MessageSquare 
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../LanguageContext";

interface ScheduleViewProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  wakeTime: string;
  sleepTime: string;
  focusPreferences: string;
  onUpdateTimes: (wake: string, sleep: string, pref: string) => void;
  onTriggerGenerateSchedule: () => Promise<void>;
  isScheduling: boolean;
}

export default function ScheduleView({
  tasks,
  timeBlocks,
  wakeTime,
  sleepTime,
  focusPreferences,
  onUpdateTimes,
  onTriggerGenerateSchedule,
  isScheduling
}: ScheduleViewProps) {
  const { t, language } = useLanguage();
  const [localWake, setLocalWake] = useState(wakeTime);
  const [localSleep, setLocalSleep] = useState(sleepTime);
  const [localPref, setLocalPref] = useState(focusPreferences);
  const [showConfig, setShowConfig] = useState(false);

  // Weekly calendar creation (Starts from today)
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const handleSaveConfig = () => {
    onUpdateTimes(localWake, localSleep, localPref);
    setShowConfig(false);
  };

  // Get tasks due on a specific YYYY-MM-DD
  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(t => t.deadline === dateString);
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "focus": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300";
      case "meeting": return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
      case "break": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "admin": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
      case "leisure": return "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300";
      default: return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "assignment": return "bg-emerald-500";
      case "bill": return "bg-amber-500";
      case "interview": return "bg-indigo-500";
      case "meeting": return "bg-sky-500";
      case "commitment": return "bg-violet-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div id="schedule-container" className="space-y-6">
      
      {/* Dynamic 7-Day Weekly Calendar integration */}
      <div id="weekly-calendar" className="bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            {t("weeklyScheduleTasks")}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono font-medium uppercase">
            {t("next7Days")}
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0];
            const tasksDue = getTasksForDate(day);
            const isToday = idx === 0;

            return (
              <div 
                key={dateStr}
                className={`p-2 rounded-xl flex flex-col items-center justify-between min-h-[85px] border ${
                  isToday 
                  ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/15 dark:border-indigo-900/40" 
                  : "bg-white border-slate-200/60 dark:bg-slate-900 dark:border-slate-800"
                }`}
              >
                {/* Day Header */}
                <div className="text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none block">
                    {day.toLocaleDateString(language === "hi" ? "hi-IN" : "en-US", { weekday: "short" })}
                  </span>
                  <span className={`text-xs font-black block mt-0.5 leading-none ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Overdue/Pending count dots */}
                <div className="flex gap-1 flex-wrap justify-center min-h-[12px] mt-1.5">
                  {tasksDue.map(t => (
                    <span 
                      key={t.id} 
                      title={`${t.title} (${t.category})`}
                      className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-300 opacity-60' : getCategoryColor(t.category)}`}
                    />
                  ))}
                  {tasksDue.length === 0 && (
                    <span className="text-[9px] text-slate-300 dark:text-slate-700 italic">-</span>
                  )}
                </div>

                {/* Tiny Badge */}
                {tasksDue.length > 0 && (
                  <span className="text-[8px] bg-white dark:bg-slate-900 border px-1 rounded-full font-extrabold mt-1">
                    {tasksDue.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Schedule Blocking Block */}
      <div id="hourly-schedule-block" className="bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        
        {/* Header and Toggle Configurations */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              {t("hourlyDailySchedule")}
            </h3>
            <p className="text-[11px] text-slate-500">
              {t("scheduleDescription")}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-schedule-config"
              onClick={() => setShowConfig(!showConfig)}
              className="px-2 py-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
            >
              {t("dailySettings")}
            </button>
            <button
              id="btn-generate-schedule"
              onClick={onTriggerGenerateSchedule}
              disabled={isScheduling || tasks.filter(t => t.status !== 'completed').length === 0}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition cursor-pointer"
            >
              {isScheduling ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {t("aiGenerateSchedule")}
            </button>
          </div>
        </div>

        {/* Collapsible config sliders */}
        {showConfig && (
          <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">{t("wakeUpTime")}</label>
                <input 
                  type="time" 
                  value={localWake} 
                  onChange={(e) => setLocalWake(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">{t("bedtime")}</label>
                <input 
                  type="time" 
                  value={localSleep} 
                  onChange={(e) => setLocalSleep(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">{t("dailyFocusPreferences")}</label>
              <input 
                type="text" 
                value={localPref} 
                onChange={(e) => setLocalPref(e.target.value)}
                placeholder={t("focusPrefPlaceholder")}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-1.5">
              <button 
                onClick={() => setShowConfig(false)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button 
                onClick={handleSaveConfig}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {t("saveSettings")}
              </button>
            </div>
          </div>
        )}

        {/* Timeline representation of time blocks */}
        {timeBlocks.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center px-4">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs text-slate-400 font-medium block">{t("noTimeBlocks")}</span>
          </div>
        ) : (
          <div className="space-y-3 pl-2.5 border-l-2 border-indigo-100 dark:border-indigo-900/60 ml-1.5">
            {timeBlocks.map((block) => {
              const getActivityTypeLabel = (type: string) => {
                if (language === "hi") {
                  switch (type) {
                    case "focus": return "गहन फोकस";
                    case "meeting": return "बैठक / सिंक";
                    case "break": return "विराम / आराम";
                    case "admin": return "एडमिन / अन्य";
                    case "leisure": return "मनोरंजन / खाली समय";
                    default: return type;
                  }
                }
                return type;
              };

              return (
                <motion.div 
                  key={block.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative flex gap-4 text-xs"
                >
                  {/* Circle Marker */}
                  <div className="absolute -left-[16px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-950 shadow-sm" />

                  {/* Time range */}
                  <div className="w-24 shrink-0 text-slate-400 font-mono font-bold pt-0.5 select-none">
                    {block.time}
                  </div>

                  {/* Action details */}
                  <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {block.taskTitle}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase scale-90 ${getActivityBadgeColor(block.activityType)}`}>
                        {getActivityTypeLabel(block.activityType)}
                      </span>
                    </div>
                    {block.description && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal italic">
                        {block.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
