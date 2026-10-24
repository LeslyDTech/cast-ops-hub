import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Who is using the app. Phase 1: a self-reported name kept on this device.
 * Phase 3 SSO replaces this provider with one that reads the signed-in user;
 * components keep calling useActor() and never learn the difference.
 */
interface ActorContextValue {
  name: string;
  setName: (name: string) => void;
}

const STORAGE_KEY = "cast-ops-hub.actor-name";
const ActorContext = createContext<ActorContextValue | null>(null);

// Storage can be unavailable (private mode, blocked site data); the app must still work.
function readStoredName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ActorProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState(readStoredName);

  const setName = useCallback((next: string) => {
    setNameState(next);
    try {
      if (next.trim()) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Not persisted; still works for this session.
    }
  }, []);

  const value = useMemo(() => ({ name, setName }), [name, setName]);
  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor(): ActorContextValue {
  const ctx = useContext(ActorContext);
  if (!ctx) throw new Error("useActor must be used inside <ActorProvider>");
  return ctx;
}

export const ACTOR_NAME_MAX = 80;
