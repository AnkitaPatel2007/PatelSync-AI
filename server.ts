import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Global configuration
const PORT = 3000;
const app = express();

app.use(express.json());

// Safe initialization of GoogleGenAI to prevent startup crashes when the key is not set
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it via Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. Intelligent Task Prioritization
app.post("/api/prioritize", async (req: Request, res: Response) => {
  try {
    const { tasks, context } = req.body;
    const ai = getAI();

    const todayStr = new Date().toISOString().split('T')[0];

    const prompt = `You are a world-class executive coach and cognitive behavioral therapist specializing in productivity, time management, and chronic procrastination.
Analyze the following list of tasks for the user. Today's date is ${todayStr}.
User Context: "${context || 'No specific context provided'}"

For each task, assign an optimal priority (Eisenhower Matrix category), a difficulty score (1-100), an impact score (1-100), and a brief, highly motivating action-oriented explanation of WHY this priority fits and HOW they can beat initial inertia.

List of tasks to evaluate:
${JSON.stringify(tasks, null, 2)}

Ensure the output matches the required JSON structure precisely. Be extremely encouraging, highly realistic about human cognitive load, and smart about minimizing fatigue.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "The matching task id" },
                  priority: { 
                    type: Type.STRING, 
                    description: "Must be exactly one of: urgent_important, important_not_urgent, urgent_not_important, not_urgent_not_important" 
                  },
                  aiDifficulty: { type: Type.INTEGER, description: "Rating from 1 (breeze) to 100 (daunting/draining)" },
                  aiImpactScore: { type: Type.INTEGER, description: "Rating from 1 (negligible) to 100 (life-changing or high-stake)" },
                  reasoning: { type: Type.STRING, description: "Empathetic, clear, and actionable advice to start this specific task." }
                },
                required: ["id", "priority", "aiDifficulty", "aiImpactScore", "reasoning"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Empty response from AI");
    }

    res.json(JSON.parse(textResult.trim()));
  } catch (error: any) {
    console.error("Prioritization error:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks." });
  }
});

// 2. AI-Powered Scheduling Assistance
app.post("/api/schedule", async (req: Request, res: Response) => {
  try {
    const { tasks, wakeTime, sleepTime, focusPreferences } = req.body;
    const ai = getAI();

    const todayStr = new Date().toISOString().split('T')[0];

    const prompt = `You are an AI-powered scheduler. Given a user's tasks, sleep cycle, and core focus preferences, create a hyper-realistic hourly daily time block schedule.
Today is ${todayStr}.
Wake time: ${wakeTime || "07:00"}
Sleep time: ${sleepTime || "23:00"}
Focus preference / energy peaks: "${focusPreferences || "Maximize deep focus in the morning"}"

Active Tasks:
${JSON.stringify(tasks, null, 2)}

Create scheduling blocks for the user's active tasks while keeping room for breaks, leisure, and routine tasks.
We want to prevent burnout! Do not pack high-focus tasks back-to-back without breaks. If they have bills, assign a small "admin block" of 15-30 minutes rather than a full day.
Ensure all block time spans fit between the wake time and sleep time. Make the description for each block clear, proactive, and focused.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "Time span, e.g. '08:30 - 09:30'" },
                  taskTitle: { type: Type.STRING, description: "Task title, or break name, or leisure activity name" },
                  activityType: { 
                    type: Type.STRING, 
                    description: "Must be exactly one of: focus, meeting, break, admin, leisure, routine" 
                  },
                  description: { type: Type.STRING, description: "Brief instructions to reduce friction, e.g., 'Turn off your phone, set a 25min timer, and read the first 5 pages.'" }
                },
                required: ["time", "taskTitle", "activityType", "description"]
              }
            }
          },
          required: ["blocks"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Empty response from AI");
    }

    res.json(JSON.parse(textResult.trim()));
  } catch (error: any) {
    console.error("Scheduling error:", error);
    res.status(500).json({ error: error.message || "Failed to generate schedule." });
  }
});

// 3. Personalized Productivity Recommendations & Dynamic Nudges
app.post("/api/recommend", async (req: Request, res: Response) => {
  try {
    const { tasks, habits, goals } = req.body;
    const ai = getAI();

    const prompt = `You are a productivity expert. Analyze the user's current productivity state based on their commitments, goals, and habits:
Tasks: ${JSON.stringify(tasks, null, 2)}
Habits: ${JSON.stringify(habits, null, 2)}
Goals: ${JSON.stringify(goals, null, 2)}

Generate a personalized performance analysis that is honest, compassionate, and highly helpful.
Produce 3 specific, targeted recommendations/nudges based on their profile.
Make sure to classify each recommendation into one of the categories:
- 'time_blocking'
- 'energy_management'
- 'focus_hack'
- 'inertia_breaker' (specifically designed to break procrastination or start a daunting task with very low friction)

Select realistic impact levels ('high', 'medium', 'low') based on how much it helps complete pending high-stress items.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generalAnalysis: { 
              type: Type.STRING, 
              description: "A short, expert paragraph giving feedback, highlighting successes or addressing overcommitment and fatigue." 
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Title of the tip" },
                  description: { type: Type.STRING, description: "Highly actionable, precise instruction (e.g. 'Move your math task to 10 AM, immediately after breakfast')" },
                  impact: { type: Type.STRING, description: "high, medium, or low" },
                  category: { type: Type.STRING, description: "time_blocking, energy_management, focus_hack, or inertia_breaker" }
                },
                required: ["title", "description", "impact", "category"]
              }
            }
          },
          required: ["generalAnalysis", "recommendations"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Empty response from AI");
    }

    res.json(JSON.parse(textResult.trim()));
  } catch (error: any) {
    console.error("Recommendations error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommendations." });
  }
});

// 4. Autonomous Task Planning & Step-by-Step Breakdown
app.post("/api/plan-task", async (req: Request, res: Response) => {
  try {
    const { taskTitle, taskDescription } = req.body;
    const ai = getAI();

    const prompt = `You are an autonomous planner. Break down the following task into highly actionable, manageable, chronological sub-steps to lower cognitive resistance:
Task Title: "${taskTitle}"
Description: "${taskDescription || "No detailed description provided."}"

Decompose this task into 3 to 6 logical steps. Assign a realistic duration (in minutes) for each step and add a highly practical, stress-reducing tip for each.
Estimate an overall difficulty (1-100) and impact score (1-100) for the primary task.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            difficulty: { type: Type.INTEGER, description: "Difficulty rating (1-100)" },
            impactScore: { type: Type.INTEGER, description: "Impact rating (1-100)" },
            actionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.STRING, description: "Action step title, e.g., 'Gather 3 reference designs'" },
                  minutes: { type: Type.INTEGER, description: "Estimated active focus duration" },
                  tip: { type: Type.STRING, description: "Tactical, small-step advice to maintain flow (e.g., 'Close all irrelevant browser tabs so you aren't tempted to look at social media')" }
                },
                required: ["step", "minutes", "tip"]
              }
            }
          },
          required: ["difficulty", "impactScore", "actionPlan"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Empty response from AI");
    }

    res.json(JSON.parse(textResult.trim()));
  } catch (error: any) {
    console.error("Task planning error:", error);
    res.status(500).json({ error: error.message || "Failed to generate task action plan." });
  }
});

// 5. Chat Assistant & Proactive Intent Extraction
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages, text, currentTasks } = req.body;
    const ai = getAI();

    const todayStr = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `You are a proactive, conversational productivity companion. You talk with the user like a highly supportive, intelligent peer.
Today's Date: ${todayStr} (${dayOfWeek})

Current active tasks:
${JSON.stringify(currentTasks || [], null, 2)}

User utterance: "${text}"

Recent conversational thread for context:
${JSON.stringify(messages || [], null, 2)}

Your responsibilities:
1. Respond to the user's input in a friendly, supportive, and clever manner. Keep responses brief, encouraging, and centered on reducing anxiety/stress and encouraging immediate execution of high-priority items.
2. If the user mentions adding a task, deadline, commitment, habit, or goal, parse their intent and extract it into the matching structured field.
   - For example: "I have a chemistry exam next Monday" -> extract a task with title "Chemistry Exam", set correct deadline (calculating based on today's date ${todayStr}), category "assignment" or "commitment".
   - "Remind me to drink water every day" -> extract a habit with title "Drink Water".
   - "My goal for the week is to run 15km" -> extract a weekly goal with title "Run 15km".
Be extremely accurate with dates. If they say "next Monday" or "tomorrow", look at today's date (${todayStr}) and do the math to provide the exact date in YYYY-MM-DD.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING, 
              description: "Conversational, empathetic, and smart reply from the assistant." 
            },
            extractedTask: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Title of the task" },
                description: { type: Type.STRING, description: "Derived details or description" },
                deadline: { type: Type.STRING, description: "Due date in YYYY-MM-DD format only." },
                category: { 
                  type: Type.STRING, 
                  description: "Must be exactly one of: assignment, meeting, bill, interview, commitment, other" 
                },
                duration: { type: Type.INTEGER, description: "Estimated duration in minutes" },
                priority: { 
                  type: Type.STRING, 
                  description: "Optional initial matrix classification. One of: urgent_important, important_not_urgent, urgent_not_important, not_urgent_not_important" 
                },
                energyLevel: { 
                  type: Type.STRING, 
                  description: "Derived energy requirement: high, medium, or low" 
                }
              }
            },
            extractedHabit: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Title of the daily habit to track" }
              }
            },
            extractedGoal: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Title of the weekly goal to track" }
              }
            }
          },
          required: ["text"]
        }
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Empty response from AI");
    }

    res.json(JSON.parse(textResult.trim()));
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat command." });
  }
});

// Configure Vite middleware in development or serve static assets in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Dev Middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving built production files from dist.");
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PatelSync AI running on http://localhost:${PORT}`);
  });
});
