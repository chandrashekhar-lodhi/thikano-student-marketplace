import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { authService, savedService } from '../services/api';
import type { Profile } from '../types';

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  savedIds: Set<string>;
  refreshProfile: () => Promise<void>;
  refreshSaved: () => Promise<void>;
  toggleSaved: (propertyId: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<Profile>;
  signUp: (params: {
    full_name: string;
    email: string;
    password: string;
    role: 'student' | 'owner';
  }) => Promise<{ profile: Profile | null; needsEmailVerification: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refreshSaved = useCallback(async () => {
    try {
      const items = await savedService.list();
      setSavedIds(new Set(items.map((item) => item.property_id)));
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getCurrentProfile();
      setUser(profile);
      if (profile) {
        await refreshSaved();
      } else {
        setSavedIds(new Set());
      }
    } catch {
      setUser(null);
      setSavedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [refreshSaved]);

  useEffect(() => {
    refreshProfile();

    if (isSupabaseConfigured && supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(() => {
        refreshProfile();
      });
      return () => sub.subscription.unsubscribe();
    }
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const profile = await authService.login(email, password);
    setUser(profile);
    await refreshSaved();
    return profile;
  };

  const signUp = async (params: {
    full_name: string;
    email: string;
    password: string;
    role: 'student' | 'owner';
  }) => {
    const res = await authService.signUp(params);
    if (res.profile) {
      setUser(res.profile);
      await refreshSaved();
    }
    return res;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setSavedIds(new Set());
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const toggleSaved = async (propertyId: string) => {
    const isNowSaved = await savedService.toggle(propertyId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isNowSaved) next.add(propertyId);
      else next.delete(propertyId);
      return next;
    });
    return isNowSaved;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        savedIds,
        refreshProfile,
        refreshSaved,
        toggleSaved,
        login,
        signUp,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
