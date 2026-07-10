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
  X
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

  // Filter customers by name or phone
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // Sorted leaderboard
  const leaderboard = [...customers]
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main ledger list column */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Loyalty Rewards Program</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer rewards accounts, track points statement ledgers, and award goodwill points.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search accounts by customer name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full h-12 pl-11 pr-4 rounded-2xl border-slate-200 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm text-slate-500 mt-3 font-semibold">Loading loyalty index...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <Award className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">No accounts found</h3>
            <p className="text-slate-500 text-sm mt-1">Try refining your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCustomers.map((c) => (
              <div
                key={c._id}
                onClick={() => loadHistory(c)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md ${selectedCustomer?._id === c._id ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}
              >
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Phone: {c.phone} &bull; {c.email || 'No email'}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-wide font-bold">Balance Points</span>
                    <p className="text-base font-bold text-amber-600 font-mono mt-0.5">
                      {c.loyaltyPoints || 0} pts
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetCustomer(c);
                          setIsAdjustOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Adjust Points"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers/${c._id}`);
                      }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="View Customer Profile"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side Column: Leaderboard / Point History statement audit */}
      <div className="space-y-6">
        {selectedCustomer ? (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedCustomer.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-amber-700 font-bold block bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 font-mono">
                  {selectedCustomer.loyaltyPoints || 0} pts
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Statement History</span>

              {historyLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-slate-500 italic">No points transaction logs recorded.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {history.map((txn) => (
                    <div key={txn._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs text-slate-600">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800 capitalize">{txn.transactionType}</p>
                        <p className="text-xs text-slate-500 leading-relaxed">{txn.notes}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{formatNepaliDate(txn.createdAt)}</p>
                      </div>
                      <span className={`font-mono font-bold shrink-0 text-sm ml-3 ${txn.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
              className="flex items-center justify-center gap-1.5 w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <User className="w-4.5 h-4.5 text-slate-400" />
              <span>Go to Client Profile</span>
            </button>
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Program Leaderboard</span>
            </h3>

            <div className="space-y-2.5">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No loyalty points awarded yet.</p>
              ) : (
                leaderboard.map((c, idx) => (
                  <div key={c._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-700">{c.name}</span>
                    </div>
                    <span className="font-mono text-amber-600 font-bold text-sm">{c.loyaltyPoints || 0} pts</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
