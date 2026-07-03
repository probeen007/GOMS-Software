import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Key,
  Power,
  Edit3,
  Loader2,
  X,
  AlertCircle,
  Plus,
  Lock,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';

export default function Staff() {
  const { user: currentUser } = useAuth();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'attendance' | 'salaries'

  // State: Staff directory
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal: Add Staff
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'technician', baseSalary: 30000, hourlyRate: 200 });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Modal: Edit Staff
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStaff, setEditStaff] = useState({ _id: '', name: '', email: '', role: '', baseSalary: 30000, hourlyRate: 200 });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Modal: Reset Password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // State: Attendance Tab
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [saveAttendanceLoading, setSaveAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState('');

  // State: Salary Tab
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth());
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [salarySheet, setSalarySheet] = useState([]);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payMethod, setPayMethod] = useState('bank-transfer');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/staff');
      setStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance for selected date
  const fetchAttendance = async (dateVal) => {
    setAttendanceLoading(true);
    setAttendanceMessage('');
    try {
      const response = await axios.get('/api/staff/attendance', {
        params: { date: dateVal }
      });

      // Map existing records or initialize default records
      const activeStaff = staff.filter((s) => s.isActive);
      const mapped = activeStaff.map((member) => {
        const existing = response.data.find(
          (r) => r.userId && r.userId._id === member._id
        );
        return {
          userId: member._id,
          name: member.name,
          role: member.role,
          status: existing ? existing.status : 'present',
          workingHours: existing ? existing.workingHours : 8
        };
      });
      setAttendanceRecords(mapped);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch Salary Sheet
  const fetchSalarySheet = async () => {
    setSalaryLoading(true);
    try {
      const response = await axios.get('/api/staff/salary-sheet', {
        params: { month: salaryMonth, year: salaryYear }
      });
      setSalarySheet(response.data);
    } catch (error) {
      console.error('Error generating salary sheet:', error);
    } finally {
      setSalaryLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Trigger attendance fetching when tab or date changes
  useEffect(() => {
    if (activeTab === 'attendance' && staff.length > 0) {
      fetchAttendance(attendanceDate);
    } else if (activeTab === 'salaries') {
      fetchSalarySheet();
    }
  }, [activeTab, attendanceDate, staff, salaryMonth, salaryYear]);

  // Handle Create Staff Account
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.password || !newStaff.role) {
      setAddError('All fields are required');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      await axios.post('/api/staff', newStaff);
      setIsAddOpen(false);
      setNewStaff({ name: '', email: '', password: '', role: 'technician', baseSalary: 30000, hourlyRate: 200 });
      fetchStaff();
    } catch (err) {
      console.error(err);
      setAddError(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit Staff Details
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editStaff.name || !editStaff.email || !editStaff.role) {
      setEditError('Name, email, and role are required');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      await axios.patch(`/api/staff/${editStaff._id}`, {
        name: editStaff.name,
        email: editStaff.email,
        role: editStaff.role,
        baseSalary: Number(editStaff.baseSalary || 0),
        hourlyRate: Number(editStaff.hourlyRate || 0)
      });
      setIsEditOpen(false);
      fetchStaff();
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Failed to update staff account');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      await axios.patch(`/api/staff/${resetTarget._id}`, {
        password: newPassword
      });
      setIsResetOpen(false);
      setNewPassword('');
      setResetTarget(null);
      alert('Password updated successfully');
    } catch (err) {
      console.error(err);
      setResetError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setResetLoading(false);
    }
  };

  // Toggle Account Active Status
  const handleToggleActive = async (member) => {
    const action = member.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} the account for ${member.name}?`)) {
      return;
    }

    try {
      await axios.patch(`/api/staff/${member._id}`, {
        isActive: !member.isActive
      });
      fetchStaff();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || `Failed to ${action} user account`);
    }
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    setSaveAttendanceLoading(true);
    setAttendanceMessage('');
    try {
      await axios.post('/api/staff/attendance', {
        date: attendanceDate,
        records: attendanceRecords
      });
      setAttendanceMessage('Attendance saved successfully');
      setTimeout(() => setAttendanceMessage(''), 3000);
      fetchAttendance(attendanceDate);
    } catch (error) {
      console.error(error);
      alert('Failed to save attendance logs');
    } finally {
      setSaveAttendanceLoading(false);
    }
  };

  // Record salary payout
  const handlePaySalary = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    setPayError('');

    try {
      await axios.post('/api/staff/pay-salary', {
        userId: payTarget.userId,
        amount: payTarget.netPay,
        month: salaryMonth,
        year: salaryYear,
        method: payMethod
      });
      setIsPayModalOpen(false);
      setPayTarget(null);
      alert('Salary payout recorded successfully and charged to Expenditures.');
      fetchSalarySheet();
    } catch (error) {
      console.error(error);
      setPayError(error.response?.data?.message || 'Failed to record salary payout');
    } finally {
      setPayLoading(false);
    }
  };

  // Local helper for roles styling
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
      case 'receptionist':
        return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
      case 'technician':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-440';
      case 'accountant':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const yearsList = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">Staff Management</h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Manage crew profiles, track daily attendance, and process salary sheets
          </p>
        </div>

        {activeTab === 'directory' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/15"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Staff</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-950/20 border border-slate-850 max-w-md">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'directory'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Staff Directory
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'attendance'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Daily Attendance
        </button>
        <button
          onClick={() => setActiveTab('salaries')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'salaries'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Salaries Ledger
        </button>
      </div>

      {/* TAB CONTENT: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              <p className="text-slate-450 text-xs mt-3 font-semibold">Loading crew listing...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/10 border border-slate-850 py-16 text-center animate-in fade-in duration-300">
              <Users className="w-10 h-10 text-slate-650 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No staff found</h3>
              <p className="text-slate-550 text-xs mt-0.5">Start by registering your first crew member.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-slate-900/10 border border-slate-850 shadow-xl">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Crew Member</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">System Role</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Base Salary / Hourly</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-transparent">
                  {staff.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sky-400 text-sm uppercase">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{member.name}</div>
                            <div className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5">
                              Joined: {new Date(member.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-350 font-semibold">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-200 font-bold">
                        Rs. {member.baseSalary?.toLocaleString() || '30,000'} / Rs. {member.hourlyRate || '200'} hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${member.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                          <span>{member.isActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditStaff(member);
                              setIsEditOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                            title="Edit Crew details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setResetTarget(member);
                              setIsResetOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                            title="Reset password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {member._id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleActive(member)}
                              className={`p-1.5 rounded-lg transition-all ${
                                member.isActive ? 'text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={member.isActive ? 'Suspend employee' : 'Activate employee'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: DAILY ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-950/20 rounded-2xl border border-slate-850">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold text-slate-300">Select Attendance Logging Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
              />
            </div>

            {attendanceRecords.length > 0 && (
              <button
                onClick={handleSaveAttendance}
                disabled={saveAttendanceLoading}
                className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg"
              >
                {saveAttendanceLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Logs...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Post Daily Attendance</span>
                  </>
                )}
              </button>
            )}
          </div>

          {attendanceMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 text-center">
              {attendanceMessage}
            </div>
          )}

          {attendanceLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-slate-450 text-xs mt-3">Fetching daily logs...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/10 border border-slate-850 py-16 text-center">
              <p className="text-slate-500 text-xs font-medium">Please add active staff members to the directory before logging attendance.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-slate-900/10 border border-slate-850 shadow-xl">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Hours Worked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-transparent">
                  {attendanceRecords.map((record, index) => (
                    <tr key={record.userId} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs uppercase">
                            {record.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-200">{record.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getRoleBadgeColor(record.role)}`}>
                          {record.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex gap-2">
                          {['present', 'absent', 'leave'].map((statusOption) => (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() => {
                                const copy = [...attendanceRecords];
                                copy[index].status = statusOption;
                                // Default working hours to 0 if marked absent
                                if (statusOption === 'absent') {
                                  copy[index].workingHours = 0;
                                } else if (statusOption === 'present') {
                                  copy[index].workingHours = 8;
                                }
                                setAttendanceRecords(copy);
                              }}
                              className={`px-3 py-1 rounded-xl text-xxs font-bold uppercase border transition-all ${
                                record.status === statusOption
                                  ? statusOption === 'present'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : statusOption === 'absent'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-455'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-440'
                                  : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {statusOption}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="number"
                            min="0"
                            max="24"
                            disabled={record.status === 'absent'}
                            value={record.workingHours}
                            onChange={(e) => {
                              const copy = [...attendanceRecords];
                              copy[index].workingHours = Math.min(24, Math.max(0, parseInt(e.target.value) || 0));
                              setAttendanceRecords(copy);
                            }}
                            className="bg-slate-900 border border-slate-850 text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none w-16 disabled:opacity-40"
                          />
                          <span className="text-[10px] text-slate-500 font-semibold">hours</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SALARIES LEDGER */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-950/20 rounded-2xl border border-slate-850">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold text-slate-350">Select Ledger Period:</span>
              <select
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
              >
                {monthsList.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={salaryYear}
                onChange={(e) => setSalaryYear(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchSalarySheet}
              disabled={salaryLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-250 border border-slate-800 rounded-xl text-xs font-semibold transition-all hover-lift"
            >
              Refresh sheet
            </button>
          </div>

          {salaryLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-slate-450 text-xs mt-3">Compiling salary sheet analytics...</p>
            </div>
          ) : salarySheet.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/10 border border-slate-850 py-16 text-center">
              <p className="text-slate-550 text-xs">No active staff profiles are available to compute salaries.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-slate-900/10 border border-slate-850 shadow-xl">
              <table className="min-w-full divide-y divide-slate-800 text-left">
                <thead className="bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Rate Specs</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Attendance Breakdown</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Overtime Hours</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider">Net Monthly Salary</th>
                    <th className="px-6 py-4 text-xxs font-bold text-slate-400 uppercase tracking-wider text-right">Payroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-transparent">
                  {salarySheet.map((sheetItem) => (
                    <tr key={sheetItem.userId} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-205">{sheetItem.name}</div>
                        <span className="text-[9px] uppercase tracking-wide text-slate-500 font-bold">{sheetItem.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-350">Base: Rs. {sheetItem.baseSalary?.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Hourly OT: Rs. {sheetItem.hourlyRate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2.5 text-[10.5px]">
                          <span className="text-emerald-450 font-bold">{sheetItem.presentDays} Pres</span>
                          <span className="text-amber-450 font-bold">{sheetItem.leaveDays} Lve</span>
                          <span className="text-rose-455 font-bold">{sheetItem.absentDays} Abs</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-350 font-medium">
                        {sheetItem.overtimeHours} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-emerald-400 font-black">
                        Rs. {sheetItem.netPay?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setPayTarget(sheetItem);
                            setIsPayModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600 hover:border-emerald-500 hover:text-slate-950 text-emerald-400 rounded-xl text-xxs font-bold uppercase transition-all"
                        >
                          Disburse Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Register Crew Profile</h2>
              </div>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setNewStaff({ name: '', email: '', password: '', role: 'technician', baseSalary: 30000, hourlyRate: 200 });
                  setAddError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{addError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Lama"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@pmautomobiles.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Secure Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">System Authorization Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="technician" className="bg-slate-950">Technician (Mechanic)</option>
                  <option value="receptionist" className="bg-slate-950">Receptionist (Front-Desk)</option>
                  <option value="accountant" className="bg-slate-950">Accountant (Finance)</option>
                  <option value="admin" className="bg-slate-950">System Admin (Full Access)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Base Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    value={newStaff.baseSalary}
                    onChange={(e) => setNewStaff({ ...newStaff, baseSalary: Number(e.target.value) })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Overtime Hourly Rate (Rs.)</label>
                  <input
                    type="number"
                    value={newStaff.hourlyRate}
                    onChange={(e) => setNewStaff({ ...newStaff, hourlyRate: Number(e.target.value) })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setNewStaff({ name: '', email: '', password: '', role: 'technician', baseSalary: 30000, hourlyRate: 200 });
                    setAddError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-855 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-all shadow-lg"
                >
                  {addLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Add Crew Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-550 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-805">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Modify Crew profile</h2>
              </div>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{editError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Lama"
                  value={editStaff.name}
                  onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@pmautomobiles.com"
                  value={editStaff.email}
                  onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">System Authorization Role *</label>
                <select
                  value={editStaff.role}
                  onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="technician" className="bg-slate-950">Technician (Mechanic)</option>
                  <option value="receptionist" className="bg-slate-950">Receptionist (Front-Desk)</option>
                  <option value="accountant" className="bg-slate-950">Accountant (Finance)</option>
                  <option value="admin" className="bg-slate-950">System Admin (Full Access)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Base Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    value={editStaff.baseSalary}
                    onChange={(e) => setEditStaff({ ...editStaff, baseSalary: Number(e.target.value) })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Overtime Hourly Rate (Rs.)</label>
                  <input
                    type="number"
                    value={editStaff.hourlyRate}
                    onChange={(e) => setEditStaff({ ...editStaff, hourlyRate: Number(e.target.value) })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-855 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-all shadow-lg"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {isResetOpen && resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-450"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-450" />
                <h2 className="text-base font-bold text-white">Reset User Password</h2>
              </div>
              <button
                onClick={() => {
                  setIsResetOpen(false);
                  setResetTarget(null);
                  setNewPassword('');
                  setResetError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              {resetError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{resetError}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-xxs font-bold text-slate-500">STAFF USER</span>
                <p className="text-sm font-bold text-slate-200">{resetTarget.name}</p>
                <p className="text-xxs text-slate-450">{resetTarget.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-355 uppercase tracking-wide">New Secure Password * (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen(false);
                    setResetTarget(null);
                    setNewPassword('');
                    setResetError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-855 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-450 disabled:opacity-50 transition-all shadow-lg"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSE PAY SALARY */}
      {isPayModalOpen && payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-450" />
                <h2 className="text-base font-bold text-white">Disburse Salary Payment</h2>
              </div>
              <button
                onClick={() => {
                  setIsPayModalOpen(false);
                  setPayTarget(null);
                  setPayError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySalary} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{payError}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-450">Staff Member:</span>
                  <span className="font-bold text-white">{payTarget.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-450">System Role:</span>
                  <span className="font-semibold text-slate-300 uppercase tracking-wide">{payTarget.role}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-450">For Period:</span>
                  <span className="font-semibold text-sky-400">{monthsList[salaryMonth]} {salaryYear}</span>
                </div>
                <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">Total Net Pay:</span>
                  <span className="font-black text-emerald-400 text-sm">Rs. {payTarget.netPay?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xxs font-bold text-slate-350 uppercase tracking-wide">Payout Channel *</label>
                <select
                  required
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="bank-transfer" className="bg-slate-950">Direct Bank Wire / Transfer</option>
                  <option value="cash" className="bg-slate-950">Cash Disbursal</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayModalOpen(false);
                    setPayTarget(null);
                    setPayError('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-850 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg"
                >
                  {payLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Payout...</span>
                    </>
                  ) : (
                    <>
                      <span>Post Payout Entry</span>
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
