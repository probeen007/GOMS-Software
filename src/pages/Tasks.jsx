import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  X,
  User,
  Calendar,
  Loader2,
  SlidersHorizontal,
  Check
} from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'accountant';

  // Task lists states
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // New Task Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch tasks and staff list
  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/api/staff');
      setStaffList(res.data.filter((s) => s.isActive));
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchStaff()]);
      setLoading(false);
    };
    init();
  }, []);

  // Handle Add Task Submission
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title || !assignedTo || !dueDate) {
      setFormError('Title, assigned staff, and due date are required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await axios.post('/api/tasks', {
        title,
        description,
        priority,
        assignedTo,
        dueDate
      });
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Task Status (Completed / Pending)
  const handleToggleStatus = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t))
      );
      await axios.patch(`/api/tasks/${taskId}`, { status: nextStatus });
      await fetchTasks();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert if error
      await fetchTasks();
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Compute stats
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
      (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-8 h-8 text-primary-600" />
            <span>To-Do List & Tasks</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Assign operations, set priorities, and track task progress
          </p>
        </div>

        {isAdminOrStaff && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 h-11 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      {/* STATS OVERVIEW */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Overall Progress</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedCount} of {totalTasks} tasks completed ({completionRate}%)
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full md:w-2/3 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 flex items-center p-0.5">
            <div
              style={{ width: `${completionRate}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
            ></div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-white border border-slate-205 rounded-3xl shadow-sm">
        {/* Search Input */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <Search className="w-4 h-4 text-primary-600" />
            Search Tasks
          </label>
          <input
            type="text"
            placeholder="Search title, details, staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl h-11 px-3.5 text-slate-800 text-sm font-semibold border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none placeholder-slate-400"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <SlidersHorizontal className="w-4 h-4 text-primary-600" />
            Status Filter
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-850 rounded-xl px-3.5 h-11 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <SlidersHorizontal className="w-4 h-4 text-primary-600" />
            Priority Filter
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-850 rounded-xl px-3.5 h-11 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer hover:border-slate-300 transition-colors"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* TASK LIST */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-medium mt-3">Loading task logs...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-205 py-16 text-center shadow-sm">
          <ClipboardList className="w-10 h-10 text-slate-350 mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-medium">No tasks match your selected filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = new Date(task.dueDate) < new Date() && !isCompleted;

            return (
              <div
                key={task._id}
                className={`p-6 rounded-3xl border transition-all bg-white shadow-sm hover:shadow-md duration-300 ${
                  isCompleted
                    ? 'border-emerald-250 bg-emerald-50/10'
                    : isOverdue
                    ? 'border-rose-250 bg-rose-50/10'
                    : 'border-slate-205 hover:border-slate-350'
                }`}
              >
                <div className="flex gap-4">
                  {/* Left checkbox column */}
                  <div className="shrink-0 pt-0.5">
                    <button
                      onClick={() => handleToggleStatus(task._id, task.status)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                          : 'border-slate-300 hover:border-slate-400 text-transparent hover:text-slate-400 bg-white'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3.5]" />
                    </button>
                  </div>

                  {/* Right content column */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          task.priority === 'high'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : task.priority === 'medium'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3
                        className={`text-base font-extrabold tracking-tight transition-all ${
                          isCompleted ? 'text-slate-450 line-through' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-slate-650 leading-relaxed font-semibold">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-3">
                      <div className="space-y-1.5 text-slate-550 font-bold">
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{task.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                            {new Date(task.dueDate).toLocaleDateString()} 
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </div>
                      </div>

                      {isAdminOrStaff && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE TASK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-650"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Operations Task</h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-medium leading-relaxed">{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect brake pads / Replace alternator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-xl h-11 px-3.5 text-slate-800 text-sm font-semibold border border-slate-205 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Description / Notes</label>
                <textarea
                  placeholder="Details, parts needed, or customer specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="block w-full rounded-xl py-3 px-3.5 text-slate-800 text-sm border border-slate-205 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Priority *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="block w-full rounded-xl h-11 px-3.5 text-slate-800 text-sm font-semibold border border-slate-205 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="block w-full rounded-xl h-11 px-3.5 text-slate-800 text-sm font-semibold border border-slate-205 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Assign Staff Member *</label>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="block w-full rounded-xl h-11 px-3.5 text-slate-800 text-sm font-semibold border border-slate-205 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="">Select employee...</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] cursor-pointer"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Add Task</span>
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
