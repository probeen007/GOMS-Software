import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDate, formatNepaliDateTime } from '../utils/nepaliDate';
import {
  Calendar,
  Clock,
  Plus,
  Loader2,
  AlertCircle,
  X,
  User,
  Car,
  CheckCircle,
  Play,
  XCircle,
  Filter,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  Globe,
  UserPlus,
  CalendarCheck,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Appointments() {
  const { user } = useAuth();
  const isReceptionistOrAdmin = user?.role === 'admin' || user?.role === 'receptionist';
  const isTechnician = user?.role === 'technician';

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedApptId, setExpandedApptId] = useState(null);

  // Service Reminders tab states
  const [activeTab, setActiveTab] = useState('appointments');
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [expandedReminderId, setExpandedReminderId] = useState(null);

  // Web Bookings tab states
  const [webBookings, setWebBookings] = useState([]);
  const [webBookingsLoading, setWebBookingsLoading] = useState(false);
  const [expandedWebBookingId, setExpandedWebBookingId] = useState(null);

  // Edit Web Request Modal State
  const [editingWebBooking, setEditingWebBooking] = useState(null);
  const [editWebForm, setEditWebForm] = useState({});
  const [editWebLoading, setEditWebLoading] = useState(false);
  const [editWebError, setEditWebError] = useState('');

  // Schedule Web Request Modal State
  const [schedulingWebBooking, setSchedulingWebBooking] = useState(null);
  const [scheduleTechId, setScheduleTechId] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleServiceType, setScheduleServiceType] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Tech list for dropdown
  const [technicians, setTechnicians] = useState([]);

  // Customer search inside booking modal
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Booking Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [serviceType, setServiceType] = useState('Regular Maintenance');
  const [note, setNote] = useState('');

  // Check-In Modal State
  const [checkInApptId, setCheckInApptId] = useState(null);
  const [checkInMileage, setCheckInMileage] = useState('');
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInPhotos, setCheckInPhotos] = useState([]);
  const [checkInError, setCheckInError] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Fetch Appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/appointments', {
        params: { startDate, endDate, status: statusFilter }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [startDate, endDate, statusFilter]);

  // Fetch Service Reminders
  const fetchReminders = async () => {
    setRemindersLoading(true);
    try {
      const response = await axios.get('/api/invoices/service-reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching service reminders:', error);
    } finally {
      setRemindersLoading(false);
    }
  };

  const handleMarkReminderSent = async (invoiceId, customerName, plateNo) => {
    try {
      await axios.post(`/api/invoices/${invoiceId}/service-reminder-sent`, {
        customerName,
        plateNo
      });
      fetchReminders();
    } catch (error) {
      console.error('Error marking reminder sent:', error);
    }
  };

  const handleDeleteReminder = async (invoiceId) => {
    if (!window.confirm('Remove this service reminder from the list? This does not affect the invoice or payment record.')) return;
    try {
      await axios.delete(`/api/invoices/${invoiceId}/service-reminder`);
      fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  // Helper to construct WhatsApp link for Nepal phone numbers
  const getWhatsAppLink = (phone, message) => {
    let cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
      cleanPhone = '977' + cleanPhone; // Prepend Nepal country code
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Pre-filled formatted reminder message
  const getMessageTemplate = (rem) => {
    const clientName = rem.customerId?.name || 'Customer';
    const vehicle = `${rem.vehicleId?.make || ''} ${rem.vehicleId?.model || ''} (${rem.vehicleId?.plateNo || ''})`;
    const dateStr = formatNepaliDate(rem.nextServiceDate);
    return `Hi ${clientName}, this is a reminder from PM Automobiles Works. Your vehicle ${vehicle} is due for its next periodic service on ${dateStr}. Please book an appointment or visit us. Thank you!`;
  };

  // Fetch reminders on mount for count badges, and on tab changes
  useEffect(() => {
    if (isReceptionistOrAdmin) {
      fetchReminders();
      fetchWebBookings();
    }
  }, [activeTab]);

  // Fetch Web Booking Requests
  const fetchWebBookings = async () => {
    setWebBookingsLoading(true);
    try {
      const response = await axios.get('/api/web-bookings');
      setWebBookings(response.data);
    } catch (error) {
      console.error('Error fetching web bookings:', error);
    } finally {
      setWebBookingsLoading(false);
    }
  };

  // 1-Click Create Customer & Vehicle from Web Booking
  const handleCreateCustomerFromWebBooking = async (webBookingId) => {
    try {
      const response = await axios.post(`/api/web-bookings/${webBookingId}/create-customer`);
      alert(response.data.message || 'Customer & Vehicle successfully created/linked!');
      fetchWebBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create customer from web booking request');
    }
  };

  // Open Schedule Modal for Web Booking
  const handleOpenScheduleModal = (booking) => {
    setSchedulingWebBooking(booking);
    setScheduleServiceType(booking.service || 'Regular Maintenance');
    setScheduleNotes(booking.additionalNotes || '');

    if (booking.preferredDate) {
      const d = new Date(booking.preferredDate);
      if (booking.preferredTime) {
        const match = booking.preferredTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          d.setHours(hours, minutes, 0, 0);
        }
      }
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduleDateTime(localIso);
    } else {
      setScheduleDateTime('');
    }

    loadTechnicians();
  };

  // Approve & Schedule Web Booking
  const handleApproveWebBooking = async (e) => {
    e.preventDefault();
    if (!schedulingWebBooking) return;
    setScheduleLoading(true);
    setScheduleError('');

    try {
      await axios.post(`/api/web-bookings/${schedulingWebBooking._id}/approve`, {
        technicianId: scheduleTechId,
        dateTime: scheduleDateTime,
        serviceType: scheduleServiceType,
        note: scheduleNotes
      });
      setSchedulingWebBooking(null);
      fetchWebBookings();
      fetchAppointments();
      alert('Appointment successfully approved and scheduled!');
    } catch (err) {
      console.error(err);
      setScheduleError(err.response?.data?.message || 'Failed to approve and schedule appointment');
    } finally {
      setScheduleLoading(false);
    }
  };

  // Open Edit Modal for Web Booking
  const handleOpenEditWebBookingModal = (booking) => {
    setEditingWebBooking(booking);
    setEditWebForm({
      fullName: booking.fullName || '',
      phone: booking.phone || '',
      email: booking.email || '',
      plateNo: booking.plateNo || '',
      vehicleMake: booking.vehicleMake || '',
      vehicleModel: booking.vehicleModel || '',
      year: booking.year || '',
      service: booking.service || '',
      preferredDate: booking.preferredDate ? new Date(booking.preferredDate).toISOString().split('T')[0] : '',
      preferredTime: booking.preferredTime || '',
      additionalNotes: booking.additionalNotes || ''
    });
    setEditWebError('');
  };

  // Save Edits to Web Booking Request
  const handleSaveWebBookingEdit = async (e) => {
    e.preventDefault();
    if (!editingWebBooking) return;
    setEditWebLoading(true);
    setEditWebError('');

    try {
      await axios.put(`/api/web-bookings/${editingWebBooking._id}`, editWebForm);
      setEditingWebBooking(null);
      fetchWebBookings();
    } catch (err) {
      console.error(err);
      setEditWebError(err.response?.data?.message || 'Failed to update web booking details');
    } finally {
      setEditWebLoading(false);
    }
  };

  // Reject Web Booking Request
  const handleRejectWebBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject/dismiss this online booking request?')) return;
    try {
      await axios.patch(`/api/web-bookings/${bookingId}/reject`);
      fetchWebBookings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  // Load Technicians on Modal Open
  const loadTechnicians = async () => {
    try {
      const response = await axios.get('/api/appointments/technicians');
      setTechnicians(response.data);
      if (response.data.length > 0) {
        setSelectedTechId(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading technicians:', err);
    }
  };

  useEffect(() => {
    if (isModalOpen && isReceptionistOrAdmin) {
      loadTechnicians();
    }
  }, [isModalOpen]);

  // Handle Customer Search
  useEffect(() => {
    if (!customerSearch) {
      setSearchedCustomers([]);
      return;
    }

    const searchClients = async () => {
      setSearchLoading(true);
      try {
        const response = await axios.get('/api/customers', {
          params: { search: customerSearch, limit: 5 }
        });
        setSearchedCustomers(response.data.customers);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchClients();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch]);

  // Select Customer & Fetch Vehicles
  const handleSelectCustomer = async (cust) => {
    setSelectedCustomerId(cust._id);
    setSelectedCustomerName(cust.name);
    setSearchedCustomers([]);
    setCustomerSearch('');

    try {
      const response = await axios.get(`/api/customers/${cust._id}`);
      setVehicles(response.data.vehicles);
      if (response.data.vehicles.length > 0) {
        setSelectedVehicleId(response.data.vehicles[0]._id);
      } else {
        setSelectedVehicleId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Booking
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId || !selectedTechId || !dateTime || !serviceType) {
      setModalError('Please fill in all required fields (Client, Vehicle, Technician, Date/Time, Service Type)');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await axios.post('/api/appointments', {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        technicianId: selectedTechId,
        dateTime,
        serviceType,
        note
      });
      setIsModalOpen(false);
      setSelectedCustomerId('');
      setSelectedCustomerName('');
      setSelectedVehicleId('');
      setSelectedTechId('');
      setDateTime('');
      setServiceType('Regular Maintenance');
      setNote('');
      setVehicles([]);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setModalLoading(false);
    }
  };

  // Status State Change
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await axios.patch(`/api/appointments/${appointmentId}`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Submit Check-In Form (Multipart Upload)
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!checkInMileage) {
      setCheckInError('Mileage is required.');
      return;
    }

    setCheckInLoading(true);
    setCheckInError('');

    const formData = new FormData();
    formData.append('mileageIn', checkInMileage);
    formData.append('conditionNotes', checkInNotes);
    for (let i = 0; i < checkInPhotos.length; i++) {
      formData.append('photos', checkInPhotos[i]);
    }

    try {
      await axios.post(`/api/appointments/${checkInApptId}/checkin`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCheckInApptId(null);
      setCheckInMileage('');
      setCheckInNotes('');
      setCheckInPhotos([]);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      setCheckInError(err.response?.data?.message || 'Failed to process check-in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'checked-in':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'in-progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appointments &amp; Check-In</h1>
          <p className="text-sm text-slate-500 mt-1">
            Book incoming clients, log intake mileage and condition, and track appointment status.
          </p>
        </div>

        {isReceptionistOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-md shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Appointments List
        </button>
        {isReceptionistOrAdmin && (
          <>
            <button
              onClick={() => setActiveTab('web-bookings')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'web-bookings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Web Booking Requests</span>
              {webBookings.filter(b => b.status === 'pending' || b.status === 'customer-created').length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700">
                  {webBookings.filter(b => b.status === 'pending' || b.status === 'customer-created').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'reminders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>Service Reminders</span>
              {reminders.filter(r => {
                const daysLeft = Math.ceil((new Date(r.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft <= 1 && !r.reminderSent;
              }).length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          </>
        )}
      </div>

      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Date and status filter widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full h-11 rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full h-11 rounded-xl border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-blue-600" />
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
              >
                <option value="">All Scheduled</option>
                <option value="scheduled">Scheduled</option>
                <option value="checked-in">Checked In</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setStatusFilter('');
                }}
                className="w-full h-11 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-500 text-sm mt-3 font-semibold">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 mb-4">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No bookings found</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">There are no client appointments matching the selected filters.</p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-340px)] min-h-[350px] overflow-y-auto pr-1 space-y-3">
              {appointments.map((appt) => {
                const formattedDate = formatNepaliDateTime(appt.dateTime);
                const isExpanded = expandedApptId === appt._id;

                return (
                  <div
                    key={appt._id}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-sm transition-all duration-200 space-y-3 cursor-pointer"
                    onClick={() => setExpandedApptId(isExpanded ? null : appt._id)}
                  >
                    {/* Compact Card Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900">{appt.customerId?.name || 'Deleted Client'}</p>
                            {appt.vehicleId?.plateNo && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold text-[11px] rounded uppercase">
                                {appt.vehicleId?.plateNo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {formattedDate} &bull; Tech: {appt.technicianId?.name || 'Unassigned'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusStyle(appt.status)}`}>
                          {appt.status}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                          {appt.serviceType}
                        </span>
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content Drawer */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-100 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                        {/* Info layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Vehicle Details</span>
                            <p className="text-xs font-medium text-slate-700">
                              {appt.vehicleId?.make} {appt.vehicleId?.model} ({appt.vehicleId?.year || 'N/A'})
                            </p>
                          </div>

                          <div className="space-y-1 lg:col-span-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Customer Notes</span>
                            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl italic font-medium leading-relaxed">
                              {appt.note ? `"${appt.note}"` : 'No intake notes recorded.'}
                            </p>
                          </div>
                        </div>

                        {/* Subdocument check-in details display */}
                        {appt.checkIn && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex flex-wrap justify-between items-center gap-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <strong className="text-slate-500 uppercase text-[10px] tracking-wide block font-bold mb-0.5">Mileage In</strong>
                                  <span className="font-mono text-sm font-extrabold text-violet-700">{appt.checkIn.mileageIn.toLocaleString()} km</span>
                                </div>
                                <div className="sm:col-span-2">
                                  <strong className="text-slate-500 uppercase text-[10px] tracking-wide block font-bold mb-0.5">Condition Notes</strong>
                                  <span className="text-slate-700 font-semibold">{appt.checkIn.conditionNotes || 'No issues declared'}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-violet-100 text-violet-700 border border-violet-200 shrink-0">Inspected</span>
                            </div>

                            {/* Photos grid */}
                            {appt.checkIn.photos && appt.checkIn.photos.length > 0 && (
                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                                {appt.checkIn.photos.map((photoUrl, idx) => (
                                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                                    <img
                                      src={photoUrl}
                                      alt={`Checkin photo ${idx + 1}`}
                                      loading="lazy"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                    />
                                    <a
                                      href={photoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white uppercase tracking-wide"
                                    >
                                      Expand
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons footer */}
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {appt.status === 'scheduled' && isReceptionistOrAdmin && (
                            <button
                              onClick={() => setCheckInApptId(appt._id)}
                              className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Check-In</span>
                            </button>
                          )}

                          {appt.status === 'checked-in' && (isReceptionistOrAdmin || isTechnician) && (
                            <button
                              onClick={() => handleStatusChange(appt._id, 'in-progress')}
                              className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Repair</span>
                            </button>
                          )}

                          {appt.status === 'in-progress' && (isReceptionistOrAdmin || isTechnician) && (
                            <button
                              onClick={() => handleStatusChange(appt._id, 'completed')}
                              className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Finish Repairs</span>
                            </button>
                          )}

                          {appt.status === 'scheduled' && isReceptionistOrAdmin && (
                            <button
                              onClick={() => handleStatusChange(appt._id, 'cancelled')}
                              className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-900">Service reminders</h2>
            <p className="text-sm text-slate-500">
              Clients with upcoming or overdue vehicle services. Use the WhatsApp button to send a reminder.
            </p>
          </div>

          {remindersLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl py-12 shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-semibold text-slate-500 mt-3">Loading service reminders...</span>
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 mb-4">
                <CheckCircle className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No service reminders</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">There are no vehicles scheduled for upcoming services at this time.</p>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-340px)] min-h-[350px] overflow-y-auto pr-1 space-y-3">
              {reminders.map((rem) => {
                const daysLeft = Math.ceil((new Date(rem.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24));
                const message = getMessageTemplate(rem);
                const isUrgent = daysLeft <= 1;
                const isExpanded = expandedReminderId === rem._id;
                const reminderDateStr = formatNepaliDate(rem.nextServiceDate);

                return (
                  <div
                    key={rem._id}
                    className={`p-4 bg-white border rounded-2xl shadow-sm transition-all duration-200 space-y-3 cursor-pointer ${
                      isUrgent && !rem.reminderSent ? 'border-rose-200 hover:border-rose-300' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setExpandedReminderId(isExpanded ? null : rem._id)}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isUrgent && !rem.reminderSent
                            ? 'bg-rose-50 border-rose-100 text-rose-600 font-bold'
                            : 'bg-blue-50 border-blue-100 text-blue-600 font-bold'
                        }`}>
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900">{rem.customerId?.name || 'Deleted Client'}</p>
                            {rem.vehicleId?.plateNo && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold text-[11px] rounded uppercase">
                                {rem.vehicleId?.plateNo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Due: {reminderDateStr} ({daysLeft < 0 ? `Overdue ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Due today' : `in ${daysLeft} days`})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isUrgent && !rem.reminderSent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
                            Action Required
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          rem.reminderSent
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {rem.reminderSent ? 'Sent' : 'Pending'}
                        </span>
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content Drawer */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-100 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Vehicle Info</span>
                            <p className="text-xs font-semibold text-slate-700">
                              {rem.vehicleId?.make} {rem.vehicleId?.model}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{rem.customerId?.phone}</p>
                          </div>

                          <div className="space-y-1 lg:col-span-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">WhatsApp Message Preview</span>
                            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/60 p-3 rounded-xl font-medium leading-relaxed">
                              <p className="italic">"{message}"</p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleDeleteReminder(rem._id)}
                            className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-slate-500 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                          <a
                            href={getWhatsAppLink(rem.customerId?.phone || '', message)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => handleMarkReminderSent(rem._id, rem.customerId?.name, rem.vehicleId?.plateNo)}
                            className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-2xs"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Send via WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Book Appointment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Booking</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{modalError}</span>
                </div>
              )}

              {/* Customer selection */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">1. Search Client *</label>
                {selectedCustomerId ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-800">{selectedCustomerName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setSelectedCustomerName('');
                        setVehicles([]);
                        setSelectedVehicleId('');
                      }}
                      className="text-slate-400 hover:text-slate-800 hover:bg-slate-100 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Type customer name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder-slate-400"
                    />
                    {searchLoading && (
                      <div className="absolute right-3.5 top-9.5">
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                      </div>
                    )}
                    {searchedCustomers.length > 0 && (
                      <div className="absolute z-20 top-full mt-1.5 inset-x-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-100">
                        {searchedCustomers.map((cust) => (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-3 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-semibold text-slate-800">{cust.name}</span>
                            <span className="text-slate-400">{cust.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Vehicle selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">2. Choose Vehicle *</label>
                <select
                  disabled={!selectedCustomerId || vehicles.length === 0}
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {vehicles.length === 0 ? (
                    <option value="">-- Choose customer first (must have registered vehicles) --</option>
                  ) : (
                    vehicles.map(v => (
                      <option key={v._id} value={v._id}>
                        [{v.plateNo}] {v.make} {v.model} ({v.year})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Technician assignment */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">3. Assign Technician *</label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                >
                  {technicians.length === 0 ? (
                    <option value="">-- Loading technicians... --</option>
                  ) : (
                    technicians.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Time and service details */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">4. Appointment Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">5. Service Category *</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Regular Maintenance">Regular Maintenance / Servicing</option>
                    <option value="Engine Repair">Engine Tuning / Overhauling</option>
                    <option value="Brake Overhaul">Brake Assembly Check</option>
                    <option value="Electrical Diagnostic">Electrical Diagnostics</option>
                    <option value="Suspension Repair">Suspension Check</option>
                    <option value="Other">Other Diagnostic Repairs</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Customer Notes</label>
                  <textarea
                    placeholder="e.g. Squeaking noise on rear axle, check brake pads."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows="2"
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all resize-none placeholder-slate-400"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Book Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Intake / Check-In */}
      {checkInApptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Vehicle Intake Check-In</h2>
              <button
                type="button"
                onClick={() => {
                  setCheckInApptId(null);
                  setCheckInMileage('');
                  setCheckInNotes('');
                  setCheckInPhotos([]);
                  setCheckInError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4">
              {checkInError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{checkInError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Odometer Mileage In (km) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 102450"
                  value={checkInMileage}
                  onChange={(e) => setCheckInMileage(e.target.value)}
                  className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Intake Inspection Notes</label>
                <textarea
                  placeholder="Describe scratches, existing dents, fuel level, or technician observations..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  rows="3"
                  className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all resize-none placeholder-slate-400"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-violet-600" />
                  Attach Inspection Photos (Max 5)
                </label>
                <div className="relative border border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/50 hover:border-violet-300 transition-colors flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                  <span className="text-xs text-slate-500 font-semibold uppercase">Select JPG / PNG images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setCheckInPhotos(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {checkInPhotos.length > 0 && (
                    <span className="text-xs text-violet-600 font-bold mt-1">
                      {checkInPhotos.length} file(s) selected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCheckInApptId(null);
                    setCheckInMileage('');
                    setCheckInNotes('');
                    setCheckInPhotos([]);
                    setCheckInError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkInLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-all shadow-md shadow-violet-500/10 cursor-pointer"
                >
                  {checkInLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm Intake</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab View: Web Booking Requests */}
      {activeTab === 'web-bookings' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-900">New Web Booking Requests</h2>
            <p className="text-sm text-slate-500">
              Online appointment submissions from the main website. Review details, edit info, create customer/vehicle records, and approve appointments.
            </p>
          </div>

          {webBookingsLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl py-12 shadow-sm">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-semibold text-slate-500 mt-3">Loading web booking requests...</span>
            </div>
          ) : webBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 mb-4">
                <Globe className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Web Booking Requests</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">No online booking requests have been received yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Summary header bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {webBookings.length} Web Booking Request(s) Total
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Click row to expand details</span>
              </div>

              {/* Scrollable Container Box */}
              <div className="max-h-[calc(100vh-340px)] min-h-[350px] overflow-y-auto pr-1 space-y-2">
                {webBookings.map((booking) => {
                  const isApproved = booking.status === 'approved';
                  const isRejected = booking.status === 'rejected';
                  const hasCustomer = !!booking.createdCustomerId;
                  const isExpanded = expandedWebBookingId === booking._id;

                  if (!isExpanded) {
                    // Compact Audit Log Style Row
                    return (
                      <div
                        key={booking._id}
                        onClick={() => setExpandedWebBookingId(booking._id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                          booking.status === 'pending'
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                            booking.status === 'pending'
                              ? 'bg-amber-100 border-amber-200 text-amber-700'
                              : isApproved
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                : 'bg-blue-100 border-blue-200 text-blue-700'
                          }`}>
                            <Globe className="w-4 h-4" />
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                booking.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : booking.status === 'customer-created'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : isApproved
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {booking.status === 'pending'
                                  ? 'Pending Verification'
                                  : booking.status === 'customer-created'
                                    ? 'Customer Created'
                                    : isApproved
                                      ? 'Approved & Scheduled'
                                      : 'Rejected'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                                {booking.service}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 truncate">
                                {booking.fullName}
                              </h3>
                              <span className="text-xs text-slate-500 font-medium">{booking.phone}</span>
                              {booking.plateNo && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold rounded text-xs uppercase">
                                  {booking.plateNo}
                                </span>
                              )}
                              {booking.vehicleMake && (
                                <span className="text-xs text-slate-400 font-normal truncate">
                                  ({booking.vehicleMake} {booking.vehicleModel})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 block font-medium">Requested</span>
                            <span className="text-xs font-bold text-slate-700">
                              {formatNepaliDate(booking.preferredDate)} {booking.preferredTime ? `(${booking.preferredTime})` : ''}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                            Details ↓
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Expanded Card View
                  return (
                    <div
                      key={booking._id}
                      className={`p-5 bg-white border rounded-2xl shadow-md transition-all duration-300 flex flex-col gap-4 ${
                        booking.status === 'pending' ? 'border-amber-300 ring-1 ring-amber-300/50' : 'border-blue-300 ring-1 ring-blue-300/50'
                      }`}
                    >
                      {/* Header bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            booking.status === 'pending'
                              ? 'bg-amber-50 border-amber-100 text-amber-600'
                              : isApproved
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-blue-50 border-blue-100 text-blue-600'
                          }`}>
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              Requested: {formatNepaliDate(booking.preferredDate)} {booking.preferredTime ? `(${booking.preferredTime})` : ''}
                            </p>
                            <span className="text-[11px] text-slate-500 font-semibold block">
                              Received on {formatNepaliDateTime(booking.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                            booking.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : booking.status === 'customer-created'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {booking.status === 'pending'
                              ? 'Pending Verification'
                              : booking.status === 'customer-created'
                                ? 'Customer Created'
                                : isApproved
                                  ? 'Approved & Scheduled'
                                  : 'Rejected'}
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                            {booking.service}
                          </span>
                          <button
                            type="button"
                            onClick={() => setExpandedWebBookingId(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                            title="Collapse details"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Customer Info</span>
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {booking.fullName}
                            </p>
                            <p className="text-slate-600 font-medium text-xs">{booking.phone}</p>
                            {booking.email && <p className="text-slate-400 text-xs">{booking.email}</p>}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Vehicle Info</span>
                          <div className="space-y-1">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                              <Car className="w-3.5 h-3.5 text-slate-400" />
                              <span>{booking.vehicleMake} {booking.vehicleModel}</span>
                              {booking.year && <span className="text-slate-400 font-normal">({booking.year})</span>}
                            </p>
                            <p className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-max">
                              {booking.plateNo || 'No Plate Provided'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">Notes &amp; Instructions</span>
                          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-xl font-medium leading-relaxed italic">
                            {booking.additionalNotes ? `"${booking.additionalNotes}"` : 'No additional notes specified.'}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditWebBookingModal(booking)}
                            className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isApproved && !isRejected && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCreateCustomerFromWebBooking(booking._id)}
                                disabled={hasCustomer}
                                className={`flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                  hasCustomer
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                                }`}
                              >
                                {hasCustomer ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>User &amp; Vehicle Created</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Add User &amp; Vehicle</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenScheduleModal(booking)}
                                className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                                <span>Add Appointment</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectWebBooking(booking._id)}
                                className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Official Appointment Created
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Edit Web Booking Details */}
      {editingWebBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Web Request Details</h2>
              <button
                type="button"
                onClick={() => setEditingWebBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWebBookingEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {editWebError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{editWebError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editWebForm.fullName || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editWebForm.phone || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={editWebForm.email || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, email: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vehicle Make *</label>
                  <input
                    type="text"
                    required
                    value={editWebForm.vehicleMake || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, vehicleMake: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    value={editWebForm.vehicleModel || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, vehicleModel: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Plate Number</label>
                  <input
                    type="text"
                    value={editWebForm.plateNo || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, plateNo: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Model Year</label>
                  <input
                    type="text"
                    value={editWebForm.year || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, year: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Service Required *</label>
                  <input
                    type="text"
                    required
                    value={editWebForm.service || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, service: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={editWebForm.preferredDate || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Preferred Time</label>
                  <input
                    type="text"
                    value={editWebForm.preferredTime || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                    placeholder="e.g. 10:00 AM"
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Additional Notes</label>
                  <textarea
                    rows="2"
                    value={editWebForm.additionalNotes || ''}
                    onChange={(e) => setEditWebForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    className="block w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingWebBooking(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editWebLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10"
                >
                  {editWebLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Approve & Schedule Web Booking */}
      {schedulingWebBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Approve &amp; Schedule Appointment</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm appointment time &amp; assign a technician for {schedulingWebBooking.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingWebBooking(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveWebBooking} className="p-6 space-y-4">
              {scheduleError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{scheduleError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Assign Technician *</label>
                <select
                  value={scheduleTechId}
                  onChange={(e) => setScheduleTechId(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer"
                >
                  {technicians.length === 0 ? (
                    <option value="">-- Loading technicians... --</option>
                  ) : (
                    technicians.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Appointment Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Service Category *</label>
                <input
                  type="text"
                  required
                  value={scheduleServiceType}
                  onChange={(e) => setScheduleServiceType(e.target.value)}
                  className="block w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Notes &amp; Instructions</label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  rows="2"
                  className="block w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setSchedulingWebBooking(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {scheduleLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Approve &amp; Schedule</span>
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
