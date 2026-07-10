import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatNepaliDateTime } from '../utils/nepaliDate';
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

const MODULE_BADGE_CLASS = {
  auth: 'badge-blue',
  staff: 'badge-violet',
  inventory: 'badge-rose',
  invoices: 'badge-emerald',
  appointments: 'badge-blue',
  servicing: 'badge-amber',
  loyalty: 'badge-violet',
  finance: 'badge-emerald',
  tasks: 'badge-amber',
  customers: 'badge-blue'
};

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

  const formatDateTime = (dateString) => formatNepaliDateTime(dateString);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Audit Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System activity logs and security audit trail.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchLogs(page, true)}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
        >
          {refreshing ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin text-blue-600" />
          ) : (
            <RefreshCw className="w-4.5 h-4.5 text-slate-400" />
          )}
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* User Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                User Email
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. admin@pmautomobiles.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 rounded-xl border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Action Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                Action Tag
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. invoice_generated"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 rounded-xl border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                System Module
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl border-slate-200 text-sm font-bold cursor-pointer"
              >
                <option value="all">All Modules</option>
                <option value="auth">Authentication</option>
                <option value="customers">Customers & Vehicles</option>
                <option value="inventory">Inventory & Purchases</option>
                <option value="appointments">Appointments</option>
                <option value="servicing">Servicing</option>
                <option value="invoices">Invoices & Payments</option>
                <option value="loyalty">Loyalty System</option>
                <option value="finance">Finance Ledger</option>
                <option value="staff">Staff Directory</option>
                <option value="tasks">Tasks & To-Do List</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {(userEmail || action || module !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <XCircle className="w-4.5 h-4.5" />
                <span>Clear Filters</span>
              </button>
            )}

            <button
              type="submit"
              className="px-5 h-10 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
            >
              Apply Search
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Ledger View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 mt-3 font-semibold">Retrieving audit log entries...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No audit records found</h3>
          <p className="text-slate-500 text-sm mt-1">Try widening your date range or adjusting user search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Timestamp</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Module</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Details</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors text-sm">
                      {/* Timestamp */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-semibold">{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 leading-tight">{log.userName}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{log.userEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action Tag */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="badge-slate">
                          {log.action}
                        </span>
                      </td>

                      {/* Module Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={MODULE_BADGE_CLASS[log.module] || 'badge-slate'}>
                          {log.module}
                        </span>
                      </td>

                      {/* Details Description */}
                      <td className="px-5 py-4 max-w-sm">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium break-words">
                          {log.details}
                        </p>
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Globe className="w-4 h-4 text-slate-300 shrink-0" />
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
            <div className="flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                Showing page <span className="text-slate-900 font-bold">{page}</span> of <span className="text-slate-900 font-bold">{totalPages}</span> ({totalLogs} logs total)
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
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
