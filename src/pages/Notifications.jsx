import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDateTime } from '../utils/nepaliDate';
import {
  Bell,
  CheckSquare,
  Trash2,
  ExternalLink,
  Loader2,
  Calendar,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'appointment', 'servicing', 'inventory', 'payment'
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark single as read
  const handleMarkAsRead = async (id, link) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      // Update state locally for instant feedback
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, readBy: [...n.readBy, user.id] }
            : n
        )
      );
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setBulkLoading(true);
    try {
      await axios.post('/api/notifications/read-all');
      // Refresh list
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  // Format date/time to Nepali BS display
  const formatDateTime = (dateString) => formatNepaliDateTime(dateString);

  // Filtered Notifications List
  const filteredNotifications = notifications.filter((noti) => {
    const isRead = noti.readBy.some((id) => id === user.id);
    
    // Status Filter
    if (filter === 'unread' && isRead) return false;
    if (filter === 'read' && !isRead) return false;

    // Type Filter
    if (typeFilter !== 'all' && noti.type !== typeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications Ledger</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            View workshop alerts, appointment updates, servicing status, and payments.
          </p>
        </div>

        {notifications.some((n) => !n.readBy.some((id) => id === user.id)) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={bulkLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-500 transition-all duration-200 shadow-lg shadow-primary-500/10 disabled:opacity-50"
          >
            {bulkLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Status:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                filter === 'read' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Read
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-800 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="appointment">Appointments</option>
            <option value="servicing">Servicing</option>
            <option value="inventory">Inventory Alerts</option>
            <option value="payment">Billing & Payments</option>
            <option value="system">System Updates</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-3 font-medium">Retrieving alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 text-center animate-in fade-in duration-300">
          <Inbox className="w-10 h-10 text-slate-650 mb-3" />
          <h3 className="text-base font-bold text-white">No notifications found</h3>
          <p className="text-slate-550 text-xs mt-0.5">There are no alerts matching your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((noti) => {
            const isRead = noti.readBy.some((id) => id === user.id);
            return (
              <div
                key={noti._id}
                onClick={() => handleMarkAsRead(noti._id, noti.link)}
                className={`p-5 rounded-2xl border transition-all duration-200 relative group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isRead
                    ? 'bg-slate-900/20 border-slate-850 hover:bg-slate-900/30'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/50 shadow-md shadow-primary-500/2'
                }`}
              >
                {/* Visual Unread Bar */}
                {!isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-primary-500" />
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xs font-bold shrink-0 ${
                    noti.type === 'inventory'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : noti.type === 'payment'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-455'
                      : noti.type === 'appointment'
                      ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                      : 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                  }`}>
                    {noti.type ? noti.type.charAt(0).toUpperCase() : 'S'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-bold ${isRead ? 'text-slate-200' : 'text-white'}`}>
                        {noti.title}
                      </h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        noti.type === 'inventory'
                          ? 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                          : noti.type === 'payment'
                          ? 'bg-emerald-500/5 text-emerald-450 border-emerald-500/10'
                          : noti.type === 'appointment'
                          ? 'bg-sky-500/5 text-sky-400 border-sky-500/10'
                          : 'bg-slate-800 text-slate-400 border-slate-700/50'
                      }`}>
                        {noti.type || 'system'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                      {noti.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800/40 pt-3 md:pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateTime(noti.createdAt)}</span>
                  </div>

                  {noti.link && (
                    <span className="text-[10px] text-primary-400 font-bold flex items-center gap-1 transition-all md:opacity-0 md:group-hover:opacity-100">
                      <span>Navigate</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
