import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getToken as loadToken, setToken as persistToken, removeToken as clearToken } from '../lib/storage';

type Role = 'admin' | 'cashier';

type User = { _id: string; email: string; name: string; role: Role } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  permissions: string[];
  login: (email: string, password: string) => Promise<NonNullable<User>>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await loadToken();
      if (cancelled) return;
      setToken(t);
      if (!t) { setLoading(false); return; }
      try {
        const res = await api.me();
        if (!cancelled) setUser(res.user as User);
        // Derivar permisos desde roles
        try {
          const rolesRes = await api.listRoles();
          const roleId = (res.user as any)?.roleId ? String((res.user as any).roleId) : null;
          const role = rolesRes.roles?.find((r: any) => String(r._id) === roleId);
          const basePerms: string[] = Array.isArray(role?.permissions) ? role.permissions : [];
          const finalPerms = new Set<string>(basePerms);
          // Alias de ventas para compatibilidad del front: si tiene sales:create o es cashier, añade 'sell'
          if (finalPerms.has('sales:create') || (res.user as any)?.role === 'cashier') finalPerms.add('sell');
          if (!cancelled) setPermissions(Array.from(finalPerms));
        } catch {
          if (!cancelled) {
            const isCashier = (res.user as any)?.role === 'cashier';
            setPermissions(isCashier ? ['sell'] : []);
          }
        }
      } catch {
        try { await clearToken(); } catch {}
        if (!cancelled) { setToken(null); setUser(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    await persistToken(res.token);
    setToken(res.token);
    setUser(res.user as User);
    // Cargar permisos tras login
    try {
      const rolesRes = await api.listRoles();
      const roleId = (res.user as any)?.roleId ? String((res.user as any).roleId) : null;
      const role = rolesRes.roles?.find((r: any) => String(r._id) === roleId);
  const basePerms: string[] = Array.isArray(role?.permissions) ? role.permissions : [];
  const finalPerms = new Set<string>(basePerms);
  if (finalPerms.has('sales:create') || (res.user as any)?.role === 'cashier') finalPerms.add('sell');
  setPermissions(Array.from(finalPerms));
    } catch {
  setPermissions((res.user as any)?.role === 'cashier' ? ['sell'] : []);
    }
    return res.user as NonNullable<User>;
  };

  const logout = () => {
    try { clearToken(); } catch {}
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  const value = useMemo(() => ({ user, token, loading, permissions, login, logout }), [user, token, loading, permissions]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
