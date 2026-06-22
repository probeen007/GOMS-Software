import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  FileText,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#ec4899', '#10b981', '#06b6d4', '#8b5cf6'];

export default function Finance() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Date filters - default to last 30 days
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const defaultEndDate = () => new Date().toISOString().split('T')[0];

  // State
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenditure: 0, netProfit: 0 });
  const [chartData, setChartData] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      // 1. Get cash flow and daily aggregates
      const cashFlowRes = await axios.get('/api/finance/cash-flow', {
        params: { startDate, endDate }
      });
      setSummary(cashFlowRes.data.summary);
      setChartData(cashFlowRes.data.chartData);

      // 2. Get list of expenditures
      const expRes = await axios.get('/api/finance/expenditures');
      setExpenditures(expRes.data);

      // 3. Get outstanding dues (Unpaid Dues)
      const summaryRes = await axios.get('/api/analytics/summary');
      setOutstandingDues(summaryRes.data.metrics.totalOutstanding || 0);
    } catch (err) {
      console.error('Fetch finance data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [startDate, endDate]);

  // Handle Add Expenditure Submit
  const handleAddExpenditure = async (e) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount) {
      setModalError('Category and Amount are required');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await axios.post('/api/finance/expenditures', {
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        note: newExpense.note,
        date: newExpense.date
      });

      setIsModalOpen(false);
      setNewExpense({
        category: '',
        amount: '',
        note: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchFinanceData();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setModalLoading(false);
    }
  };

  // Void/Delete Expenditure
  const handleDeleteExpenditure = async (id) => {
    if (!window.confirm('Are you sure you want to void this expenditure? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/finance/expenditures/${id}`);
      fetchFinanceData();
    } catch (err) {
      console.error(err);
      alert('Failed to void expenditure');
    }
  };

  // Calculate expenditure category breakdown
  const getCategoryBreakdown = () => {
    const breakdown = {};
    expenditures.forEach((exp) => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
    });
    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value
    }));
  };

  const categoryChartData = getCategoryBreakdown();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Financial reports</h1>
          <p className="text-sm text-slate-400 mt-1 font-semibold">
            Monitor cash flow statement indexes, log expenditures, and audit shop financials.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 transition-all duration-200 shadow-lg shadow-primary-500/10 hover-lift glow-effect cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expenditure</span>
        </button>
      </div>

      {/* Date Filters & KPI Grid */}
      <div className="space-y-4">
        {/* Date Filter Panel */}
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-450" />
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              Cash Flow Date Range
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input px-3.5 h-10 rounded-xl text-sm text-slate-205 focus:outline-none"
            />
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input px-3.5 h-10 rounded-xl text-sm text-slate-205 focus:outline-none"
            />
          </div>
        </div>

        {/* KPI Scorecard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Total Income (Inflow)</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">Rs. {summary.totalIncome.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 shadow-lg shadow-emerald-500/5">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          {/* Operating Expense */}
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Operating Expense (Outflow)</span>
              <p className="text-2xl sm:text-3xl font-black text-rose-455 font-mono">Rs. {summary.totalExpenditure.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-455 shadow-lg shadow-rose-500/5">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Net Cash Flow (Profit)</span>
              <p className={`text-2xl sm:text-3xl font-black font-mono ${summary.netProfit >= 0 ? 'text-indigo-400' : 'text-rose-450'}`}>
                Rs. {summary.netProfit.toFixed(2)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${summary.netProfit >= 0 ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-indigo-500/5' : 'bg-rose-500/10 border border-rose-500/20 text-rose-455 shadow-rose-500/5'}`}>
              <span className="font-extrabold text-xs">NPR</span>
            </div>
          </div>

          {/* Unpaid Dues Amount */}
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Outstanding Dues (Unpaid)</span>
              <p className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">Rs. {outstandingDues.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/5">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-3 font-medium">Analyzing transaction ledgers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Cash Flow Area Chart */}
          <div className="lg:col-span-2 p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-850">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-extrabold text-white tracking-tight">Daily Cash Flow Trends</h3>
            </div>
            
            <div className="h-[280px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 italic">
                  No activity found in the selected date range.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenditure" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '13px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="income" name="Income (Rs.)" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenditure" name="Expenditure (Rs.)" stroke="#ec4899" fillOpacity={1} fill="url(#colorExpenditure)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Expenditure Breakdown Pie Chart */}
          <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-850">
              <PieIcon className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white tracking-tight">Expense Category Share</h3>
            </div>

            <div className="h-[280px] w-full flex flex-col justify-center">
              {categoryChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 italic">
                  No expenditure records created.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Expenditures Ledger Logs */}
          <div className="lg:col-span-3 p-6 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 tracking-tight">
                <FileText className="w-5 h-5 text-primary-400" />
                <span>Operating Expense Ledger</span>
              </h3>
              <span className="text-xs text-slate-500 font-extrabold tracking-widest uppercase">Audit Log entries</span>
            </div>

            {expenditures.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-500 italic">No expenditures logged.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  <thead>
                    <tr className="text-slate-450 uppercase font-extrabold tracking-widest text-xs">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Reason / Notes</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {expenditures.map((exp) => (
                      <tr key={exp._id} className="hover:bg-slate-900/30 transition-colors text-sm">
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate font-medium" title={exp.note}>{exp.note || '—'}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-455 whitespace-nowrap text-base">
                          -Rs. {exp.amount.toFixed(2)}
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteExpenditure(exp._id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Void Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}      {/* Modal: Add Manual Expenditure */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Record Operating Expense</h2>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewExpense({
                    category: '',
                    amount: '',
                    note: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                  setModalError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenditure} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Expense Category *</label>
                <select
                  required
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none font-bold"
                >
                  <option value="" className="bg-slate-950">Select category...</option>
                  <option value="Rent" className="bg-slate-950">Shop Rent</option>
                  <option value="Utilities" className="bg-slate-950">Utility Bills (Water, Electricity)</option>
                  <option value="Salaries" className="bg-slate-950">Staff Salaries</option>
                  <option value="Marketing" className="bg-slate-950">Marketing & Ads</option>
                  <option value="Tools & Supplies" className="bg-slate-950">Equipment & Tool Repairs</option>
                  <option value="Office Expense" className="bg-slate-950">Office Stationery & Supplies</option>
                  <option value="Tax" className="bg-slate-950">Government Taxes / Business Fees</option>
                  <option value="Other" className="bg-slate-950">Other Overhead</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Expense Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Expense Description / Notes</label>
                <textarea
                  placeholder="e.g. Paid electricity bill for showroom for June 2026..."
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                  rows="3"
                  className="glass-input block w-full rounded-xl py-3 px-3.5 text-slate-205 text-sm resize-none focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewExpense({
                      category: '',
                      amount: '',
                      note: '',
                      date: new Date().toISOString().split('T')[0]
                    });
                    setModalError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-550/15 cursor-pointer"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <span>Record Expense</span>
                    </>
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
