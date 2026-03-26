import React, { useState } from 'react';
import PageLayout from "../../components/ui/PageLayout";
import { Button } from "../../components/ui/button";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async (plan: string) => {
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        plan: plan
      };

      const res = await fetch('/api/billing/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize payment');
      
      // Redirect to external paystack checkout page
      if (data.authorization_url) {
         window.location.href = data.authorization_url;
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Billing & Subscriptions" subtitle="Manage your organization's plan">
      <div className="space-y-8 max-w-5xl mx-auto">
        {error && <div className="bg-red-500/10 text-red-500 p-4 rounded">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BASIC */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg text-center flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
              <p className="text-gray-400 mb-6">Standard operational features.</p>
              <div className="text-3xl text-white font-bold mb-6">Free</div>
            </div>
            <Button variant="outline" onClick={() => handleUpgrade('basic')} disabled={loading}>Current Plan</Button>
          </div>

          {/* PRO */}
          <div className="bg-slate-800 border-2 border-primary-500 p-6 rounded-lg text-center flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-gray-400 mb-6">Staff Auto-assignment & AI Suggestions.</p>
              <div className="text-3xl text-white font-bold mb-6">$50 <span className="text-sm font-normal text-gray-400">/mo</span></div>
            </div>
            <Button variant="primary" onClick={() => handleUpgrade('pro')} disabled={loading}>Upgrade to PRO</Button>
          </div>

          {/* BUSINESS */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg text-center flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Business</h3>
              <p className="text-gray-400 mb-6">Advanced Anomaly Detection & Limits.</p>
              <div className="text-3xl text-white font-bold mb-6">$200 <span className="text-sm font-normal text-gray-400">/mo</span></div>
            </div>
            <Button variant="outline" onClick={() => handleUpgrade('business')} disabled={loading}>Upgrade to Business</Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
