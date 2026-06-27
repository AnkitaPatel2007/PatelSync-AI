import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  wakeTime?: string;
  sleepTime?: string;
  focusPreferences?: string;
}

interface AuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (wake: string, sleep: string, pref: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile in Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // Create user document if it doesn't exist
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "User",
              wakeTime: "07:00",
              sleepTime: "23:00",
              focusPreferences: "Maximize focus in the morning, review bills in the afternoon"
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      // Update display name in Firebase Auth profile
      await updateProfile(currentUser, { displayName });

      // Create profile document in Firestore
      const userDocRef = doc(db, "users", currentUser.uid);
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: displayName,
        wakeTime: "07:00",
        sleepTime: "23:00",
        focusPreferences: "Maximize focus in the morning, review bills in the afternoon"
      };
      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "User",
          wakeTime: "07:00",
          sleepTime: "23:00",
          focusPreferences: "Maximize focus in the morning, review bills in the afternoon"
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const currentUser = userCredential.user;
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "User",
          wakeTime: "07:00",
          sleepTime: "23:00",
          focusPreferences: "Maximize focus in the morning, review bills in the afternoon"
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGithub = async () => {
    setLoading(true);
    try {
      const provider = new GithubAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const currentUser = userCredential.user;
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || "User",
          wakeTime: "07:00",
          sleepTime: "23:00",
          focusPreferences: "Maximize focus in the morning, review bills in the afternoon"
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (wake: string, sleep: string, pref: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const updatedProfile = {
        ...userProfile,
        uid: user.uid,
        email: user.email || "",
        displayName: userProfile?.displayName || user.displayName || "User",
        wakeTime: wake,
        sleepTime: sleep,
        focusPreferences: pref
      };
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signup, login, loginWithGoogle, loginWithGithub, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
