import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types/models';
import * as authService from '../services/authService';
import type { RegisterInput } from '../services/authService';

type AuthContextValue = {
  user: User | null;
  /** True while the persisted session is being restored on app launch. */
  initializing: boolean;
  register: (input: RegisterInput) => Promise<User>;
  signIn: (identifier: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .finally(() => setInitializing(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      register: async (input) => {
        const created = await authService.register(input);
        setUser(created);
        return created;
      },
      signIn: async (identifier, password) => {
        const signedIn = await authService.signIn(identifier, password);
        setUser(signedIn);
        return signedIn;
      },
      signOut: async () => {
        await authService.signOut();
        setUser(null);
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
