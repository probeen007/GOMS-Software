import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDate, formatNepaliShortDate } from '../utils/nepaliDate';
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
  Activity,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  LayoutGrid,
  Users,
  ChevronDown,
  ChevronUp
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

const COLORS = ['#2563eb', '#f59e0b', '#ec4899', '#10b981', '#06b6d4', '#8b5cf6'];

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
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [endDate, setEndDate] = useState(defaultEndDate());
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenditure: 0, netProfit: 0 });
  const [chartData, setChartData] = useState([]);
  const [expenditures, setExpenditures] = useState([]);
  const [outstandingDues, setOutstandingDues] = useState(0);
  const [loading, setLoading] = useState(true);

  // VAT / Non-VAT / Summary report tabs
  const [vatReport, setVatReport] = useState({
    invoices: [],
    totals: { subtotal: 0, vat: 0, total: 0 },
    count: 0,
    purchases: [],
    purchaseTotals: { subtotal: 0, vat: 0, total: 0 },
    purchaseCount: 0
  });
  const [nonVatReport, setNonVatReport] = useState({
    invoices: [],
    totals: { subtotal: 0, total: 0 },
    count: 0,
    purchases: [],
    purchaseTotals: { subtotal: 0, total: 0 },
    purchaseCount: 0
  });
  const [summaryReport, setSummaryReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Customer Dues tab
  const [duesMonth, setDuesMonth] = useState('');
  const [duesYear, setDuesYear] = useState('');
  const [duesReport, setDuesReport] = useState({ customers: [], totalDue: 0, customerCount: 0 });
  const [duesLoading, setDuesLoading] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);

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
    const results = await Promise.allSettled([
      axios
        .get('/api/finance/cash-flow', { params: { startDate, endDate } })
        .then((res) => {
          setSummary(res.data.summary);
          setChartData(res.data.chartData);
        }),
      axios.get('/api/finance/expenditures').then((res) => setExpenditures(res.data)),
      axios
        .get('/api/analytics/summary')
        .then((res) => setOutstandingDues(res.data.metrics.totalOutstanding || 0))
    ]);
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('Fetch finance data error:', failed.map((r) => r.reason));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchFinanceData();
    }
  }, [startDate, endDate, activeTab]);

  const fetchVatReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get('/api/finance/vat-report', { params: { startDate, endDate } });
      setVatReport(res.data);
    } catch (err) {
      console.error('Fetch VAT report error:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchNonVatReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get('/api/finance/non-vat-report', { params: { startDate, endDate } });
      setNonVatReport(res.data);
    } catch (err) {
      console.error('Fetch Non-VAT report error:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchSummaryReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get('/api/finance/summary-report', { params: { startDate, endDate } });
      setSummaryReport(res.data);
    } catch (err) {
      console.error('Fetch summary report error:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchDuesReport = async () => {
    setDuesLoading(true);
    try {
      const res = await axios.get('/api/finance/dues-report', {
        params: { month: duesMonth || undefined, year: duesYear || undefined }
      });
      setDuesReport(res.data);
    } catch (err) {
      console.error('Fetch dues report error:', err);
    } finally {
      setDuesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vat') fetchVatReport();
    else if (activeTab === 'non-vat') fetchNonVatReport();
    else if (activeTab === 'summary') fetchSummaryReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'dues') fetchDuesReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, duesMonth, duesYear]);

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

  // Calculate expenditure category breakdown (memoized: only recompute when
  // the expenditures list actually changes, not on every unrelated render)
  const categoryChartData = useMemo(() => {
    const breakdown = {};
    expenditures.forEach((exp) => {
      breakdown[exp.category] = (breakdown[exp.category] || 0) + exp.amount;
    });
    return Object.entries(breakdown).map(([name, value]) => ({
      name,
      value
    }));
  }, [expenditures]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor cash flow, log expenditures, and audit shop financials.
          </p>
        </div>

        {activeTab === 'overview' && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-md shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expenditure</span>
          </button>
        )}
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutGrid },
          { id: 'vat', label: 'VAT Report', icon: Receipt },
          { id: 'non-vat', label: 'Non-VAT Report', icon: FileSpreadsheet },
          { id: 'summary', label: 'Summary Report', icon: BarChart3 },
          { id: 'dues', label: 'Customer Dues', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Panel (shared across overview/VAT/Non-VAT/Summary tabs) */}
      {activeTab === 'dues' ? (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Filter Dues By
            </span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={duesMonth}
              onChange={(e) => setDuesMonth(e.target.value)}
              className="px-3.5 h-10 rounded-xl border-slate-200 text-sm font-semibold cursor-pointer"
            >
              <option value="">All Months</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={duesYear}
              onChange={(e) => setDuesYear(e.target.value)}
              className="px-3.5 h-10 rounded-xl border-slate-200 text-sm font-semibold cursor-pointer"
            >
              <option value="">All Years</option>
              {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {(duesMonth || duesYear) && (
              <button
                type="button"
                onClick={() => { setDuesMonth(''); setDuesYear(''); }}
                className="px-3.5 h-10 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Report Date Range
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3.5 h-10 rounded-xl border-slate-200 text-sm"
            />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3.5 h-10 rounded-xl border-slate-200 text-sm"
            />
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
      <>
      {/* KPI Scorecard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Total Income (Inflow)</span>
            <p className="text-2xl font-bold text-emerald-600 font-mono">Rs. {summary.totalIncome.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Operating Expense */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Operating Expense (Outflow)</span>
            <p className="text-2xl font-bold text-rose-600 font-mono">Rs. {summary.totalExpenditure.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Net Cash Flow (Profit)</span>
            <p className={`text-2xl font-bold font-mono ${summary.netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
              Rs. {summary.netProfit.toFixed(2)}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${summary.netProfit >= 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
            <span className="font-extrabold text-xs">NPR</span>
          </div>
        </div>

        {/* Unpaid Dues Amount */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Outstanding Dues (Unpaid)</span>
            <p className="text-2xl font-bold text-sky-600 font-mono">Rs. {outstandingDues.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-3 font-medium">Analyzing transaction ledgers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Cash Flow Area Chart */}
          <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Daily Cash Flow Trends</h3>
            </div>

            <div className="h-[280px] w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickFormatter={formatNepaliShortDate} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      labelStyle={{ color: '#475569', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '13px' }}
                      labelFormatter={(dateStr) => formatNepaliDate(dateStr)}
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
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <PieIcon className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Expense Category Share</h3>
            </div>

            <div className="h-[280px] w-full flex flex-col justify-center">
              {categoryChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
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
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', color: '#1e293b' }}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Expenditures Ledger Logs */}
          <div className="lg:col-span-3 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Operating Expense Ledger</span>
              </h3>
            </div>

            {expenditures.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-slate-400 italic">No expenditures logged.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 uppercase font-bold tracking-wide text-xs">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Reason / Notes</th>
                      <th className="py-3.5 px-4 text-right">Amount</th>
                      {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {expenditures.map((exp) => (
                      <tr key={exp._id} className="hover:bg-slate-50 transition-colors text-sm">
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium">{formatNepaliDate(exp.date)}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="badge-slate">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate font-medium" title={exp.note}>{exp.note || '—'}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap text-base">
                          -Rs. {exp.amount.toFixed(2)}
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteExpenditure(exp._id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
      )}
      </>
      )}

      {activeTab === 'vat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">VAT Collected (Sales)</span>
              <p className="text-2xl font-bold text-blue-700 font-mono">Rs. {vatReport.totals.vat.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">From {vatReport.count} tax invoices</span>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">VAT Paid (Purchases)</span>
              <p className="text-2xl font-bold text-rose-600 font-mono">Rs. {(vatReport.purchaseTotals?.vat || 0).toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">From {vatReport.purchaseCount || 0} restock orders</span>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Net VAT Payable</span>
              <p className={`text-2xl font-bold font-mono ${(vatReport.totals.vat - (vatReport.purchaseTotals?.vat || 0)) >= 0 ? 'text-blue-700' : 'text-emerald-600'}`}>
                Rs. {(vatReport.totals.vat - (vatReport.purchaseTotals?.vat || 0)).toFixed(2)}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Collected minus Paid</span>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Total Sales (Subtotal)</span>
              <p className="text-2xl font-bold text-slate-900 font-mono">Rs. {vatReport.totals.subtotal.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Taxable base sales amount</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VAT Invoices (Sales) */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <span>Sales VAT Ledger ({vatReport.count})</span>
                </h3>
              </div>
              {reportLoading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" /></div>
              ) : vatReport.invoices.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">No VAT invoices in this date range.</p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase font-bold tracking-wide">
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">VAT (13%)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {vatReport.invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold">{inv.invoiceNo}</td>
                          <td className="py-2.5 px-3">{formatNepaliDate(inv.createdAt)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-700">Rs. {inv.vat.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {inv.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* VAT Purchases (Supplier Restocks) */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                  <Receipt className="w-5 h-5 text-rose-600" />
                  <span>Purchases VAT Ledger ({vatReport.purchaseCount || 0})</span>
                </h3>
              </div>
              {reportLoading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-rose-600 animate-spin mx-auto" /></div>
              ) : !vatReport.purchases || vatReport.purchases.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">No VAT purchases in this date range.</p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase font-bold tracking-wide">
                        <th className="py-2.5 px-3">Supplier</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">VAT (13%)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {vatReport.purchases.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold">{p.supplierName}</td>
                          <td className="py-2.5 px-3">{formatNepaliDate(p.createdAt)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600">Rs. {p.vat.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {p.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'non-vat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Non-VAT Sales</span>
              <p className="text-2xl font-bold text-slate-900 font-mono">Rs. {nonVatReport.totals.total.toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">From {nonVatReport.count} billing receipts</span>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Non-VAT Purchases</span>
              <p className="text-2xl font-bold text-slate-900 font-mono">Rs. {(nonVatReport.purchaseTotals?.total || 0).toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">From {nonVatReport.purchaseCount || 0} restock orders</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Non-VAT Sales Invoices */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                  <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                  <span>Non-VAT Sales Ledger ({nonVatReport.count})</span>
                </h3>
              </div>
              {reportLoading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" /></div>
              ) : nonVatReport.invoices.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">No Non-VAT invoices in this date range.</p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase font-bold tracking-wide">
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {nonVatReport.invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold">{inv.invoiceNo}</td>
                          <td className="py-2.5 px-3">{formatNepaliDate(inv.createdAt)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {inv.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Non-VAT Purchases */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                  <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                  <span>Non-VAT Purchases Ledger ({nonVatReport.purchaseCount || 0})</span>
                </h3>
              </div>
              {reportLoading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" /></div>
              ) : !nonVatReport.purchases || nonVatReport.purchases.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-8">No Non-VAT purchases in this date range.</p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto pr-1">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 uppercase font-bold tracking-wide">
                        <th className="py-2.5 px-3">Supplier</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {nonVatReport.purchases.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold">{p.supplierName}</td>
                          <td className="py-2.5 px-3">{formatNepaliDate(p.createdAt)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">Rs. {p.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="space-y-6">
          {reportLoading || !summaryReport ? (
            <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Total Income</span>
                  <p className="text-2xl font-bold text-emerald-600 font-mono">Rs. {summaryReport.totalIncome.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Total Expenditure</span>
                  <p className="text-2xl font-bold text-rose-600 font-mono">Rs. {summaryReport.totalExpenditure.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Net Profit</span>
                  <p className={`text-2xl font-bold font-mono ${summaryReport.netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>Rs. {summaryReport.netProfit.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* VAT Section */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Receipt className="w-4.5 h-4.5 text-blue-600" /> 
                    <span>VAT (Sales & Purchases)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Sales (Outflow)</span>
                      <div className="flex justify-between text-xs text-slate-500"><span>Count:</span><strong className="text-slate-800">{summaryReport.vatInvoiceCount}</strong></div>
                      <div className="flex justify-between text-xs text-slate-500"><span>Total Sales:</span><strong className="font-mono text-slate-800">Rs. {summaryReport.vatInvoiceTotal.toFixed(2)}</strong></div>
                      <div className="flex justify-between text-xs text-slate-500"><span>VAT Collected:</span><strong className="font-mono text-blue-700">Rs. {summaryReport.vatCollected.toFixed(2)}</strong></div>
                    </div>
                    <div className="space-y-2 border-l border-slate-100 pl-4">
                      <span className="text-xs font-bold text-slate-400 uppercase">Purchases (Inflow)</span>
                      <div className="flex justify-between text-xs text-slate-500"><span>Count:</span><strong className="text-slate-800">{summaryReport.vatPurchaseCount || 0}</strong></div>
                      <div className="flex justify-between text-xs text-slate-500"><span>Total Cost:</span><strong className="font-mono text-slate-800">Rs. {(summaryReport.vatPurchaseTotal || 0).toFixed(2)}</strong></div>
                      <div className="flex justify-between text-xs text-slate-500"><span>VAT Paid:</span><strong className="font-mono text-rose-600">Rs. {(summaryReport.vatPaid || 0).toFixed(2)}</strong></div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-700">Net VAT Payable:</span>
                    <strong className={`font-mono text-base ${summaryReport.netVatPayable >= 0 ? 'text-blue-700' : 'text-emerald-600'}`}>
                      Rs. {(summaryReport.netVatPayable || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>

                {/* Non-VAT Section */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-slate-500" />
                    <span>Non-VAT Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Sales (Billing)</span>
                      <div className="flex justify-between text-xs text-slate-500"><span>Count:</span><strong className="text-slate-800">{summaryReport.nonVatInvoiceCount}</strong></div>
                      <div className="flex justify-between text-xs text-slate-500"><span>Total Sales:</span><strong className="font-mono text-slate-800">Rs. {summaryReport.nonVatInvoiceTotal.toFixed(2)}</strong></div>
                    </div>
                    <div className="space-y-2 border-l border-slate-100 pl-4">
                      <span className="text-xs font-bold text-slate-400 uppercase">Purchases (Restock)</span>
                      <div className="flex justify-between text-xs text-slate-500"><span>Count:</span><strong className="text-slate-800">{summaryReport.nonVatPurchaseCount || 0}</strong></div>
                      <div className="flex justify-between text-xs text-slate-500"><span>Total Cost:</span><strong className="font-mono text-slate-800">Rs. {(summaryReport.nonVatPurchaseTotal || 0).toFixed(2)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-between">
                <span className="text-sm font-bold text-sky-700 uppercase tracking-wide">Outstanding Dues (Unpaid, in range)</span>
                <span className="text-2xl font-bold text-sky-700 font-mono">Rs. {summaryReport.outstandingDues.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'dues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Total Outstanding Dues</span>
              <p className="text-2xl font-bold text-sky-600 font-mono">Rs. {(duesReport.totalDue || 0).toFixed(2)}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Across {duesReport.customerCount || 0} customer{duesReport.customerCount === 1 ? '' : 's'}</span>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Unpaid / Partially-Paid Invoices</span>
              <p className="text-2xl font-bold text-slate-900 font-mono">{duesReport.invoiceCount || 0}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">{duesMonth || duesYear ? 'In the selected period' : 'All time'}</span>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <Users className="w-5 h-5 text-sky-600" />
                <span>Customers With Outstanding Dues</span>
              </h3>
            </div>

            {duesLoading ? (
              <div className="py-12 text-center"><Loader2 className="w-6 h-6 text-sky-600 animate-spin mx-auto" /></div>
            ) : duesReport.customers.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No outstanding dues found{duesMonth || duesYear ? ' for the selected period' : ''}.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {duesReport.customers.length} Customer Record(s) Found
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">Click row to reveal invoice details</span>
                </div>
                <div className="overflow-x-auto max-h-[calc(100vh-340px)] min-h-[350px] overflow-y-auto pr-1">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 uppercase font-bold tracking-wide text-xs">
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3 text-right">Invoices</th>
                      <th className="py-2.5 px-3 text-right">Amount Due</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {duesReport.customers.map((c) => {
                      const isExpanded = expandedCustomerId === c.customerId;
                      return (
                        <React.Fragment key={c.customerId}>
                          <tr
                            onClick={() => setExpandedCustomerId(isExpanded ? null : c.customerId)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                            <td className="py-2.5 px-3 text-slate-500">{c.phone || '—'}</td>
                            <td className="py-2.5 px-3 text-right">{c.invoiceCount}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-700">Rs. {c.totalDue.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 inline" /> : <ChevronDown className="w-4 h-4 text-slate-400 inline" />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="px-3 pb-4 bg-slate-50/60">
                                <table className="min-w-full text-xs">
                                  <thead>
                                    <tr className="text-slate-400 uppercase font-bold tracking-wide">
                                      <th className="py-2 px-2 text-left">Invoice No</th>
                                      <th className="py-2 px-2 text-left">Date</th>
                                      <th className="py-2 px-2 text-left">Status</th>
                                      <th className="py-2 px-2 text-right">Total</th>
                                      <th className="py-2 px-2 text-right">Due</th>
                                      <th className="py-2 px-2 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {c.invoices.map((inv) => (
                                      <tr key={inv._id}>
                                        <td className="py-2 px-2 font-mono font-bold text-slate-700">{inv.invoiceNo}</td>
                                        <td className="py-2 px-2 text-slate-500">{formatNepaliDate(inv.createdAt)}</td>
                                        <td className="py-2 px-2 text-slate-500 capitalize">{inv.status.replace('-', ' ')}</td>
                                        <td className="py-2 px-2 text-right font-mono text-slate-700">Rs. {inv.total.toFixed(2)}</td>
                                        <td className="py-2 px-2 text-right font-mono font-bold text-sky-700">Rs. {inv.amountDue.toFixed(2)}</td>
                                        <td className="py-2 px-2 text-right">
                                          <Link
                                            to={`/invoices?invoiceId=${inv._id}&pay=1`}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                                          >
                                            <Receipt className="w-3 h-3" />
                                            <span>Record Payment</span>
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Modal: Add Manual Expenditure */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Operating Expense</h2>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpenditure} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Expense Category *</label>
                <select
                  required
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-bold cursor-pointer"
                >
                  <option value="">Select category...</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Utilities">Utility Bills (Water, Electricity)</option>
                  <option value="Salaries">Staff Salaries</option>
                  <option value="Marketing">Marketing &amp; Ads</option>
                  <option value="Tools & Supplies">Equipment &amp; Tool Repairs</option>
                  <option value="Office Expense">Office Stationery &amp; Supplies</option>
                  <option value="Tax">Government Taxes / Business Fees</option>
                  <option value="Other">Other Overhead</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Expense Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Transaction Date *</label>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Expense Description / Notes</label>
                <textarea
                  placeholder="e.g. Paid electricity bill for showroom for June 2026..."
                  value={newExpense.note}
                  onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                  rows="3"
                  className="block w-full rounded-xl border-slate-200 text-sm resize-none py-3 px-3.5"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
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
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Record Expense</span>
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
