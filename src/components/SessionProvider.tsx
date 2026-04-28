'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface SessionContextType {
  session: User | null;
  loading: boolean;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
  refresh: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}
