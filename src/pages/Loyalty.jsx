import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatNepaliDate } from '../utils/nepaliDate';
import {
  Award,
  Search,
  Loader2,
  User,
  ArrowRight,
  Plus,
  AlertCircle,
  X,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Phone,
  Building,
  History,
  ShieldCheck
} from 'lucide-react';

export default function Loyalty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // History panel state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Manual Adjust Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/customers', {
        params: { limit: 1000 }
      });
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Fetch customer loyalty list error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const loadHistory = async (customer) => {
    setSelectedCustomer(customer);
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/loyalty/customer/${customer._id}`);
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching loyalty history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAdjustPointsSubmit = async (e) => {
    e.preventDefault();
    if (!adjustPoints || !adjustNotes) {
      setAdjustError('Points and reason notes are required');
      return;
    }

    setAdjustLoading(true);
    setAdjustError('');

    try {
      await axios.post('/api/loyalty/adjust', {
        customerId: targetCustomer._id,
        points: parseInt(adjustPoints),
        notes: adjustNotes
      });

      setIsAdjustOpen(false);
      setAdjustPoints('');
      setAdjustNotes('');
      fetchCustomers();
      // Reload history if currently viewed
      if (selectedCustomer?._id === targetCustomer._id) {
        loadHistory(targetCustomer);
      }
    } catch (err) {
      console.error(err);
      setAdjustError(err.response?.data?.message || 'Points adjustment failed');
    } finally {
      setAdjustLoading(false);
    }
  };

  // Tier helper
  const getTierBadge = (pts = 0) => {
    if (pts >= 1000) {
      return { name: 'Platinum', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    if (pts >= 500) {
      return { name: 'Gold', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (pts >= 200) {
      return { name: 'Silver', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return { name: 'Bronze', bg: 'bg-amber-900/5 text-amber-800 border-amber-900/10' };
  };

  // Filter customers by name or phone
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Stats calculation
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

  // Sorted leaderboard
  const leaderboard = [...customers]
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-amber-500" />
            <span>Loyalty Rewards Program</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track client rewards accounts, statement ledgers, and disburse goodwill points.
          </p>
        </div>
      </div>

      {/* Top Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Accounts</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{customers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Issued Points</span>
            <p className="text-xl font-bold text-amber-600 font-mono mt-0.5">{totalLoyaltyPoints.toLocaleString()} PTS</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Top Client</span>
            <p className="text-sm font-bold text-slate-900 truncate max-w-[140px] mt-0.5">{leaderboard[0]?.name || 'N/A'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left side Customer List, Right side Statement Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main ledger list column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Search accounts by customer name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full h-11 pl-10 pr-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all placeholder-slate-400"
            />
          </div>

          {/* Summary Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {filteredCustomers.length} Customer Account(s)
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">Click row to open statement audit</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-500 mt-3 font-semibold">Loading loyalty index...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <Award className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No accounts found</h3>
              <p className="text-slate-500 text-xs mt-1">Try refining your search terms.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-340px)] min-h-[350px] overflow-y-auto pr-1">
              {filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?._id === c._id;
                const tier = getTierBadge(c.loyaltyPoints || 0);

                return (
                  <div
                    key={c._id}
                    onClick={() => loadHistory(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-amber-600 text-sm uppercase shrink-0">
                        {c.name.charAt(0)}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{c.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.bg}`}>
                            {tier.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                          {c.email && (
                            <span className="hidden sm:inline-block text-slate-400 text-[10px] truncate max-w-[140px]">
                              &bull; {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Points</span>
                        <span className="text-sm font-mono font-bold text-amber-600">
                          {c.loyaltyPoints || 0} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetCustomer(c);
                              setIsAdjustOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Adjust Points Balance"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => loadHistory(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View Statement History"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Column: Workspace / Statement History */}
        <div className="space-y-6">
          {selectedCustomer ? (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client Profile</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 block">
                    {selectedCustomer.loyaltyPoints || 0} PTS
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-500" />
                    <span>Statement Audit Log</span>
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetCustomer(selectedCustomer);
                        setIsAdjustOpen(true);
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adjust</span>
                    </button>
                  )}
                </div>

                {historyLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 italic">No statement activity logged for this account.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((txn) => (
                      <div key={txn._id} className="p-3 bg-slate-50/80 border border-slate-100 rounded-xl flex justify-between items-start text-xs">
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <span className="font-bold text-slate-800 capitalize block">{txn.transactionType}</span>
                          <p className="text-[11px] text-slate-500 leading-snug">{txn.notes}</p>
                          <span className="text-[10px] text-slate-400 block mt-1 font-medium">{formatNepaliDate(txn.createdAt)}</span>
                        </div>
                        <span className={`font-mono font-bold text-xs shrink-0 px-2 py-0.5 rounded border ${
                          txn.points > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {txn.points > 0 ? `+${txn.points}` : txn.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/customers/${selectedCustomer._id}`)}
                className="flex items-center justify-center gap-1.5 w-full h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer mt-2"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Go to Client Profile</span>
              </button>
            </div>
          ) : (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                <span>Program Leaderboard</span>
              </h3>

              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No loyalty points awarded yet.</p>
                ) : (
                  leaderboard.map((c, idx) => (
                    <div key={c._id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{c.name}</span>
                      </div>
                      <span className="font-mono text-amber-600 font-bold shrink-0 ml-2">{c.loyaltyPoints || 0} pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adjust Loyalty Points */}
      {isAdjustOpen && targetCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Adjust Loyalty Points</h2>
              <button
                type="button"
                onClick={() => {
                  setIsAdjustOpen(false);
                  setTargetCustomer(null);
                  setAdjustPoints('');
                  setAdjustNotes('');
                  setAdjustError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{adjustError}</span>
                </div>
              )}

              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Customer Account</span>
                <p className="text-base font-bold text-slate-800">{targetCustomer.name}</p>
                <p className="text-xs text-slate-500 font-semibold">Current points balance: {targetCustomer.loyaltyPoints || 0} pts</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Points Adjustment *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 100 or -50"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
                <p className="text-xs text-slate-500 font-medium mt-1">Use positive numbers to award, negative numbers to deduct points.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Adjustment Reason / Notes *</label>
                <textarea
                  required
                  placeholder="e.g. Good will gesture, manual points correction, sign up bonus..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  rows="3"
                  className="block w-full rounded-xl border-slate-200 text-sm resize-none py-3 px-3.5"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustOpen(false);
                    setTargetCustomer(null);
                    setAdjustPoints('');
                    setAdjustNotes('');
                    setAdjustError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {adjustLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Apply Adjustment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
