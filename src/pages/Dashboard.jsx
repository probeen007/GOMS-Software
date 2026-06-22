import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Calendar,
  ClipboardList,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Clock,
  CheckCircle2,
  UserCheck,
  Plus,
  Play,
  Check,
  Bell,
  ArrowRight,
  Info,
  Loader2,
  Car,
  Wrench
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [metrics, setMetrics] = useState(null);
  const [cashFlow, setCashFlow] = useState({ chartData: [], summary: {} });
  const [appointments, setAppointments] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month');

  // Actions states
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboardData = async (filterVal = timeFilter) => {
    try {
      setLoading(true);
      const summaryRes = await axios.get('/api/analytics/summary', {
        params: { filter: filterVal }
      });
      setMetrics(summaryRes.data.metrics);

      if (user.role === 'admin' || user.role === 'accountant') {
        const cashFlowRes = await axios.get('/api/finance/cash-flow');
        setCashFlow(cashFlowRes.data);
        const invoiceRes = await axios.get('/api/invoices');
        setUnpaidInvoices(invoiceRes.data.filter((inv) => inv.status !== 'paid').slice(0, 5));
      }

      if (user.role === 'admin' || user.role === 'receptionist') {
        const apptRes = await axios.get('/api/appointments');
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysAppts = apptRes.data.filter((a) => a.dateTime.startsWith(todayStr));
        setAppointments(todaysAppts.slice(0, 5));
      }

      if (user.role === 'admin' || user.role === 'technician') {
        const jobRes = await axios.get('/api/job-cards');
        setJobCards(jobRes.data.filter((jc) => jc.status === 'open').slice(0, 5));
      }

      const notiRes = await axios.get('/api/notifications');
      setNotifications(notiRes.data.notifications.slice(0, 4));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData(timeFilter);
    }
  }, [user, timeFilter]);

  const handleCheckIn = async (apptId) => {
    setActionLoading(apptId);
    try {
      await axios.patch(`/api/appointments/${apptId}/check-in`);
      fetchDashboardData();
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAppt = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setActionLoading(apptId);
    try {
      await axios.patch(`/api/appointments/${apptId}`, { status: 'cancelled' });
      fetchDashboardData();
    } catch (err) {
      console.error('Cancellation error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-xs mt-3 font-semibold">Loading live workspace state...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. WELCOME HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
            Live operational stats and workshop KPI metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Period:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none transition-all cursor-pointer"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Status</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ONLINE</span>
            </span>
          </div>
        </div>
      </div>

      {/* 1.5 FINANCIAL SUMMARY LEDGER RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        <div className="space-y-1.5 lg:first:pl-0 lg:pl-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Inflow (Income)</span>
          <span className="text-xl font-extrabold text-emerald-600 tracking-tight block">
            Rs. {metrics?.totalIncome?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </span>
        </div>
        <div className="space-y-1.5 pt-4 lg:pt-0 lg:pl-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Outflow (Expense)</span>
          <span className="text-xl font-extrabold text-rose-600 tracking-tight block">
            Rs. {metrics?.totalExpenditures?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </span>
        </div>
        <div className="space-y-1.5 pt-4 lg:pt-0 lg:pl-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Net Revenue (Profit)</span>
          <span className={`text-xl font-extrabold tracking-tight block ${metrics?.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            Rs. {metrics?.netProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </span>
        </div>
        <div className="space-y-1.5 pt-4 lg:pt-0 lg:pl-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Outstanding Dues</span>
          <span className="text-xl font-extrabold text-blue-600 tracking-tight block">
            Rs. {metrics?.totalOutstanding?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
          </span>
        </div>
      </div>

      {/* 2. KPI METRICS GRIDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Vehicles Serviced */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100/50 group-hover:bg-sky-100 transition-colors">
              <Car className="w-5.5 h-5.5" />
            </div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Serviced</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.vehiclesServiced || 0}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Vehicles serviced</p>
          </div>
        </div>

        {/* Card 2: Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100/50 group-hover:bg-violet-100 transition-colors">
              <Users className="w-5.5 h-5.5" />
            </div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Customers</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.totalCustomers || 0}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Client directory</p>
          </div>
        </div>

        {/* Card 3: Pending Services */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/50 group-hover:bg-amber-100 transition-colors">
              <Wrench className="w-5.5 h-5.5" />
            </div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pending</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.pendingServices || 0}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Jobs in progress</p>
          </div>
        </div>

        {/* Card 4: Upcoming Service Reminders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-pink-50 text-pink-650 border border-pink-100/50 group-hover:bg-pink-100 transition-colors">
              <Bell className="w-5.5 h-5.5" />
            </div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Reminders</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.upcomingServiceReminders || 0}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Next service due</p>
          </div>
        </div>

        {/* Card 5: Staff Present Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/50 group-hover:bg-emerald-100 transition-colors">
              <UserCheck className="w-5.5 h-5.5" />
            </div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Attendance</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.staffPresentToday || 0}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Staff present</p>
          </div>
        </div>

        {/* Card 6: Completed Services */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100/50 group-hover:bg-teal-100 transition-colors">
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Completed</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {metrics?.completedServices || 0}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Finished services</p>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC ROLE-SPECIFIC WORKSPACES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (COL-SPAN-2): MAIN ROLE WORK AREA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. ACCOUNTANT / ADMIN VIEW: CASH FLOW CHART + UNPAID INVOICES */}
          {(user.role === 'admin' || user.role === 'accountant') && (
            <>
              {/* Cash Flow Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Cash Flow Dynamics</h2>
                    <p className="text-xs text-slate-550 mt-0.5">Vibrant area chart of daily income vs expenditures (last 30 days)</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                      <span>Income</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-600">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
                      <span>Expense</span>
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {cashFlow.chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Info className="w-7 h-7 text-slate-400 mb-2" />
                      <p className="text-xs font-semibold text-slate-550">No transaction trends found for this month.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlow.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expenditure" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Unpaid Invoices */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Dues & Overdue Billings</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Quick lookup of pending client invoices</p>
                  </div>
                  <Link to="/invoices" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                    <span>Manage all Invoices</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  {unpaidInvoices.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">All customer invoices are fully settled!</p>
                  ) : (
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="pb-2.5 font-bold">Invoice No</th>
                          <th className="pb-2.5 font-bold">Due Balance</th>
                          <th className="pb-2.5 font-bold">Status</th>
                          <th className="pb-2.5 text-right font-bold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {unpaidInvoices.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-55/40">
                            <td className="py-3 font-semibold text-slate-800">#{inv.invoiceNo}</td>
                            <td className="py-3 text-slate-900 font-bold">Rs. {inv.amountDue.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                inv.status === 'overdue' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                  to={`/invoices`}
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all inline-block"
                              >
                                Collect Payment
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* B. RECEPTIONIST VIEW: TODAY'S APPOINTMENTS & ACTIONS */}
          {(user.role === 'admin' || user.role === 'receptionist') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Today's Appointment Schedule</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Quick booking actions, check-ins, and state triggers</p>
                </div>
                <Link to="/appointments" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                  <span>View Full Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                    <Calendar className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-555">No appointments scheduled for today.</p>
                  </div>
                ) : (
                  appointments.map((appt) => {
                    const apptTime = new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={appt._id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-slate-100 text-blue-600 font-bold text-sm shrink-0 flex flex-col items-center justify-center min-w-16">
                            <Clock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                            <span>{apptTime}</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{appt.customerId?.name || 'Customer'}</span>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                appt.status === 'checked-in'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : appt.status === 'in-progress'
                                  ? 'bg-sky-50 text-sky-655 border border-sky-100'
                                  : appt.status === 'scheduled'
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                  : 'bg-slate-150 text-slate-600 border border-slate-250'
                              }`}>
                                {appt.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                              Vehicle Plate: <span className="text-slate-700">{appt.vehicleId?.plateNo || 'N/A'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {appt.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleCheckIn(appt._id)}
                                disabled={actionLoading === appt._id}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {actionLoading === appt._id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                                <span>Check-In</span>
                              </button>
                              <button
                                onClick={() => handleCancelAppt(appt._id)}
                                disabled={actionLoading === appt._id}
                                className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <span>Cancel</span>
                              </button>
                            </>
                          )}
                          {appt.status === 'checked-in' && (
                            <span className="text-xs text-emerald-650 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4 text-emerald-550" />
                              <span>Checked-In</span>
                            </span>
                          )}
                          {appt.status === 'in-progress' && (
                            <span className="text-xs text-sky-655 font-bold flex items-center gap-1.5 bg-sky-50 px-2.5 py-1.5 rounded-md border border-sky-100">
                              <Wrench className="w-4 h-4 text-sky-600" />
                              <span>Servicing...</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* C. TECHNICIAN VIEW: ASSIGNED JOB CARDS LIST */}
          {(user.role === 'admin' || user.role === 'technician') && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Your Assigned Work Orders</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Active servicing checklists and job cards assigned to you</p>
                </div>
                <Link to="/job-cards" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                  <span>Open Job Cards Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {jobCards.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                    <ClipboardList className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-500">All caught up! No active job cards allocated.</p>
                  </div>
                ) : (
                  jobCards.map((jc) => (
                    <div
                      key={jc._id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <span>Card ID: #{jc._id.toString().substring(18)}</span>
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                            {jc.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 font-semibold">
                          Client: <span className="text-slate-700">{jc.customerId?.name || 'Customer'}</span> | Plate:{' '}
                          <span className="text-slate-700">{jc.vehicleId?.plateNo || 'N/A'}</span>
                        </p>
                      </div>
                      <Link
                        to={`/job-cards`}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors cursor-pointer text-center inline-block"
                      >
                        Manage Worksheet
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN (COL-SPAN-1): ALERTS & SHORTCUTS PANEL */}
        <div className="space-y-6">
          
          {/* I. QUICK ACTIONS WIDGET */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Quick Actions Shortcuts</h2>
            
            <div className="grid grid-cols-1 gap-3">
              {(user.role === 'admin' || user.role === 'receptionist') && (
                <>
                  <Link
                    to="/appointments"
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 transition-all flex items-center gap-4 group text-left"
                  >
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-all shrink-0">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors block">Book Slots</span>
                      <span className="text-sm text-slate-450 block mt-0.5">Manage schedule</span>
                    </div>
                  </Link>
                  <Link
                    to="/customers"
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-violet-200 hover:shadow-md hover:shadow-violet-900/5 transition-all flex items-center gap-4 group text-left"
                  >
                    <div className="p-3 rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-all shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-base text-slate-800 group-hover:text-violet-600 transition-colors block">Register Client</span>
                      <span className="text-sm text-slate-450 block mt-0.5">Add new customer</span>
                    </div>
                  </Link>
                </>
              )}
              
              {(user.role === 'admin' || user.role === 'accountant') && (
                <>
                  <Link
                    to="/finance"
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-900/5 transition-all flex items-center gap-4 group text-left"
                  >
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-all shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-base text-slate-800 group-hover:text-emerald-600 transition-colors block">Record Expense</span>
                      <span className="text-sm text-slate-450 block mt-0.5">Log company spend</span>
                    </div>
                  </Link>
                  <Link
                    to="/invoices"
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 transition-all flex items-center gap-4 group text-left"
                  >
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-all shrink-0">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors block">View Invoices</span>
                      <span className="text-sm text-slate-450 block mt-0.5">Billing & receipts</span>
                    </div>
                  </Link>
                </>
              )}

              {(user.role === 'admin' || user.role === 'technician') && (
                <>
                  <Link
                    to="/inventory"
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 transition-all flex items-center gap-4 group text-left"
                  >
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-all shrink-0">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors block">Inventory Parts</span>
                      <span className="text-sm text-slate-450 block mt-0.5">Stock levels</span>
                    </div>
                  </Link>
                  <Link
                    to="/job-cards"
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 transition-all flex items-center gap-4 group text-left"
                  >
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-all shrink-0">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition-colors block">Service Cards</span>
                      <span className="text-sm text-slate-450 block mt-0.5">Active work orders</span>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* II. ALERTS & LIVE FEED WIDGET */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4.5 h-4.5 text-blue-600" />
                <span>Live Alert Feed</span>
              </h2>
              <Link to="/notifications" className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wider">
                Full Feed
              </Link>
            </div>

            <div className="space-y-3.5">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-550 text-center py-4">No recent activity logs.</p>
              ) : (
                notifications.map((noti) => (
                  <div key={noti._id} className="p-3 rounded-xl bg-slate-55/60 border border-slate-150 flex gap-3 items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-sm font-bold shrink-0 ${
                      noti.type === 'inventory'
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : noti.type === 'payment'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                      {noti.type ? noti.type.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-800 leading-tight truncate">{noti.title}</div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {noti.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
