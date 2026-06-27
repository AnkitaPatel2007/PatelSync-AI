import React, { useState, useEffect, useRef } from "react";
import { AIChatMessage, AIRecResponse, Task, Habit, WeeklyGoal } from "../types";
import { 
  Sparkles, Send, Mic, MicOff, Brain, Volume2, AlertCircle, CheckCircle, Clock, Check, Loader2, Play, Power, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../LanguageContext";

interface CoPilotProps {
  tasks: Task[];
  habits: Habit[];
  goals: WeeklyGoal[];
  onAddExtractedTask: (task: any) => void;
  onAddExtractedHabit: (habitTitle: string) => void;
  onAddExtractedGoal: (goalTitle: string) => void;
  recommendationData: AIRecResponse | null;
  onRefreshRecommendations: () => Promise<void>;
  isRecommending: boolean;
}

export default function CoPilot({
  tasks,
  habits,
  goals,
  onAddExtractedTask,
  onAddExtractedHabit,
  onAddExtractedGoal,
  recommendationData,
  onRefreshRecommendations,
  isRecommending
}: CoPilotProps) {
  const { t, language } = useLanguage();
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Micro Focus Session / Inertia Breaker state
  const [activeFocusSession, setActiveFocusSession] = useState<{ stepName: string; duration: number } | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and synchronize chat history when language changes
  useEffect(() => {
    setChatHistory([
      { 
        sender: 'assistant', 
        text: language === "hi" 
          ? "नमस्ते! मैं आपका पटेलसिंक एआई (PatelSync AI) साथी हूँ। आप यहाँ कुछ लिख सकते हैं या बोलने के लिए माइक पर क्लिक कर सकते हैं, जैसे: 'कल सुबह १० बजे रसायन शास्त्र की तैयारी की बैठक जोड़ें' या 'मुझे बिजली बिलों के भुगतान को लेकर तनाव है'। मैं आपके शेड्यूल को व्यवस्थित करने में मदद करूँगा!" 
          : "Hey! I'm your PatelSync AI Companion. You can type or click the Mic to say something like: 'Add an assignment due next Friday called Chemistry Prep' or 'I am feeling overwhelmed with bills'. I can automatically manage your schedule!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ]);
  }, [language]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "hi" ? 'hi-IN' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => (prev ? prev + " " + transcript : transcript));
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setSpeechError(language === "hi" ? `आवाज त्रुटि: ${event.error}` : `Speech error: ${event.error}`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not fully supported in this browser environment. Try typing instead!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Chat message submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg: AIChatMessage = {
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          text: userMsg.text,
          currentTasks: tasks
        })
      });

      if (!res.ok) throw new Error("Chat assistant response failed");
      const data = await res.json();

      const botMsg: AIChatMessage = {
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistory(prev => [...prev, botMsg]);

      // Proactive Auto-Extraction interceptors
      if (data.extractedTask) {
        onAddExtractedTask(data.extractedTask);
        setChatHistory(prev => [...prev, {
          sender: 'assistant',
          text: language === "hi" 
            ? `⚡ स्वतः जोड़ा गया: मैंने आपके फोकस स्टैक में ${data.extractedTask.deadline || "इसकी नियत तारीख"} पर पूरा होने वाला एक महत्वपूर्ण कार्य "${data.extractedTask.title}" स्वचालित रूप से जोड़ दिया है! अपने कार्य सूची की जाँच करें।`
            : `⚡ Proactive Action: I automatically scheduled "${data.extractedTask.title}" as a high-impact task due on ${data.extractedTask.deadline || "its assigned deadline"}. Check your Focus Stack!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }

      if (data.extractedHabit) {
        onAddExtractedHabit(data.extractedHabit.title);
        setChatHistory(prev => [...prev, {
          sender: 'assistant',
          text: language === "hi"
            ? `⚡ स्वतः जोड़ा गया: मैंने आपकी दैनिक आदत "${data.extractedHabit.title}" को आदतों और रूटीन के तहत जोड़ दिया है। अपने सिलसिले को बनाए रखें!`
            : `⚡ Proactive Action: I've added a daily tracker for your habit "${data.extractedHabit.title}" under Habits & Routines. Maintain your streak!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }

      if (data.extractedGoal) {
        onAddExtractedGoal(data.extractedGoal.title);
        setChatHistory(prev => [...prev, {
          sender: 'assistant',
          text: language === "hi"
            ? `⚡ स्वतः जोड़ा गया: मैंने आपके साप्ताहिक मील के पत्थर "${data.extractedGoal.title}" को ट्रैक करने के लिए लक्ष्यों की सूची में जोड़ दिया है।`
            : `⚡ Proactive Action: I've listed your weekly milestone "${data.extractedGoal.title}" under Milestones for tracking.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }

    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        sender: 'assistant',
        text: language === "hi" 
          ? "मुझे इस अनुरोध को संसाधित करने में समस्या हुई। कृपया सुनिश्चित करें कि जेमिनी एपीआई कुंजी कॉन्फ़िगर की गई है।" 
          : "I had trouble processing that request. Please ensure the Gemini API key is configured.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Inertia Breaker focus session clock
  const launchInertiaBreaker = (stepName: string, durationMinutes: number) => {
    setActiveFocusSession({ stepName, duration: durationMinutes });
    setTimerSeconds(durationMinutes * 60);
    setTimerRunning(true);
  };

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            alert(`Inertia Broken! Great job focusing on: "${activeFocusSession?.stepName}"!`);
            setActiveFocusSession(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerSeconds, activeFocusSession]);

  const toggleTimer = () => {
    setTimerRunning(!timerRunning);
    if (timerRunning && timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="copilot-container" className="space-y-6">

      {/* Inertia Breaker Active Session Guided Box */}
      {activeFocusSession && (
        <motion.div 
          id="inertia-session-box"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-4 shadow-xl border border-indigo-500/30 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
              {t("activeGuidedFocus")}
            </span>
            <button 
              onClick={() => { setActiveFocusSession(null); setTimerRunning(false); }}
              className="text-xs hover:text-indigo-200 opacity-60 font-bold cursor-pointer"
            >
              {language === "hi" ? "बंद करें" : "Close"}
            </button>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold leading-tight">{activeFocusSession.stepName}</h4>
            <p className="text-[11px] text-indigo-300">{t("guidedFocusSubtitle")}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                timerRunning 
                ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {timerRunning ? t("pause") : t("resume")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Personalized Advice & Performance recommendations */}
      <div id="recommendations-box" className="bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-violet-500" />
              {t("aiDailyCoach")}
            </h3>
            <p className="text-[11px] text-slate-400">{t("coachSubtitle")}</p>
          </div>
          <button
            id="btn-refresh-recs"
            onClick={onRefreshRecommendations}
            disabled={isRecommending || tasks.length === 0}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 border px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 disabled:opacity-50 transition cursor-pointer"
          >
            {isRecommending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-500" />}
            {language === "hi" ? "सलाह ताज़ा करें" : "Refresh Advice"}
          </button>
        </div>

        {/* Inertia Breakers panel: Clickable Prompts derived from urgent, active tasks */}
        {tasks.filter(t => t.status !== 'completed').slice(0, 2).length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              {t("readyToStart")}
            </span>
            <div className="flex flex-col gap-2">
              {tasks.filter(t => t.status !== 'completed').slice(0, 2).map((t, index) => {
                const triggerStep = t.subtasks.find(s => !s.completed)?.title || `Open details for "${t.title}"`;
                return (
                  <button
                    key={t.id}
                    onClick={() => launchInertiaBreaker(`Micro-step: ${triggerStep}`, Math.min(t.duration, 15))}
                    className="flex items-center justify-between text-left px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition text-[11px] shadow-xs cursor-pointer"
                  >
                    <div className="space-y-0.5 pr-2 truncate">
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold block uppercase tracking-wide text-[9px]">
                        {language === "hi" ? `संकेत ${index + 1}: केवल १० मिनट करें` : `Nudge ${index + 1}: Just do 10 minutes`}
                      </span>
                      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{triggerStep}</p>
                    </div>
                    <span className="p-1 rounded bg-indigo-600 text-white font-bold text-[10px] flex items-center shrink-0">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Feedback block */}
        {recommendationData ? (
          <div className="space-y-3.5 pt-2">
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              {recommendationData.generalAnalysis}
            </p>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                {language === "hi" ? "व्यवहार संबंधी सिफारिशें" : "Behavioral Recommendations"}
              </span>
              <div className="space-y-2.5">
                {recommendationData.recommendations.map((rec, idx) => (
                  <div 
                    key={idx} 
                    className="border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-xl space-y-1 bg-white dark:bg-slate-900 hover:border-slate-300 transition shadow-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {rec.title}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                        rec.impact === 'high' 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {rec.impact === "high" ? t("high") : t("medium")} {language === "hi" ? "प्रभाव" : "Impact"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs italic">
            {t("recommendationsPlaceholder")}
          </div>
        )}
      </div>

      {/* Voice-Enabled & Chat Copilot */}
      <div id="voice-chat-copilot" className="bg-slate-50/30 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-[350px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-indigo-500" />
            {t("voiceAssistantChat")}
          </h3>
          <span className="inline-flex items-center gap-1 text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
            {t("voiceCommandsReady")}
          </span>
        </div>

        {/* Chat window viewport */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className={`p-2.5 rounded-2xl leading-relaxed font-medium ${
                msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-800/40 shadow-xs'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.timestamp}</span>
            </div>
          ))}
          {isChatting && (
            <div className="flex items-center gap-1 text-slate-400 italic">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{language === "hi" ? "सोच रहा हूँ..." : "Thinking..."}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Speech Dictation and Input field */}
        <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {speechError && (
            <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-1 rounded border border-rose-100">
              {speechError}
            </div>
          )}
          <div className="flex gap-1.5">
            <button
              id="btn-voice-dictate"
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isListening 
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
              }`}
              title={isListening ? (language === "hi" ? "सुन रहा हूँ... रोकने के लिए क्लिक करें" : "Listening... click to stop") : (language === "hi" ? "माइक डिक्टेशन का उपयोग करें" : "Use microphone dictation")}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("chatPlaceholder")}
              className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatting}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
