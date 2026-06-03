import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Auth, Users, extractToken, getToken, setToken } from "./api";

interface AuthUser {
  id?: string;
  fullName?: string;
  email?: string;
  [k: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const data = await Users.me();
      setUser(data as AuthUser);
    } catch {
      setToken(null);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (getToken()) {
        await refreshUser();
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await Auth.login({ email, password });
    const tk = extractToken(res);
    if (!tk) throw new Error("Token não retornado pela API");
    setToken(tk);
    setTokenState(tk);
    try {
      const me = await Users.me();
      setUser(me as AuthUser);
    } catch {
      setUser({ email });
    }
  }, []);

  const register = useCallback(
    async (input: { fullName: string; email: string; password: string; confirmPassword: string }) => {
      await Auth.register(input);
      await login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
