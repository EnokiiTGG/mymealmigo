"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "firebase/auth";
import { db, onAuthStateChangedClient } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isNutritionist?: boolean;
};

type FirestoreUserDoc = {
  role?: string;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNutritionist, setIsNutritionist] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const unsub = onAuthStateChangedClient(async (u: User | null) => {
      if (cancelled) return;

      setUser(u);

      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (!cancelled) {
            const data = (snap.data() ?? {}) as FirestoreUserDoc;
            const role = typeof data.role === "string" ? data.role.toLowerCase() : "";
            setIsAdmin(role === "admin");
            setIsNutritionist(role === "nutritionist");
          }
        } catch {
          if (!cancelled)
            { setIsAdmin(false); setIsNutritionist(false); }
        }
      } else {
        setIsAdmin(false);
        setIsNutritionist(false);
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      try {
        unsub(); // ensure we detach the listener
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isNutritionist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
