import React, { useState } from 'react';
import {
  User, Bell, Shield, CreditCard, Globe, Palette, Zap,
  Lock, Mail, Phone, Eye, EyeOff, Save, Check
} from 'lucide-react';

interface SettingsSection {
  id: string;
  icon: React.ReactNode;
  label: string;
  emoji: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'profile', icon: <User className="w-5 h-5" />, label: 'Profile & Business', emoji: '👤' },
  { id: 'appearance', icon: <Palette className="w-5 h-5" />, label: 'Appearance & Theme', emoji: '🎨' },
  { id: 'notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', emoji: '🔔' },
  { id: 'privacy', icon: <Shield className="w-5 h-5" />, label: 'Privacy & Security', emoji: '🔒' },
  { id: 'payments', icon: <CreditCard className="w-5 h-5" />, label: 'Payments & Plan', emoji: '💳' },
  { id: 'integrations', icon: <Zap className="w-5 h-5" />, label: 'Integrations', emoji: '⚡' },
  { id: 'ai', icon: <Globe className="w-5 h-5" />, label: 'AI Assistant', emoji: '🤖' },
];

interface Props {
  isAdmin?: boolean;
  onSave?: (settings: any) => void;
}

export default function ComprehensiveSettings({ isAdmin = false, onSave }: Props) {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Collect all settings and save
    onSave?.({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030610] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">⚙️</span>
            {isAdmin ? 'All Settings' : 'Your Settings'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {isAdmin 
              ? 'Control all technical elements, functionalities, and features' 
              : 'Adjust everything to work exactly how you want'}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3 space-y-2">
            {SETTINGS_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${activeSection === section.id
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                    : 'bg-white/5 border-2 border-transparent text-slate-400 hover:bg-white/8 hover:text-white'
                  }
                `}
              >
                <span className="text-xl">{section.emoji}</span>
                {section.icon}
                <span className="flex-1 text-left">{section.label}</span>
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="col-span-9">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Profile & Business */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Profile & Business Information</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Business Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Your Business Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Your Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Bio</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Tell people about your business..."
                    />
                  </div>
                </div>
              )}

              {/* Appearance & Theme */}
              {activeSection === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Appearance & Theme</h2>
                  
                  <div>
                    <label className="text-sm text-slate-400 block mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Emerald Dark', 'Pure White', 'Ocean Blue', 'Sunset Orange', 'High Contrast'].map(theme => (
                        <button
                          key={theme}
                          className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-emerald-500/50 rounded-xl transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400" />
                          <span className="text-sm text-white">{theme}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Language</label>
                      <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                        <option>English</option>
                        <option>French</option>
                        <option>Spanish</option>
                        <option>Arabic</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Currency</label>
                      <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                        <option>NGN (₦)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Timezone</label>
                      <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                        <option>Africa/Lagos</option>
                        <option>UTC</option>
                        <option>America/New_York</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Font Size</label>
                      <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                        <option>Small</option>
                        <option>Normal</option>
                        <option>Large</option>
                        <option>Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { label: 'New Bookings', desc: 'When someone books with you' },
                      { label: 'Payments', desc: 'When you receive payments' },
                      { label: 'Messages', desc: 'New messages from customers' },
                      { label: 'Security Alerts', desc: 'Important security notifications' },
                      { label: 'Marketing', desc: 'Tips and promotions' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div>
                          <div className="text-white font-medium text-sm">{item.label}</div>
                          <div className="text-slate-400 text-xs mt-1">{item.desc}</div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm text-slate-400">
                            <input type="checkbox" className="w-4 h-4" defaultChecked />
                            Email
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-400">
                            <input type="checkbox" className="w-4 h-4" defaultChecked />
                            SMS
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-400">
                            <input type="checkbox" className="w-4 h-4" defaultChecked />
                            Push
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy & Security */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Privacy & Security</h2>
                  
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Change Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        placeholder="New password"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                      <div>
                        <div className="text-white font-medium text-sm">Two-Factor Authentication</div>
                        <div className="text-slate-400 text-xs mt-1">Extra security for your account</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                      <div>
                        <div className="text-white font-medium text-sm">Show Online Status</div>
                        <div className="text-slate-400 text-xs mt-1">Let others see when you're active</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </label>
                  </div>
                </div>
              )}

              {/* AI Assistant */}
              {activeSection === 'ai' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">AI Assistant Settings</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                      <div>
                        <div className="text-white font-medium text-sm">AI Assistant Enabled</div>
                        <div className="text-slate-400 text-xs mt-1">Let AI help you manage your business</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                      <div>
                        <div className="text-white font-medium text-sm">Auto-Respond to Messages</div>
                        <div className="text-slate-400 text-xs mt-1">AI replies when you're busy</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5" />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
                      <div>
                        <div className="text-white font-medium text-sm">Learning Mode</div>
                        <div className="text-slate-400 text-xs mt-1">AI learns from your business patterns</div>
                      </div>
                      <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </label>

                    <div>
                      <label className="text-sm text-slate-400 block mb-2">Response Style</label>
                      <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500">
                        <option>Professional</option>
                        <option>Friendly</option>
                        <option>Casual</option>
                        <option>Formal</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                {saved && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <Check className="w-4 h-4" />
                    Saved successfully!
                  </div>
                )}
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
