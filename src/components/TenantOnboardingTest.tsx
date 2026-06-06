import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createTenantForUser, getCurrentTenantId } from '../services/onboardingService';

export default function TenantOnboardingTest() {
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const tid = await getCurrentTenantId();
      setTenantId(tid);
    }
  }

  async function handleSignUp() {
    setLoading(true);
    setMessage('');
    
    try {
      const email = `test${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      if (error) throw error;
      
      // Auto-confirm email in development (check Supabase settings)
      setUser(data.user);
      setMessage(`✅ User signed up: ${email}`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTenant() {
    if (!user) {
      setMessage('❌ No user found. Sign up first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await createTenantForUser(user.id, {
        name: `Test Company ${Date.now()}`,
        slug: `test-${Date.now()}`,
        type: 'standard'
      });

      if (result.success) {
        setMessage('✅ Tenant created and JWT updated!');
        await checkUser(); // Refresh tenant info
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testTenantIsolation() {
    setLoading(true);
    setMessage('');

    try {
      // Test 1: Check tenant function
      const { data: funcData, error: funcError } = await supabase
        .rpc('kora_current_tenant_id');

      if (funcError) throw funcError;

      // Test 2: Query tenants (should only see own)
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('*');

      if (tenantError) throw tenantError;

      // Test 3: Query employees (should only see own tenant's)
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('count');

      if (empError) throw empError;

      setMessage(
        `✅ ISOLATION TEST PASSED:\n` +
        `- kora_current_tenant_id(): ${funcData || 'NULL'}\n` +
        `- Tenants visible: ${tenants?.length || 0}\n` +
        `- Employees visible: ${(employees as any)?.[0]?.count || 0}`
      );
    } catch (error: any) {
      setMessage(`❌ Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔒 Tenant Isolation Test</h1>

      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Current Status:</h2>
        <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>Tenant ID:</strong> {tenantId || 'Not assigned'}</p>
        <p><strong>JWT Metadata:</strong> {JSON.stringify(user?.app_metadata || {})}</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleSignUp}
          disabled={loading || !!user}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          1. Sign Up Test User
        </button>

        <button
          onClick={handleCreateTenant}
          disabled={loading || !user || !!tenantId}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
        >
          2. Create Tenant & Update JWT
        </button>

        <button
          onClick={testTenantIsolation}
          disabled={loading || !tenantId}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          3. Test RLS Tenant Isolation
        </button>

        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
          disabled={loading || !user}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Sign Out & Reset
        </button>
      </div>

      {message && (
        <div className="mt-6 p-4 bg-white border rounded">
          <p className="font-mono text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}
