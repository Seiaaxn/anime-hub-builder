import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, signInWithPopup, type User } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

type Ctx = {
  user: User | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  loading: true,
  signInGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user,
        loading,
        signInGoogle: async () => {
          await signInWithPopup(auth, googleProvider);
        },
        logout: async () => {
          await signOut(auth);
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
