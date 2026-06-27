import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { 
  Mail, Lock, User, Eye, EyeOff, ShieldCheck, Loader2, Sparkles, Github, Chrome
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AuthScreen() {
  const { login, signup, loginWithGoogle, loginWithGithub } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!email.trim() || !password) {
      setError(language === "hi" ? "कृपया सभी फ़ील्ड भरें।" : "Please fill in all fields.");
      return;
    }

    if (!isLogin) {
      if (!displayName.trim()) {
        setError(language === "hi" ? "कृपया अपना नाम भरें।" : "Please enter your name.");
        return;
      }
      if (password !== confirmPassword) {
        setError(t("passwordsDoNotMatch"));
        return;
      }
      if (password.length < 6) {
        setError(language === "hi" ? "पासवर्ड कम से कम ६ अक्षरों का होना चाहिए।" : "Password must be at least 6 characters.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Authentication failed.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        errMsg = language === "hi" 
          ? "गलत ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।" 
          : "Invalid email or password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = language === "hi"
          ? "यह ईमेल पहले से ही उपयोग में है।"
          : "This email is already in use.";
      } else if (err.code === "auth/weak-password") {
        errMsg = language === "hi"
          ? "पासवर्ड बहुत कमजोर है। कृपया ६ या अधिक अक्षरों का उपयोग करें।"
          : "Password is too weak. Please use 6 or more characters.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = language === "hi"
          ? "अमान्य ईमेल प्रारूप।"
          : "Invalid email format.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGithub();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 antialiased relative overflow-hidden font-sans">
      
      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-white rounded-full"></div>
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white block leading-none">
              {t("logoTitle")}
            </span>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5 leading-none">
              {t("smartPlanner")}
            </span>
          </div>
        </div>

        {/* Language switch */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <button
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
              language === "en"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
              language === "hi"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            हिन्दी
          </button>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center py-10 z-10">
        <div className="w-full max-w-md">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-8 shadow-sm">
            
            {/* Header section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-3">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
                {isLogin ? t("welcomeBack") : t("getStartedForFree")}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
                {isLogin ? t("loginTitle") : t("signupTitle")}
              </p>
            </div>

            {/* Error notifications */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-start gap-2"
                >
                  <span className="mt-0.5 block">⚠️</span>
                  <span className="flex-1 leading-normal">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Credentials form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field (Sign up only) */}
              <AnimatePresence initial={false}>
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-1"
                  >
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {t("fullNameLabel")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input 
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Sarah Jenkins"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white font-medium"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {t("emailLabel")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah.jenkins@example.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  {t("passwordLabel")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign up only) */}
              <AnimatePresence initial={false}>
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden space-y-1"
                  >
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      {t("confirmPasswordLabel")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white font-medium font-mono"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isLogin ? t("loggingIn") : t("signingUp")}</span>
                  </>
                ) : (
                  <span>{isLogin ? t("loginBtn") : t("signupBtn")}</span>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="relative my-4 flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200/80 dark:border-slate-800/80"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {t("orDivider")}
              </span>
              <div className="flex-grow border-t border-slate-200/80 dark:border-slate-800/80"></div>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Chrome className="w-4 h-4 text-rose-500" />
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={handleGithubLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <span>GitHub</span>
              </button>
            </div>

            {/* Toggle mode links */}
            <div className="mt-5 text-center">
              <button
                onClick={toggleAuthMode}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}
              </button>
            </div>

          </div>

          {/* Secure Badging & Guarantee */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Firebase Authentication & Cloud Storage</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider z-10 pt-4 border-t border-slate-200/30 dark:border-slate-800/30">
        <span>&copy; 2026 PatelSync AI</span>
        <span>{t("secureStorage")}</span>
      </footer>

    </div>
  );
}
