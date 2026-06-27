import React, { useState } from "react";
import { Task, CategoryType, PriorityType, SubTask } from "../types";
import { 
  Sparkles, Plus, Trash2, Calendar, Clock, BookOpen, 
  DollarSign, Briefcase, MessageSquare, ListTodo, AlertTriangle, Check, CheckCircle, Circle, Loader2, Search 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'subtasks'> & { subtasks: string[] }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onTriggerPrioritize: () => Promise<void>;
  isPrioritizing: boolean;
}

export default function TaskBoard({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onTriggerPrioritize,
  isPrioritizing 
}: TaskBoardProps) {
  const { t, language } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [newDuration, setNewDuration] = useState(30);
  const [newCategory, setNewCategory] = useState<CategoryType>("assignment");
  const [newEnergy, setNewEnergy] = useState<'high' | 'medium' | 'low'>("medium");
  const [newPriority, setNewPriority] = useState<PriorityType>("important_not_urgent");
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [planningTaskId, setPlanningTaskId] = useState<string | null>(null);

  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper icons for categories
  const getCategoryIcon = (category: CategoryType) => {
    switch (category) {
      case "assignment": return <BookOpen id="icon-book" className="w-4 h-4 text-emerald-500" />;
      case "bill": return <DollarSign id="icon-dollar" className="w-4 h-4 text-amber-500" />;
      case "interview": return <Briefcase id="icon-briefcase" className="w-4 h-4 text-indigo-500" />;
      case "meeting": return <Clock id="icon-clock" className="w-4 h-4 text-sky-500" />;
      case "commitment": return <MessageSquare id="icon-message" className="w-4 h-4 text-violet-500" />;
      default: return <ListTodo id="icon-todo" className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPriorityLabel = (priority: PriorityType) => {
    switch (priority) {
      case "urgent_important": return t("doFirst");
      case "important_not_urgent": return t("schedule");
      case "urgent_not_important": return t("doQuickly");
      case "not_urgent_not_important": return t("backlog");
    }
  };

  const getPriorityClass = (priority: PriorityType) => {
    switch (priority) {
      case "urgent_important": return "bg-slate-50/40 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 border-t-2 border-t-rose-500 shadow-sm";
      case "important_not_urgent": return "bg-slate-50/40 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 border-t-2 border-t-emerald-500 shadow-sm";
      case "urgent_not_important": return "bg-slate-50/40 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 border-t-2 border-t-amber-500 shadow-sm";
      case "not_urgent_not_important": return "bg-slate-50/40 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 border-t-2 border-t-slate-400 shadow-sm";
    }
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle,
      description: newDescription,
      deadline: newDeadline,
      duration: Number(newDuration) || 30,
      category: newCategory,
      energyLevel: newEnergy,
      priority: newPriority,
      status: "pending",
      subtasks: newSubtasks
    });

    // Reset Form
    setNewTitle("");
    setNewDescription("");
    setNewDeadline(new Date().toISOString().split('T')[0]);
    setNewDuration(30);
    setNewCategory("assignment");
    setNewEnergy("medium");
    setNewPriority("important_not_urgent");
    setNewSubtasks([]);
    setSubtaskInput("");
    setShowAddForm(false);
  };

  const addSubtaskToList = () => {
    if (subtaskInput.trim()) {
      setNewSubtasks([...newSubtasks, subtaskInput.trim()]);
      setSubtaskInput("");
    }
  };

  const removeSubtaskFromList = (index: number) => {
    setNewSubtasks(newSubtasks.filter((_, i) => i !== index));
  };

  const handleToggleSubtask = (task: Task, subId: string) => {
    const updatedSubtasks = task.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks
    });
  };

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    onUpdateTask({
      ...task,
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined
    });
  };

  // Autonomous Task Planner: Queries Gemini to decompose a task into active sub-steps
  const generateAutonomousPlan = async (task: Task) => {
    try {
      setPlanningTaskId(task.id);
      const res = await fetch("/api/plan-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle: task.title, taskDescription: task.description })
      });

      if (!res.ok) throw new Error("Plan generation failed");
      const data = await res.json();

      // Decompose subtasks from AI response
      const generatedSubtasks: SubTask[] = data.actionPlan.map((p: any, idx: number) => ({
        id: `${task.id}_gen_${idx}`,
        title: `${p.step} (${p.minutes} mins)`,
        completed: false
      }));

      onUpdateTask({
        ...task,
        aiDifficulty: data.difficulty,
        aiImpactScore: data.impactScore,
        aiActionPlan: data.actionPlan,
        subtasks: [...task.subtasks, ...generatedSubtasks]
      });

      setExpandedTask(task.id);
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI Action Plan. Is the Gemini API Key configured?");
    } finally {
      setPlanningTaskId(null);
    }
  };

  // Filter tasks by title if a search query is typed
  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouping tasks by priority
  const priorityGroups: Record<PriorityType, Task[]> = {
    urgent_important: [],
    important_not_urgent: [],
    urgent_not_important: [],
    not_urgent_not_important: []
  };

  filteredTasks.forEach(t => {
    if (priorityGroups[t.priority]) {
      priorityGroups[t.priority].push(t);
    } else {
      priorityGroups.important_not_urgent.push(t);
    }
  });

  const getPriorityHeadingClass = (p: PriorityType) => {
    switch (p) {
      case "urgent_important": return "text-rose-600 dark:text-rose-400";
      case "important_not_urgent": return "text-emerald-600 dark:text-emerald-400";
      case "urgent_not_important": return "text-amber-600 dark:text-amber-400";
      case "not_urgent_not_important": return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div id="task-board-container" className="space-y-6">
      {/* Header & Main Controls */}
      <div id="task-header" className="flex items-center justify-between">
        <h2 id="tasks-title" className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-indigo-500" />
          {t("myTasksPriorities")}
        </h2>
        <div id="task-actions" className="flex items-center gap-2">
          <button
            id="btn-ai-prioritize"
            onClick={onTriggerPrioritize}
            disabled={isPrioritizing || tasks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:from-violet-700 hover:to-indigo-700 transition duration-150 disabled:opacity-50"
          >
            {isPrioritizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {t("aiOrganizeTasks")}
          </button>
          <button
            id="btn-add-task-toggle"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("addNewTaskBtn")}
          </button>
        </div>
      </div>

      {/* Modern Search Bar */}
      <div id="task-search-bar-container" className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          id="task-search-field"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500 transition duration-150"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Task Creation Form (Vibrant and detailed) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            id="add-task-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAddTaskSubmit}
            className="overflow-hidden bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-xl shadow-md p-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">{t("taskName")}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t("taskNamePlaceholder")}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">{language === "hi" ? "श्रेणी" : "Category"}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="assignment">{language === "hi" ? "📚 असाइनमेंट / पढ़ाई" : "📚 Assignment / Study"}</option>
                  <option value="bill">{language === "hi" ? "💵 उपयोगिता और बिल भुगतान" : "💵 Utility & Bill Payment"}</option>
                  <option value="interview">{language === "hi" ? "💼 करियर और इंटरव्यू तैयारी" : "💼 Career & Interview Prep"}</option>
                  <option value="meeting">{language === "hi" ? "🕒 बैठक / सिंक" : "🕒 Meeting / Sync"}</option>
                  <option value="commitment">{language === "hi" ? "🤝 महत्वपूर्ण प्रतिबद्धता" : "🤝 Important Commitment"}</option>
                  <option value="other">{language === "hi" ? "📝 अन्य" : "📝 Other"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">{t("taskDesc")}</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t("taskDescPlaceholder")}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">{t("deadline")}</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">{t("durationMinutes")}</label>
                <input
                  type="number"
                  min="5"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">{t("energyLevelRequired")}</label>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high'] as const).map((energy) => (
                    <button
                      key={energy}
                      type="button"
                      onClick={() => setNewEnergy(energy)}
                      className={`flex-1 py-1 px-2 text-xs rounded-lg capitalize border font-medium cursor-pointer ${
                        newEnergy === energy 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {energy === 'low' ? t("low") : energy === 'medium' ? t("medium") : t("high")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subtask additions */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <span>{t("addSubsteps")}</span>
                <span className="text-[10px] text-indigo-500 italic">({language === "hi" ? "एआई बाद में कदम स्वतः उत्पन्न कर सकता है!" : "AI can also auto-generate steps later!"})</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder={t("substepPlaceholder")}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtaskToList())}
                />
                <button
                  type="button"
                  onClick={addSubtaskToList}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t("addStepBtn")}
                </button>
              </div>

              {newSubtasks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {newSubtasks.map((st, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[11px] font-medium"
                    >
                      {st}
                      <button 
                        type="button" 
                        onClick={() => removeSubtaskFromList(idx)}
                        className="text-slate-400 hover:text-slate-600 font-bold ml-1 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-medium hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
              >
                {language === "hi" ? "कार्य बनाएं" : "Create Task"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Eisenhower Priority Columns */}
      <div id="prioritized-columns" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {(["urgent_important", "important_not_urgent", "urgent_not_important", "not_urgent_not_important"] as PriorityType[]).map((p) => {
          const groupTasks = priorityGroups[p];

          return (
            <div 
              key={p} 
              id={`group-${p}`}
              className={`rounded-xl border p-4 transition-colors ${getPriorityClass(p)}`}
            >
              <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-100 dark:border-slate-800/35">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${getPriorityHeadingClass(p)}`}>
                  {getPriorityLabel(p)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border font-bold">
                  {groupTasks.length} {language === "hi" ? "कार्य" : (groupTasks.length === 1 ? 'task' : 'tasks')}
                </span>
              </div>

              {groupTasks.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-200/50 dark:border-slate-800/30 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-[11px] text-slate-400 font-medium">{t("noTasksInSegment")}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupTasks.map((task) => {
                    const isExpanded = expandedTask === task.id;
                    const completedSubCount = task.subtasks.filter(s => s.completed).length;
                    const totalSubCount = task.subtasks.length;

                    return (
                      <motion.div
                        id={`task-card-${task.id}`}
                        key={task.id}
                        layout="position"
                        className={`overflow-hidden p-3.5 rounded-xl border transition duration-200 hover:shadow-sm ${
                          task.status === "completed" 
                          ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/20 opacity-70" 
                          : "bg-white hover:bg-slate-50/50 dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Toggle Task Circle */}
                          <button
                            id={`btn-complete-${task.id}`}
                            onClick={() => handleToggleTaskStatus(task)}
                            className="mt-0.5 shrink-0 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                          >
                            {task.status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          {/* Task details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {getCategoryIcon(task.category)}
                              <span className={`text-sm font-semibold tracking-tight leading-tight ${
                                task.status === "completed" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-100"
                              }`}>
                                {task.title}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Info Badges Row */}
                            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {task.deadline ? task.deadline : (language === "hi" ? "कोई तारीख नहीं" : "No date")}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {task.duration}{language === "hi" ? " मिनट" : "m"}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold capitalize ${
                                task.energyLevel === "high" 
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/10 dark:text-rose-400" 
                                : task.energyLevel === "medium"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/10 dark:text-emerald-400"
                              }`}>
                                {task.energyLevel === "high" ? t("high") : task.energyLevel === "medium" ? t("medium") : t("low")} {language === "hi" ? "ऊर्जा" : "Energy"}
                              </span>

                              {/* AI Meta scores */}
                              {task.aiDifficulty !== undefined && (
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/10 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                  {language === "hi" ? "कठिनाई:" : "Difficulty:"} {task.aiDifficulty}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick delete & planning controls */}
                          <div className="flex items-center gap-1 self-start shrink-0">
                            {task.status !== "completed" && (
                              <button
                                id={`btn-plan-${task.id}`}
                                title={t("aiSmartPlannerTitle")}
                                onClick={() => generateAutonomousPlan(task)}
                                disabled={planningTaskId === task.id}
                                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition"
                              >
                                {planningTaskId === task.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              id={`btn-delete-${task.id}`}
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Subtasks and AI Action Plan details */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/45 space-y-2">
                          <div className="flex items-center justify-between">
                            <button
                              id={`btn-toggle-expand-${task.id}`}
                              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                              className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? t("hideChecklist") : t("showChecklist")}</span>
                              {totalSubCount > 0 && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-extrabold text-[10px]">
                                  {completedSubCount}/{totalSubCount}
                                </span>
                              )}
                            </button>

                            {task.aiDifficulty && !task.aiActionPlan && (
                              <span className="text-[10px] text-slate-400 italic">{t("noChecklistYet")}</span>
                            )}
                          </div>

                          {(isExpanded || task.subtasks.some(s => !s.completed)) && (
                            <div className="space-y-2.5">
                              {/* Subtasks checklist */}
                              {task.subtasks.length > 0 && (
                                <div className="space-y-1.5 pl-1.5">
                                  {task.subtasks.map((sub) => (
                                    <div 
                                      key={sub.id}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <button
                                        id={`btn-subtask-${sub.id}`}
                                        type="button"
                                        onClick={() => handleToggleSubtask(task, sub.id)}
                                        className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                      >
                                        {sub.completed ? (
                                          <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3px]" />
                                        ) : (
                                          <div className="w-3.5 h-3.5 border border-slate-300 dark:border-slate-700 rounded-sm" />
                                        )}
                                      </button>
                                      <span className={`${sub.completed ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>
                                        {sub.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* AI Action Steps */}
                              {isExpanded && task.aiActionPlan && (
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                    <Sparkles className="w-3 h-3" />
                                    <span>{t("aiSuggestedSteps")}</span>
                                  </div>
                                  <ol className="list-decimal list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-2">
                                    {task.aiActionPlan.map((stepItem, idx) => (
                                      <li key={idx} className="leading-tight pl-1">
                                        <span className="font-bold">{stepItem.step}</span> <span className="text-slate-400 font-mono">({stepItem.minutes}m)</span>
                                        <p className="text-[10px] text-slate-500 italic mt-0.5 pl-3 border-l border-indigo-200 dark:border-indigo-900">
                                          {stepItem.tip}
                                        </p>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
