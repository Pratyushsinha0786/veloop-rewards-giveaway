import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { errorMessage } from '../api/axiosClient.ts';

export interface UserBalances {
  VES: number;
  SVES: number;
  Tokens: number;
}

export interface UserProfile {
  id: string;
  customUserId: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  balances: UserBalances;
}

export interface DemoUser {
  id: string;
  customUserId: string;
  name: string;
  role: 'user' | 'admin';
  balances: UserBalances;
}

interface AuthContextType {
  user: UserProfile | null;
  demoUsers: DemoUser[];
  unclaimedCount: number;
  loading: boolean;
  error: string | null;
  loginDemoUser: (customUserId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshWins: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [unclaimedCount, setUnclaimedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemoUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/demo-users');
      setDemoUsers(res.data.users || []);
    } catch (e) {
      console.error('Failed to load demo users:', e);
    }
  }, []);

  const refreshWins = useCallback(async () => {
    try {
      const res = await apiClient.get('/claims/mine');
      const wins = res.data.wins || [];
      const unclaimed = wins.filter((w: any) => w.status === 'UNCLAIMED').length;
      setUnclaimedCount(unclaimed);
    } catch (e) {
      // not logged in or error
      setUnclaimedCount(0);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data.user);
      await refreshWins();
    } catch (e) {
      console.warn('refreshUser error:', errorMessage(e));
    }
  }, [refreshWins]);

  const loginDemoUser = useCallback(async (customUserId: string) => {
    try {
      setError(null);
      const res = await apiClient.post('/auth/login', { customUserId });
      const { token, user: loggedUser } = res.data;
      try {
        localStorage.setItem('veloop_token', token);
      } catch (_e) {}
      setUser(loggedUser);
      // Fetch wins for new user
      try {
        const claimsRes = await apiClient.get('/claims/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const unclaimed = (claimsRes.data.wins || []).filter((w: any) => w.status === 'UNCLAIMED').length;
        setUnclaimedCount(unclaimed);
      } catch (_e) {
        setUnclaimedCount(0);
      }
    } catch (e) {
      setError(errorMessage(e));
      throw e;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setLoading(true);
      await fetchDemoUsers();

      let storedToken: string | null = null;
      try {
        storedToken = localStorage.getItem('veloop_token');
      } catch (_e) {}

      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          if (isMounted) {
            setUser(res.data.user);
            await refreshWins();
          }
        } catch (_err) {
          try {
            localStorage.removeItem('veloop_token');
          } catch (_e) {}
          // Log in as default VE10025
          if (isMounted) {
            await loginDemoUser('VE10025').catch((e) => console.error(e));
          }
        }
      } else {
        // Automatically log in as default VE10025
        if (isMounted) {
          await loginDemoUser('VE10025').catch((e) => console.error(e));
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchDemoUsers, loginDemoUser, refreshWins]);

  return (
    <AuthContext.Provider
      value={{
        user,
        demoUsers,
        unclaimedCount,
        loading,
        error,
        loginDemoUser,
        refreshUser,
        refreshWins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
