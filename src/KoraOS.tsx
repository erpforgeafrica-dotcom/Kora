import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import RegisterWizard from './components/auth/RegisterWizard';
import LoginScreen from './components/auth/LoginScreen';
import KoraDashboard from './components/dashboard/KoraDashboard';
import KoraMarketplace from './components/marketplace/KoraMarketplace';
import BusinessStorefront from './components/marketplace/BusinessStorefront';

// Existing SBOS demo app (preserved)
import LegacyApp from './LegacyApp';

type View =
  | 'auth-login'
  | 'auth-register'
  | 'dashboard'
  | 'marketplace'
  | { type: 'storefront'; slug: string }
  | 'legacy-demo'
  | 'test-tenant';

export default function KoraOS() {
  const { session, loading } = useAuth();
  const [view, setView] = useState<View>('auth-login');

  // Development/Testing views
  if (view === 'legacy-demo') return <LegacyApp onExit={() => setView('auth-login')} />;
  if (view === 'test-tenant') {
    const TenantTest = React.lazy(() => import('./components/TenantOnboardingTest'));
    return (
      <React.Suspense fallback={<div className="p-8">Loading test...</div>}>
        <TenantTest />
      </React.Suspense>
    );
  }

  // Loading splash
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030610] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-3xl font-black tracking-widest text-emerald-400 font-mono">KORA</div>
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Authenticated routing
  if (session) {
    if (typeof view === 'object' && view.type === 'storefront')
      return <BusinessStorefront slug={view.slug} onBack={() => setView('marketplace')} />;
    if (view === 'marketplace')
      return <KoraMarketplace onViewBusiness={slug => setView({ type: 'storefront', slug })} />;
    // Default to dashboard
    return (
      <KoraDashboard
        onNavigate={action => {
          if (action === 'marketplace') setView('marketplace');
          // add-service, add-staff, etc. → future dynamic form routes
        }}
      />
    );
  }

  // Unauthenticated routing
  if (view === 'auth-register')
    return (
      <RegisterWizard
        onSuccess={() => setView('dashboard')}
        onLoginClick={() => setView('auth-login')}
      />
    );

  return (
    <>
      <LoginScreen
        onSuccess={() => setView('dashboard')}
        onRegisterClick={() => setView('auth-register')}
      />
      {/* Dev shortcuts */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        <button
          onClick={() => setView('test-tenant')}
          className="text-[10px] font-mono text-emerald-600 hover:text-emerald-400 transition border border-emerald-800 rounded-lg px-3 py-1.5"
        >
          🔒 Test Tenant
        </button>
        <button
          onClick={() => setView('legacy-demo')}
          className="text-[10px] font-mono text-slate-600 hover:text-slate-400 transition border border-slate-800 rounded-lg px-3 py-1.5"
        >
          View Legacy Demo
        </button>
      </div>
    </>
  );
}
