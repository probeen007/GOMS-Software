import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  XCircle,
  Clock,
  User,
  Activity,
  Globe,
  Loader2
} from 'lucide-react';

export default function AuditLogs() {
  // Query Filters State
  const [module, setModule] = useState('all');
  const [userEmail, setUserEmail] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Data & UI State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async (currentPage = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: 15,
        module,
        userEmail: userEmail.trim(),
        action: action.trim(),
        startDate,
        endDate
      };

      const response = await axios.get('/api/audit-logs', { params });
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
      setTotalLogs(response.data.totalLogs);
      setPage(response.data.currentPage);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch when page, module, dates change
  useEffect(() => {
    fetchLogs(1);
  }, [module, startDate, endDate]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setModule('all');
    setUserEmail('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Administrative Audit Log
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-semibold">
            System activity logs and security audit trail.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLogs(page, true)}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer"
        >
          {refreshing ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin text-primary-500" />
          ) : (
            <RefreshCw className="w-4.5 h-4.5 text-slate-400" />
          )}
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* User Search */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-xs font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <User className="w-4 h-4 text-primary-500" />
                User Email
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. admin@drivesync.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 rounded-xl text-sm font-semibold text-slate-205 bg-slate-950 border border-slate-800 focus:outline-none focus:border-primary-555 transition-colors"
                />
              </div>
            </div>

            {/* Action Search */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-xs font-extrabold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <Activity className="w-4 h-4 text-primary-500" />
                Action Tag
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. quotation_approved"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 rounded-xl text-sm font-semibold text-slate-205 bg-slate-950 border border-slate-800 focus:outline-none focus:border-primary-555 transition-colors"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-xs font-extrabold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <Globe className="w-4 h-4 text-primary-500" />
                System Module
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl text-sm font-bold text-slate-205 bg-slate-950 border border-slate-800 focus:outline-none focus:border-primary-555 transition-colors cursor-pointer"
              >
                <option value="all">All Modules</option>
                <option value="auth">Authentication</option>
                <option value="customers">Customers & Vehicles</option>
                <option value="inventory">Inventory & Purchases</option>
                <option value="appointments">Appointments</option>
                <option value="quotations">Quotations</option>
                <option value="job-cards">Job Cards</option>
                <option value="invoices">Invoices & Payments</option>
                <option value="loyalty">Loyalty System</option>
                <option value="finance">Finance Ledger</option>
                <option value="staff">Staff Directory</option>
                <option value="tasks">Tasks & To-Do List</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-xs font-extrabold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-4 h-4 text-primary-500" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl text-sm font-semibold text-slate-205 bg-slate-950 border border-slate-800 focus:outline-none focus:border-primary-555 transition-colors cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-xs font-extrabold text-slate-455 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
                <Calendar className="w-4 h-4 text-primary-500" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl text-sm font-semibold text-slate-205 bg-slate-950 border border-slate-800 focus:outline-none focus:border-primary-555 transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {(userEmail || action || module !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-4.5 h-4.5" />
                <span>Clear Filters</span>
              </button>
            )}

            <button
              type="submit"
              className="px-5 h-10 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 transition-all duration-200 cursor-pointer shadow-lg shadow-primary-500/10"
            >
              Apply Searches
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Ledger View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-400 mt-3 font-semibold">Retrieving audit log entries...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 text-center">
          <FileText className="w-12 h-12 text-slate-650 mb-3" />
          <h3 className="text-base font-extrabold text-white">No audit records found</h3>
          <p className="text-slate-500 text-sm mt-1">Try widening your date range or adjusting user search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/85">
                    <th className="px-5 py-4 text-left text-xs font-extrabold text-slate-450 uppercase tracking-widest">Timestamp</th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold text-slate-455 uppercase tracking-widest">User</th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold text-slate-455 uppercase tracking-widest">Action</th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold text-slate-455 uppercase tracking-widest">Module</th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold text-slate-455 uppercase tracking-widest">Details</th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold text-slate-455 uppercase tracking-widest">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-900/25 transition-colors text-sm">
                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-sm font-semibold">{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/65 shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-slate-900 leading-tight">{log.userName}</div>
                            <div className="text-xs text-slate-500 font-semibold mt-0.5">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action Tag */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border bg-slate-900 border-slate-750 text-slate-300">
                          {log.action}
                        </span>
                      </td>

                      {/* Module Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          log.module === 'auth'
                            ? 'bg-sky-500/5 text-sky-400 border-sky-500/10'
                            : log.module === 'staff'
                            ? 'bg-violet-500/5 text-violet-400 border-violet-500/10'
                            : log.module === 'inventory'
                            ? 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                            : log.module === 'invoices'
                            ? 'bg-emerald-500/5 text-emerald-450 border-emerald-500/10'
                            : log.module === 'appointments'
                            ? 'bg-teal-500/5 text-teal-400 border-teal-500/10'
                            : log.module === 'quotations'
                            ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10'
                            : log.module === 'job-cards'
                            ? 'bg-amber-500/5 text-amber-400 border-amber-500/10'
                            : log.module === 'loyalty'
                            ? 'bg-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/10'
                            : log.module === 'finance'
                            ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                            : log.module === 'tasks'
                            ? 'bg-orange-500/5 text-orange-400 border-orange-500/10'
                            : log.module === 'customers'
                            ? 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10'
                            : 'bg-slate-800 text-slate-400 border-slate-700/50'
                        }`}>
                          {log.module}
                        </span>
                      </td>

                      {/* Details Description */}
                      <td className="px-5 py-4 max-w-sm">
                        <p className="text-sm text-slate-350 leading-relaxed font-semibold break-words">
                          {log.details}
                        </p>
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Globe className="w-4 h-4 text-slate-655 shrink-0" />
                          <span className="text-sm font-mono font-medium">{log.ipAddress || 'Internal'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-5 bg-slate-950 border border-slate-850 rounded-3xl">
              <div className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">
                Showing page <span className="text-slate-900 font-black">{page}</span> of <span className="text-slate-900 font-black">{totalPages}</span> ({totalLogs} logs total)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
