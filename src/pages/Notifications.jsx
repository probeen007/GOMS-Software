import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDateTime } from '../utils/nepaliDate';
import {
  CheckSquare,
  ExternalLink,
  Loader2,
  Calendar,
  Inbox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_STYLES = {
  inventory: { icon: 'bg-rose-50 border-rose-100 text-rose-600', badge: 'badge-rose' },
  payment: { icon: 'bg-emerald-50 border-emerald-100 text-emerald-600', badge: 'badge-emerald' },
  appointment: { icon: 'bg-sky-50 border-sky-100 text-sky-600', badge: 'badge-blue' },
  servicing: { icon: 'bg-blue-50 border-blue-100 text-blue-600', badge: 'badge-indigo' }
};
const DEFAULT_TYPE_STYLE = { icon: 'bg-blue-50 border-blue-100 text-blue-600', badge: 'badge-slate' };

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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            View workshop alerts, appointment updates, servicing status, and payments.
          </p>
        </div>

        {notifications.some((n) => !n.readBy.some((id) => id === user.id)) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={bulkLoading}
            className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/10 disabled:opacity-50 cursor-pointer"
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
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status:</span>
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                filter === 'read' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Read
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 h-9 rounded-xl border-slate-200 text-xs font-semibold cursor-pointer"
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
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-3 font-medium">Retrieving alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <Inbox className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
          <p className="text-slate-500 text-sm mt-0.5">There are no alerts matching your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((noti) => {
            const isRead = noti.readBy.some((id) => id === user.id);
            const typeStyle = TYPE_STYLES[noti.type] || DEFAULT_TYPE_STYLE;
            return (
              <div
                key={noti._id}
                onClick={() => handleMarkAsRead(noti._id, noti.link)}
                className={`p-5 rounded-2xl border transition-all duration-200 relative group cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                  isRead ? 'bg-white border-slate-200' : 'bg-blue-50/30 border-blue-100'
                }`}
              >
                {/* Visual Unread Bar */}
                {!isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-blue-500" />
                )}

                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xs font-bold shrink-0 ${typeStyle.icon}`}>
                    {noti.type ? noti.type.charAt(0).toUpperCase() : 'S'}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        {noti.title}
                      </h3>
                      <span className={typeStyle.badge}>
                        {noti.type || 'system'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {noti.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateTime(noti.createdAt)}</span>
                  </div>

                  {noti.link && (
                    <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
