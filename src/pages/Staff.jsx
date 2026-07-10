import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDate } from '../utils/nepaliDate';
import {
  Users,
  UserPlus,
  Key,
  Power,
  Edit3,
  Loader2,
  X,
  AlertCircle,
  Lock,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock
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
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-violet';
      case 'receptionist': return 'badge-blue';
      case 'technician': return 'badge-amber';
      case 'accountant': return 'badge-emerald';
      default: return 'badge-slate';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage crew profiles, track daily attendance, and process salary sheets.
          </p>
        </div>

        {activeTab === 'directory' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-md shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>Register New Staff</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
        {[
          { id: 'directory', label: 'Staff Directory' },
          { id: 'attendance', label: 'Daily Attendance' },
          { id: 'salaries', label: 'Salaries Ledger' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-500 text-sm mt-3 font-semibold">Loading crew listing...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No staff found</h3>
              <p className="text-slate-500 text-sm mt-1">Start by registering your first crew member.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Crew Member</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Email Address</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">System Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Base Salary / Hourly</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-transparent">
                    {staff.map((member) => (
                      <tr key={member._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm uppercase">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{member.name}</div>
                              <div className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5">
                                Joined: {formatNepaliDate(member.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">
                          {member.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getRoleBadgeClass(member.role)}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-bold">
                          Rs. {member.baseSalary?.toLocaleString() || '30,000'} / Rs. {member.hourlyRate || '200'} hr
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${member.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span>{member.isActive ? 'Active' : 'Suspended'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditStaff(member);
                                setIsEditOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit crew details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setResetTarget(member);
                                setIsResetOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Reset password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            {member._id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleActive(member)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  member.isActive ? 'text-rose-500 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
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
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: DAILY ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Select Attendance Logging Date:</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="h-10 rounded-xl border-slate-200 text-sm"
              />
            </div>

            {attendanceRecords.length > 0 && (
              <button
                onClick={handleSaveAttendance}
                disabled={saveAttendanceLoading}
                className="flex items-center justify-center gap-1.5 px-5 h-10 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
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
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-semibold text-emerald-700 text-center">
              {attendanceMessage}
            </div>
          )}

          {attendanceLoading ? (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-slate-500 text-sm mt-3">Fetching daily logs...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Please add active staff members to the directory before logging attendance.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Hours Worked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-transparent">
                    {attendanceRecords.map((record, index) => (
                      <tr key={record.userId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                              {record.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-800">{record.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getRoleBadgeClass(record.role)}>
                            {record.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border transition-colors cursor-pointer ${
                                  record.status === statusOption
                                    ? statusOption === 'present'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : statusOption === 'absent'
                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                      : 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {statusOption}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                              className="rounded-lg border-slate-200 px-2 py-1 text-sm font-semibold w-16 disabled:opacity-40"
                            />
                            <span className="text-xs text-slate-500 font-semibold">hours</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SALARIES LEDGER */}
      {activeTab === 'salaries' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-bold text-slate-700">Select Ledger Period:</span>
              <select
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(parseInt(e.target.value))}
                className="h-10 rounded-xl border-slate-200 text-sm cursor-pointer"
              >
                {monthsList.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={salaryYear}
                onChange={(e) => setSalaryYear(parseInt(e.target.value))}
                className="h-10 rounded-xl border-slate-200 text-sm cursor-pointer"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchSalarySheet}
              disabled={salaryLoading}
              className="px-4 h-10 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              Refresh sheet
            </button>
          </div>

          {salaryLoading ? (
            <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-slate-500 text-sm mt-3">Compiling salary sheet analytics...</p>
            </div>
          ) : salarySheet.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
              <p className="text-slate-500 text-sm">No active staff profiles are available to compute salaries.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Employee</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Rate Specs</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Attendance</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Overtime</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Net Monthly Salary</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Payroll</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-transparent">
                    {salarySheet.map((sheetItem) => (
                      <tr key={sheetItem.userId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-800">{sheetItem.name}</div>
                          <span className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">{sheetItem.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">Base: Rs. {sheetItem.baseSalary?.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Hourly OT: Rs. {sheetItem.hourlyRate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2.5 text-xs">
                            <span className="text-emerald-600 font-bold">{sheetItem.presentDays} Pres</span>
                            <span className="text-amber-600 font-bold">{sheetItem.leaveDays} Lve</span>
                            <span className="text-rose-600 font-bold">{sheetItem.absentDays} Abs</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {sheetItem.overtimeHours} hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">
                          Rs. {sheetItem.netPay?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setPayTarget(sheetItem);
                              setIsPayModalOpen(true);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white text-emerald-700 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                          >
                            Disburse Pay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Register Crew Profile</h2>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setNewStaff({ name: '', email: '', password: '', role: 'technician', baseSalary: 30000, hourlyRate: 200 });
                  setAddError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{addError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Lama"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@pmautomobiles.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Secure Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">System Authorization Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
                >
                  <option value="technician">Technician (Mechanic)</option>
                  <option value="receptionist">Receptionist (Front-Desk)</option>
                  <option value="accountant">Accountant (Finance)</option>
                  <option value="admin">System Admin (Full Access)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Base Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    value={newStaff.baseSalary}
                    onChange={(e) => setNewStaff({ ...newStaff, baseSalary: Number(e.target.value) })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Overtime Hourly Rate (Rs.)</label>
                  <input
                    type="number"
                    value={newStaff.hourlyRate}
                    onChange={(e) => setNewStaff({ ...newStaff, hourlyRate: Number(e.target.value) })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setNewStaff({ name: '', email: '', password: '', role: 'technician', baseSalary: 30000, hourlyRate: 200 });
                    setAddError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Modify Crew Profile</h2>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{editError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Lama"
                  value={editStaff.name}
                  onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@pmautomobiles.com"
                  value={editStaff.email}
                  onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">System Authorization Role *</label>
                <select
                  value={editStaff.role}
                  onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
                >
                  <option value="technician">Technician (Mechanic)</option>
                  <option value="receptionist">Receptionist (Front-Desk)</option>
                  <option value="accountant">Accountant (Finance)</option>
                  <option value="admin">System Admin (Full Access)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Base Monthly Salary (Rs.)</label>
                  <input
                    type="number"
                    value={editStaff.baseSalary}
                    onChange={(e) => setEditStaff({ ...editStaff, baseSalary: Number(e.target.value) })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Overtime Hourly Rate (Rs.)</label>
                  <input
                    type="number"
                    value={editStaff.hourlyRate}
                    onChange={(e) => setEditStaff({ ...editStaff, hourlyRate: Number(e.target.value) })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Reset User Password</h2>
              </div>
              <button
                onClick={() => {
                  setIsResetOpen(false);
                  setResetTarget(null);
                  setNewPassword('');
                  setResetError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
              {resetError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{resetError}</span>
                </div>
              )}

              <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Staff User</span>
                <p className="text-sm font-bold text-slate-800">{resetTarget.name}</p>
                <p className="text-xs text-slate-500">{resetTarget.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">New Secure Password * (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetOpen(false);
                    setResetTarget(null);
                    setNewPassword('');
                    setResetError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSE PAY SALARY */}
      {isPayModalOpen && payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Disburse Salary Payment</h2>
              <button
                onClick={() => {
                  setIsPayModalOpen(false);
                  setPayTarget(null);
                  setPayError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySalary} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{payError}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Staff Member:</span>
                  <span className="font-bold text-slate-800">{payTarget.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">System Role:</span>
                  <span className="font-semibold text-slate-700 uppercase tracking-wide text-xs">{payTarget.role}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">For Period:</span>
                  <span className="font-semibold text-blue-700">{monthsList[salaryMonth]} {salaryYear}</span>
                </div>
                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-bold">Total Net Pay:</span>
                  <span className="font-bold text-emerald-600 text-base">Rs. {payTarget.netPay?.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Payout Channel *</label>
                <select
                  required
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
                >
                  <option value="bank-transfer">Direct Bank Wire / Transfer</option>
                  <option value="cash">Cash Disbursal</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayModalOpen(false);
                    setPayTarget(null);
                    setPayError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {payLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Payout...</span>
                    </>
                  ) : (
                    <span>Post Payout Entry</span>
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
