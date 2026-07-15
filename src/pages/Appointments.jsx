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
  Trash2
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

  // Service Reminders tab states
  const [activeTab, setActiveTab] = useState('appointments');
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

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
    return `Hi ${clientName}, this is a reminder from PM Automobiles. Your vehicle ${vehicle} is due for its next periodic service on ${dateStr}. Please book an appointment or visit us. Thank you!`;
  };

  // Fetch reminders on mount for count badges, and on tab changes
  useEffect(() => {
    if (isReceptionistOrAdmin) {
      fetchReminders();
    }
  }, [activeTab]);

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
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((appt) => {
                const formattedDate = formatNepaliDateTime(appt.dateTime);

                return (
                  <div
                    key={appt._id}
                    className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5"
                  >
                    {/* Visual header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">{formattedDate}</p>
                          <span className="text-xs text-slate-500 font-semibold block mt-0.5">Assigned Tech: {appt.technicianId?.name || 'Unassigned'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusStyle(appt.status)}`}>
                          {appt.status}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                          {appt.serviceType}
                        </span>
                      </div>
                    </div>

                    {/* Info layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Client &amp; Vehicle</span>
                        <div className="text-sm space-y-2">
                          <p className="flex items-center gap-1.5 font-bold text-slate-800 text-base">
                            <User className="w-4 h-4 text-slate-400" />
                            {appt.customerId?.name || 'Deleted Client'}
                          </p>
                          <p className="flex items-center gap-1.5 font-medium">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold text-xs rounded uppercase shrink-0">
                              {appt.vehicleId?.plateNo}
                            </span>
                            <span className="text-slate-600 font-semibold">{appt.vehicleId?.make} {appt.vehicleId?.model}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 lg:col-span-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Customer Notes</span>
                        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 p-3.5 rounded-xl italic font-medium leading-relaxed">
                          {appt.note ? `"${appt.note}"` : 'No intake notes recorded.'}
                        </p>
                      </div>
                    </div>

                    {/* Subdocument check-in details display */}
                    {appt.checkIn && (
                      <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                            <div>
                              <strong className="text-slate-500 uppercase text-[10px] tracking-wide block font-bold mb-1">Mileage In</strong>
                              <span className="font-mono text-base font-extrabold text-violet-700">{appt.checkIn.mileageIn.toLocaleString()} km</span>
                            </div>
                            <div className="sm:col-span-2">
                              <strong className="text-slate-500 uppercase text-[10px] tracking-wide block font-bold mb-1">Condition Notes</strong>
                              <span className="text-slate-700 font-semibold">{appt.checkIn.conditionNotes || 'No issues declared'}</span>
                            </div>
                          </div>
                          <span className="badge-violet shrink-0">Inspected</span>
                        </div>

                        {/* Photos grid */}
                        {appt.checkIn.photos && appt.checkIn.photos.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1">
                            {appt.checkIn.photos.map((photoUrl, idx) => (
                              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
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
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      {appt.status === 'scheduled' && isReceptionistOrAdmin && (
                        <button
                          onClick={() => setCheckInApptId(appt._id)}
                          className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Check-In</span>
                        </button>
                      )}

                      {appt.status === 'checked-in' && (isReceptionistOrAdmin || isTechnician) && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'in-progress')}
                          className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          <span>Start Repair</span>
                        </button>
                      )}

                      {appt.status === 'in-progress' && (isReceptionistOrAdmin || isTechnician) && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'completed')}
                          className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Finish Repairs</span>
                        </button>
                      )}

                      {appt.status === 'scheduled' && isReceptionistOrAdmin && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'cancelled')}
                          className="flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
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
            <div className="grid grid-cols-1 gap-4">
              {reminders.map((rem) => {
                const daysLeft = Math.ceil((new Date(rem.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24));
                const message = getMessageTemplate(rem);
                const isUrgent = daysLeft <= 1;

                const reminderDateStr = formatNepaliDate(rem.nextServiceDate);

                return (
                  <div
                    key={rem._id}
                    className={`p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5 ${
                      isUrgent && !rem.reminderSent ? 'border-rose-200' : 'border-slate-200'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isUrgent && !rem.reminderSent
                            ? 'bg-rose-50 border-rose-100 text-rose-600'
                            : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            Due on {reminderDateStr}
                          </p>
                          <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                            {daysLeft < 0
                              ? `Overdue by ${Math.abs(daysLeft)} day(s)`
                              : daysLeft === 0
                                ? 'Due today'
                                : daysLeft === 1
                                  ? 'Due tomorrow'
                                  : `In ${daysLeft} days`}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isUrgent && !rem.reminderSent && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
                            Action Required
                          </span>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          rem.reminderSent
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {rem.reminderSent ? 'Reminder Sent' : 'Pending Send'}
                        </span>
                      </div>
                    </div>

                    {/* Details section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Client &amp; Vehicle</span>
                        <div className="text-sm space-y-2">
                          <p className="flex items-center gap-1.5 font-bold text-slate-800 text-base">
                            <User className="w-4 h-4 text-slate-400" />
                            {rem.customerId?.name || 'Deleted Client'}
                          </p>
                          <p className="flex items-center gap-1.5 font-medium">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold text-xs rounded uppercase shrink-0">
                              {rem.vehicleId?.plateNo}
                            </span>
                            <span className="text-slate-600 font-semibold">
                              {rem.vehicleId?.make} {rem.vehicleId?.model}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Message preview area */}
                      <div className="space-y-1.5 lg:col-span-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Message preview</span>
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-medium leading-relaxed">
                          <p className="italic">"{message}"</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(rem._id)}
                        className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-bold text-slate-500 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                      <a
                        href={getWhatsAppLink(rem.customerId?.phone || '', message)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleMarkReminderSent(rem._id, rem.customerId?.name, rem.vehicleId?.plateNo)}
                        className="flex items-center gap-2 px-5 h-10 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-sm"
                      >
                        <MessageSquare className="w-4.5 h-4.5" />
                        <span>Send to WhatsApp</span>
                      </a>
                    </div>
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
    </div>
  );
}
