import React, { useState, useMemo } from "react";
import { Task } from "../types";
import { useLanguage } from "../LanguageContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { BarChart3, TrendingUp, Calendar, Zap, Clock } from "lucide-react";

interface ProductivityChartProps {
  tasks: Task[];
}

export default function ProductivityChart({ tasks }: ProductivityChartProps) {
  const { t, language } = useLanguage();
  const [activeMetric, setActiveMetric] = useState<"both" | "tasks" | "minutes">("both");

  // Get the last 7 days' data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    // Generate last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD

      // Format localized day name and short date
      let dayName = "";
      let formattedDate = "";
      
      if (language === "hi") {
        const daysHi = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
        dayName = daysHi[d.getDay()];
        formattedDate = `${d.getDate()} ${["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"][d.getMonth()]}`;
      } else {
        const daysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        dayName = daysEn[d.getDay()];
        formattedDate = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      }

      // Filter tasks completed on this specific day
      const completedOnDay = tasks.filter((task) => {
        if (task.status !== "completed" || !task.completedAt) return false;
        const compDateStr = task.completedAt.split("T")[0];
        return compDateStr === dateString;
      });

      // Aggregate tasks count and focus duration (minutes)
      const tasksCount = completedOnDay.length;
      const totalMinutes = completedOnDay.reduce((acc, task) => acc + (task.duration || 30), 0);

      data.push({
        date: dateString,
        dayLabel: dayName,
        dateLabel: formattedDate,
        tasks: tasksCount,
        minutes: totalMinutes,
      });
    }

    return data;
  }, [tasks, language]);

  // Compute summary stats for the last 7 days
  const summaryStats = useMemo(() => {
    const totalCompleted = chartData.reduce((acc, curr) => acc + curr.tasks, 0);
    const totalMinutes = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
    const averageMinutesPerDay = Math.round(totalMinutes / 7);
    const peakDay = [...chartData].sort((a, b) => b.tasks - a.tasks)[0];

    return {
      totalCompleted,
      totalMinutes,
      averageMinutesPerDay,
      peakDayLabel: peakDay && peakDay.tasks > 0 ? `${peakDay.dayLabel} (${peakDay.tasks})` : "-",
    };
  }, [chartData]);

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayData = payload[0].payload;
      return (
        <div id="recharts-tooltip" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1.5 font-sans">
          <p className="font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800/60 pb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{dayData.dateLabel} ({dayData.dayLabel})</span>
          </p>
          {payload.map((pld: any, index: number) => (
            <div key={index} className="flex items-center gap-4 justify-between font-semibold mt-1">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
                {pld.name === "tasks" ? t("tasksCompletedLabel") || "Tasks Completed" : t("focusMinutesLabel") || "Focus Minutes"}
              </span>
              <span className="text-slate-900 dark:text-white font-bold font-mono">
                {pld.value} {pld.name === "minutes" ? (language === "hi" ? "मिनट" : "mins") : ""}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="productivity-trend-card" className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              {t("productivityTrendTitle") || "Weekly Productivity Trend"}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3 animate-pulse" />
                7 {language === "hi" ? "दिन" : "Days"}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {t("productivityTrendSub") || "Visualizing task completion & focus hours over the last 7 days"}
            </p>
          </div>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/30 self-start sm:self-center">
          <button
            onClick={() => setActiveMetric("both")}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMetric === "both"
                ? "bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {language === "hi" ? "दोनों" : "Both"}
          </button>
          <button
            onClick={() => setActiveMetric("tasks")}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMetric === "tasks"
                ? "bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t("completedTasks") || "Tasks"}
          </button>
          <button
            onClick={() => setActiveMetric("minutes")}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeMetric === "minutes"
                ? "bg-white text-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t("focusMinutes") || "Focus Time"}
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 mb-6">
        <div>
          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
            {language === "hi" ? "कुल पूरे कार्य" : "Total Completed"}
          </span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block mt-0.5 font-mono">
            {summaryStats.totalCompleted}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
            {language === "hi" ? "कुल फोकस मिनट" : "Total Focus Time"}
          </span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block mt-0.5 font-mono">
            {summaryStats.totalMinutes} <span className="text-xs font-bold text-slate-400 uppercase">{language === "hi" ? "मिनट" : "min"}</span>
          </span>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
            {language === "hi" ? "दैनिक औसत" : "Daily Average"}
          </span>
          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block mt-0.5 font-mono">
            {summaryStats.averageMinutesPerDay} <span className="text-xs font-bold text-slate-400 uppercase">{language === "hi" ? "मिनट" : "min"}</span>
          </span>
        </div>
        <div>
          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
            {language === "hi" ? "सर्वश्रेष्ठ दिन" : "Peak Day"}
          </span>
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-1 font-sans truncate">
            {summaryStats.peakDayLabel}
          </span>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Soft purple/indigo gradients for Area */}
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800/40"
            />

            <XAxis
              dataKey="dayLabel"
              tickLine={false}
              axisLine={false}
              dy={10}
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
            />

            {/* Dynamic Y-Axes depending on active metric */}
            {(activeMetric === "both" || activeMetric === "tasks") && (
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                dx={-5}
                allowDecimals={false}
                tick={{ fill: "#4f46e5", fontSize: 10, fontWeight: 700 }}
              />
            )}

            {(activeMetric === "both" || activeMetric === "minutes") && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                dx={5}
                tick={{ fill: "#10b981", fontSize: 10, fontWeight: 700 }}
              />
            )}

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />

            {/* Chart Area Layers */}
            {(activeMetric === "both" || activeMetric === "tasks") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="tasks"
                name="tasks"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTasks)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }}
              />
            )}

            {(activeMetric === "both" || activeMetric === "minutes") && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="minutes"
                name="minutes"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 1.5, fill: "#ffffff", stroke: "#10b981" }}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#10b981" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Decorative prompt lines */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          {language === "hi" ? "ताजा आंकड़े स्व-अपडेटेड हैं" : "Real-time updates auto-sync"}
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
          {language === "hi" ? "शानदार गति बनाएं रखें!" : "Keep up the momentum!"}
        </span>
      </div>

    </div>
  );
}
