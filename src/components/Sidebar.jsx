import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Calendar,
  ClipboardList,
  Receipt,
  Award,
  TrendingUp,
  UserCheck,
  History,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  BookOpen,
  Settings
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  
  // Local state for collapsed sidebar on desktop, saved in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    const handleCollapseChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('storage', handleCollapseChange);
    window.addEventListener('sidebar-collapsed-change', handleCollapseChange);
    return () => {
      window.removeEventListener('storage', handleCollapseChange);
      window.removeEventListener('sidebar-collapsed-change', handleCollapseChange);
    };
  }, []);

  if (!user) return null;

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      window.dispatchEvent(new Event('sidebar-collapsed-change'));
      return next;
    });
  };

  // Complete list of module-based routes
  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'receptionist', 'technician', 'accountant']
    },
    {
      path: '/tasks',
      label: 'To-Do List',
      icon: ClipboardList,
      roles: ['admin', 'receptionist', 'accountant', 'technician']
    },
    {
      path: '/customers',
      label: 'Customers & Vehicles',
      icon: Users,
      roles: ['admin', 'receptionist', 'technician']
    },
    {
      path: '/inventory',
      label: 'Inventory & Parts',
      icon: Wrench,
      roles: ['admin', 'technician', 'accountant']
    },
    {
      path: '/appointments',
      label: 'Appointments',
      icon: Calendar,
      roles: ['admin', 'receptionist', 'technician']
    },
    {
      path: '/servicing',
      label: 'Servicing',
      icon: Wrench,
      roles: ['admin', 'receptionist', 'technician', 'accountant']
    },
    {
      path: '/invoices',
      label: 'Invoices & Payments',
      icon: Receipt,
      roles: ['admin', 'receptionist', 'accountant']
    },
    {
      path: '/loyalty',
      label: 'Loyalty Ledger',
      icon: Award,
      roles: ['admin', 'receptionist', 'accountant']
    },
    {
      path: '/finance',
      label: 'Finance Reports',
      icon: TrendingUp,
      roles: ['admin', 'accountant']
    },
    {
      path: '/daybook',
      label: 'Daily Day Book',
      icon: BookOpen,
      roles: ['admin', 'accountant', 'receptionist']
    },
    {
      path: '/staff',
      label: 'Staff & Roles',
      icon: UserCheck,
      roles: ['admin']
    },
    {
      path: '/audit-logs',
      label: 'Audit Logs',
      icon: History,
      roles: ['admin']
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      roles: ['admin', 'accountant', 'receptionist', 'technician']
    }
  ];

  // Filter items based on the user's role
  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Logo Header */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center py-5 px-2' : 'justify-between px-6 py-5'} border-b border-slate-100 bg-slate-50/50 transition-all duration-300`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight transition-all duration-300">
              PM Auto Mobiles
            </h1>
          </div>
        )}
        {isCollapsed && (
          <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        )}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-5 overflow-y-auto space-y-2 transition-all duration-300`}>
        {allowedMenuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 gap-3.5'} rounded-xl transition-all duration-300 group text-sm font-bold border ${
                  isActive
                    ? 'bg-blue-50/60 text-blue-600 border-blue-100/50 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                }`
              }
              end={item.path === '/'}
              title={isCollapsed ? item.label : ''}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5.5 h-5.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="transition-opacity duration-300 opacity-100 whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'gap-3.5 p-2'} rounded-xl bg-white border border-slate-200 transition-all duration-300`}>
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 uppercase text-sm shrink-0">
            {user.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 transition-all duration-300">
              <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 ease-in-out lg:static lg:block ${
          isCollapsed ? 'w-20' : 'w-72'
        } ${
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
