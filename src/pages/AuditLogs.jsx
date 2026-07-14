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
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const MODULE_COLOR = {
  auth:         'bg-blue-50 text-blue-700 border-blue-100',
  staff:        'bg-violet-50 text-violet-700 border-violet-100',
  inventory:    'bg-rose-50 text-rose-700 border-rose-100',
  invoices:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  appointments: 'bg-sky-50 text-sky-700 border-sky-100',
  servicing:    'bg-amber-50 text-amber-700 border-amber-100',
  loyalty:      'bg-purple-50 text-purple-700 border-purple-100',
  finance:      'bg-teal-50 text-teal-700 border-teal-100',
  tasks:        'bg-orange-50 text-orange-700 border-orange-100',
  customers:    'bg-indigo-50 text-indigo-700 border-indigo-100'
};

export default function AuditLogs() {
  const [module, setModule]       = useState('all');
  const [userEmail, setUserEmail] = useState('');
  const [action, setAction]       = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs]   = useState(0);

  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Track which row's detail panel is open
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = async (currentPage = page, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 25,
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
      setExpandedId(null);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, [module, startDate, endDate]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchLogs(1); };

  const handleClearFilters = () => {
    setModule('all'); setUserEmail(''); setAction('');
    setStartDate(''); setEndDate(''); setPage(1);
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-4">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Audit Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">System activity and security audit trail</p>
        </div>
        <button
          type="button"
          onClick={() => fetchLogs(page, true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
        >
          {refreshing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            : <RefreshCw className="w-3.5 h-3.5 text-slate-400" />}
          Refresh
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
        <form onSubmit={handleSearchSubmit}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3 h-3" /> User Email
              </label>
              <input
                type="text"
                placeholder="e.g. admin@pmautomo..."
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full h-8 text-xs rounded-lg border-slate-200 px-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Search className="w-3 h-3" /> Action Tag
              </label>
              <input
                type="text"
                placeholder="e.g. invoice_generated"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full h-8 text-xs rounded-lg border-slate-200 px-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3" /> Module
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full h-8 text-xs rounded-lg border-slate-200 px-2 cursor-pointer"
              >
                <option value="all">All Modules</option>
                <option value="auth">Authentication</option>
                <option value="customers">Customers</option>
                <option value="inventory">Inventory</option>
                <option value="appointments">Appointments</option>
                <option value="servicing">Servicing</option>
                <option value="invoices">Invoices</option>
                <option value="loyalty">Loyalty</option>
                <option value="finance">Finance</option>
                <option value="staff">Staff</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-8 text-xs rounded-lg border-slate-200 px-2 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-8 text-xs rounded-lg border-slate-200 px-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
            {(userEmail || action || module !== 'all' || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 h-7 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            <button
              type="submit"
              className="px-4 h-7 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
            >
              Apply Search
            </button>
          </div>
        </form>
      </div>

      {/* Log Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 mt-2 font-semibold">Loading audit entries...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[45vh] bg-white border border-slate-200 rounded-xl text-center">
          <FileText className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-700">No audit records found</p>
          <p className="text-[11px] text-slate-400 mt-1">Adjust your filters and try again.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Summary bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {totalLogs} total entries — Page {page} of {totalPages}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Click "Detail" to expand a row</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-36">Timestamp</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module</th>
                    <th className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-24">IP</th>
                    <th className="px-3 py-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isOpen = expandedId === log._id;
                    return (
                      <React.Fragment key={log._id}>
                        {/* Main compact row */}
                        <tr className={`border-b border-slate-100 transition-colors ${isOpen ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-[11px] font-mono text-slate-600">
                              {formatNepaliDateTime(log.createdAt)}
                            </span>
                          </td>

                          <td className="px-3 py-2">
                            <div className="text-[11px] font-semibold text-slate-800 leading-none">{log.userName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 leading-none">{log.userEmail}</div>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                              {log.action}
                            </span>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${MODULE_COLOR[log.module] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {log.module}
                            </span>
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-[10px] font-mono text-slate-400">{log.ipAddress || '—'}</span>
                          </td>

                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => toggleExpand(log._id)}
                              className={`inline-flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                                isOpen
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                              }`}
                            >
                              Detail
                              {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isOpen && (
                          <tr className="border-b border-slate-200">
                            <td colSpan={6} className="px-4 py-3 bg-blue-50/30">
                              <div className="flex items-start gap-2">
                                <div className="w-1 self-stretch rounded-full bg-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                                  {log.details || 'No additional detail recorded.'}
                                </p>
                              </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-[11px] text-slate-500 font-semibold">
                Page <strong className="text-slate-800">{page}</strong> / <strong className="text-slate-800">{totalPages}</strong>
                <span className="text-slate-400 ml-1">({totalLogs} logs)</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
