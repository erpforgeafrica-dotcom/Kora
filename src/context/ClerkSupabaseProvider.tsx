import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Syncs Clerk auth state to Supabase
 * Creates custom JWT for Supabase RLS
 */
function ClerkSupabaseSync({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function syncAuth() {
      if (!userId || !user) {
        await supabase.auth.signOut();
        setSynced(true);
        return;
      }

      try {
        // Get Clerk session token
        const clerkToken = await getToken();
        
        if (!clerkToken) {
          console.error('No Clerk token available');
          return;
        }

        // Exchange Clerk token for Supabase session
        const response = await fetch('/api/auth/clerk-to-supabase', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clerkToken}`
          },
          body: JSON.stringify({
            clerkUserId: userId,
            email: user.primaryEmailAddress?.emailAddress,
            fullName: user.fullName,
          })
        });

        const { supabaseToken } = await response.json();

        if (supabaseToken) {
          // Set Supabase session with custom JWT
          await supabase.auth.setSession({
            access_token: supabaseToken,
            refresh_token: 'clerk-managed'
          });
        }

        setSynced(true);
      } catch (error) {
        console.error('Auth sync failed:', error);
        setSynced(true);
      }
    }

    syncAuth();
  }, [userId, user, getToken]);

  if (!synced) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-3xl font-black text-emerald-400">KORA</div>
          <div className="text-sm text-gray-400">Syncing authentication...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ClerkSupabaseProvider({ children }: { children: React.ReactNode }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ClerkSupabaseSync>{children}</ClerkSupabaseSync>
    </ClerkProvider>
  );
}
