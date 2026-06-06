import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { EntityGraph, Tenant } from '../lib/types/database';

interface AuthState {
  session:  Session | null;
  user:     User | null;
  entity:   EntityGraph | null;
  tenant:   Tenant | null;
  loading:  boolean;
  isBusinessOwner: boolean;
  viewMode: 'consumer' | 'business';
  setViewMode: (m: 'consumer' | 'business') => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,  setSession]  = useState<Session | null>(null);
  const [user,     setUser]     = useState<User | null>(null);
  const [entity,   setEntity]   = useState<EntityGraph | null>(null);
  const [tenant,   setTenant]   = useState<Tenant | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [viewMode, setViewMode] = useState<'consumer' | 'business'>('consumer');

  async function loadIdentity(u: User) {
    const { data: eg } = await (supabase as any)
      .from('entity_graph')
      .select('*')
      .eq('auth_user_id', u.id)
      .limit(1)
      .single();

    if (eg) {
      setEntity(eg as any);
      const { data: t } = await (supabase as any)
        .from('tenants')
        .select('*')
        .eq('id', eg.tenant_id)
        .single();
      if (t) setTenant(t as any);
      if (eg.entity_type === 'BUSINESS_OWNER') setViewMode('business');
    } else {
      // Fallback: use user metadata to determine role
      const role = u.user_metadata?.role || u.app_metadata?.role || '';
      if (role === 'BUSINESS_OWNER') setViewMode('business');
    }
  }

  async function refresh() {
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) await loadIdentity(s.user);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await loadIdentity(s.user);
      else { setEntity(null); setTenant(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setEntity(null); setTenant(null); setSession(null); setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      session, user, entity, tenant, loading,
      isBusinessOwner: entity?.entity_type === 'BUSINESS_OWNER',
      viewMode, setViewMode, refresh, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
