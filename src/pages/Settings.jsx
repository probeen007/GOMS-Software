import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Settings,
  Bell,
  Wrench,
  Receipt,
  Eye,
  Sliders,
  Check,
  AlertCircle,
  Loader2,
  Save,
  Layout,
  MessageSquare,
  Building,
  Phone,
  MapPin
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State management
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'personal'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Global settings state (from backend)
  const [globalSettings, setGlobalSettings] = useState({
    garageName: 'PM Auto Mobiles',
    garagePhone: '9800000000',
    garageAddress: 'Kathmandu, Nepal',
    lowStockAlerts: true,
    daybookClosureReminder: true,
    autoWhatsAppPrompts: true,
    vatEnabled: true,
    vatRate: 13,
    loyaltySystemEnabled: true
  });

  // Local/Personal settings state (from localStorage)
  const [personalSettings, setPersonalSettings] = useState({
    compactSidebar: false
  });

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // Fetch global settings from backend
        const res = await axios.get('/api/settings');
        if (res.data) {
          setGlobalSettings(res.data);
        }

        // Fetch personal settings from localStorage
        const localCompact = localStorage.getItem('sidebar-collapsed') === 'true';
        setPersonalSettings({
          compactSidebar: localCompact
        });
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load system settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle global settings change
  const handleGlobalChange = (key, value) => {
    if (!isAdmin) return; // Read-only for non-admins
    setGlobalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle personal settings change
  const handlePersonalChange = (key, value) => {
    setPersonalSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Apply immediately to localStorage / DOM
    if (key === 'compactSidebar') {
      localStorage.setItem('sidebar-collapsed', String(value));
      // Dispatch events to trigger sidebar update instantly
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('sidebar-collapsed-change'));
    }
  };

  // Submit global settings to backend
  const handleSubmitGlobal = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await axios.put('/api/settings', globalSettings);
      if (res.data) {
        setGlobalSettings(res.data);
      }
      setSuccess('Global business settings updated successfully!');
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to update global settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Loading system configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wider">System Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure system rules, notification toggles, tax rates, and interface preferences.
          </p>
        </div>

        {/* Roles alert */}
        {!isAdmin && (
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-bold uppercase tracking-wider">
            View-Only Access (Global Settings)
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'global'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Global Preferences
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'personal'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4" />
          Personalization
        </button>
      </div>

      {/* Form Feedback Alerts */}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="text-xs text-emerald-800 font-bold">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="text-xs text-rose-800 font-bold">{error}</span>
        </div>
      )}

      {/* TAB CONTENT: Global Preferences */}
      {activeTab === 'global' && (
        <form onSubmit={handleSubmitGlobal} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Company Profile */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  Garage Profile
                </h3>
              </div>
              <div className="p-5 space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Garage Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={globalSettings.garageName}
                      onChange={e => handleGlobalChange('garageName', e.target.value)}
                      className="block w-full pl-9 h-9 text-xs font-semibold rounded-lg border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={globalSettings.garagePhone}
                      onChange={e => handleGlobalChange('garagePhone', e.target.value)}
                      className="block w-full pl-9 h-9 text-xs font-semibold rounded-lg border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      disabled={!isAdmin}
                      value={globalSettings.garageAddress}
                      onChange={e => handleGlobalChange('garageAddress', e.target.value)}
                      className="block w-full pl-9 h-9 text-xs font-semibold rounded-lg border-slate-200 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Notifications & Workflows */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-500" />
                  Workflow & Alerts
                </h3>
              </div>
              <div className="p-5 space-y-5 flex-1">
                {/* Low Stock Alerts */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">Low Stock Alerts</h4>
                    <p className="text-[10px] text-slate-500">Enable automated notifications when stock drops below threshold quantity.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={globalSettings.lowStockAlerts}
                      onChange={e => handleGlobalChange('lowStockAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Day Book Reminder */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">Day Book Reminders</h4>
                    <p className="text-[10px] text-slate-500">Alert managers if the Daily Day Book reconciliation is not closed by 10 PM.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={globalSettings.daybookClosureReminder}
                      onChange={e => handleGlobalChange('daybookClosureReminder', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* WhatsApp Prompts */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">WhatsApp Prompts</h4>
                    <p className="text-[10px] text-slate-500">Provide direct prompt triggers to send transaction receipts via WhatsApp API link.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={globalSettings.autoWhatsAppPrompts}
                      onChange={e => handleGlobalChange('autoWhatsAppPrompts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Column 3: Billing & Financial Rules */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Billing & Loyalty Rules
                </h3>
              </div>
              <div className="p-5 space-y-4 flex-1">
                {/* Default VAT */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">Enable VAT by Default</h4>
                    <p className="text-[10px] text-slate-500">Pre-select VAT billing on new invoices/estimates.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={globalSettings.vatEnabled}
                      onChange={e => handleGlobalChange('vatEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* VAT Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Default VAT Rate (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      disabled={!isAdmin || !globalSettings.vatEnabled}
                      value={globalSettings.vatRate}
                      onChange={e => handleGlobalChange('vatRate', e.target.value)}
                      className="block w-24 h-9 text-xs font-semibold rounded-lg border-slate-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-50"
                    />
                    <span className="text-xs text-slate-500 font-semibold">% Tax Component</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 my-2 pt-3"></div>

                {/* Loyalty Ledger System */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">Loyalty Point Ledger</h4>
                    <p className="text-[10px] text-slate-500">Allow customers to accumulate loyalty points during cash settlements (Rs. 10 = 1 point).</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={globalSettings.loyaltySystemEnabled}
                      onChange={e => handleGlobalChange('loyaltySystemEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions (Only for Admin) */}
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB CONTENT: Personalization */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              Interface Preferences
            </h3>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Compact Sidebar */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-slate-500" />
                  Compact Desktop Sidebar
                </h4>
                <p className="text-[10px] text-slate-500">
                  Minimize the sidebar width to show icons only on large screens, maximizing your workspace.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={personalSettings.compactSidebar}
                  onChange={e => handlePersonalChange('compactSidebar', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
