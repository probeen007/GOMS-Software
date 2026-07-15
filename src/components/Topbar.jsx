import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, LogOut, CheckSquare, BellOff, ExternalLink, Loader2, HelpCircle } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { formatNepaliDate } from '../utils/nepaliDate';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  if (!user) return null;

  // Derive page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/customers')) return 'Customers & Vehicles';
    if (path.startsWith('/inventory')) return 'Inventory & Parts';
    if (path.startsWith('/appointments')) return 'Appointments';
    if (path.startsWith('/servicing')) return 'Servicing';
    if (path.startsWith('/invoices')) return 'Invoices & Payments';
    if (path.startsWith('/loyalty')) return 'Loyalty Ledger';
    if (path.startsWith('/finance')) return 'Financial Cash Flow';
    if (path.startsWith('/staff')) return 'Staff Directory';
    if (path.startsWith('/tasks')) return 'To-Do List';
    if (path.startsWith('/notifications')) return 'All Notifications';
    if (path.startsWith('/audit-logs')) return 'Audit Logs';
    return 'PM Auto Mobiles Portal';
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Poll for notifications every 20 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single notification as read
  const handleMarkAsRead = async (id, link) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      fetchNotifications();
      if (link) {
        setIsOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await axios.post('/api/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date/time to human readable relative time
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatNepaliDate(past);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      {/* Left side: Hamburger (mobile) + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{getPageTitle()}</h2>
        </div>
      </div>

      {/* Right side: Notifications bell + User actions */}
      <div className="flex items-center gap-4">
        {/* User Manual Link */}
        <a
          href="/user-manual.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center w-7 h-7 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-100 transition-all duration-200"
          title="User Manual"
        >
          <HelpCircle className="w-4 h-4" />
        </a>

        {/* Role badge */}
        <div className="hidden sm:block text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {user.role}
        </div>

        {/* Notifications Icon & Popover */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-xl transition-all duration-200 ${
              isOpen
                ? 'text-blue-600 bg-blue-50/80 border border-blue-100'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white border border-white animate-in zoom-in duration-200">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-3 top-full w-80 sm:w-96 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              {/* Dropdown Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{unreadCount} unread message(s)</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 font-bold transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckSquare className="w-3 h-3 text-blue-600" />
                    )}
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                    <BellOff className="w-7 h-7 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">All caught up!</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No notifications to display.</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((noti) => {
                    const isUnread = !noti.readBy.some((id) => id === user.id);
                    return (
                      <div
                        key={noti._id}
                        onClick={() => handleMarkAsRead(noti._id, noti.link)}
                        className={`p-4 flex gap-3 cursor-pointer transition-colors relative group ${
                          isUnread ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Unread indicator dot */}
                        {isUnread && (
                          <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}

                        {/* Icon based on notification type */}
                        <div className="mt-0.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-[10px] font-bold ${
                            noti.type === 'inventory'
                              ? 'bg-rose-50 border-rose-100 text-rose-600'
                              : noti.type === 'payment'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              : noti.type === 'appointment'
                              ? 'bg-sky-50 border-sky-100 text-sky-600'
                              : 'bg-blue-50 border-blue-100 text-blue-600'
                          }`}>
                            {noti.type ? noti.type.charAt(0).toUpperCase() : 'S'}
                          </div>
                        </div>

                        {/* Title and Message */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 justify-between">
                            <h4 className={`text-xs truncate font-bold ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                              {noti.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {noti.message}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {formatRelativeTime(noti.createdAt)}
                            </span>
                            {noti.link && (
                              <span className="text-[9px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                                <span>View details</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Footer */}
              <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="inline-block text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-colors uppercase tracking-wider"
                >
                  View All Notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Public Website / Landing Page Link */}
        <a
          href="/landing.html"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200"
          title="Go to Public Website"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          <span>Public Website</span>
        </a>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-200"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
