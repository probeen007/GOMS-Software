import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
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
  Layers,
  TrendingUp,
  Image as ImageIcon
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'checked-in':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'in-progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-455 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Appointments & Check-In Portal</h1>
          <p className="text-slate-355 text-sm mt-1.5 font-medium">
            Book incoming clients, log physical mileage-in specs, upload vehicle condition pictures, and track status.
          </p>
        </div>

        {isReceptionistOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] glow-effect cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* Date and status filter widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-md">
        <div className="space-y-1.5 flex flex-col justify-between">
          <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <Calendar className="w-4 h-4 text-primary-400" />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
          />
        </div>

        <div className="space-y-1.5 flex flex-col justify-between">
          <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <Calendar className="w-4 h-4 text-primary-400" />
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
          />
        </div>

        <div className="space-y-1.5 flex flex-col justify-between">
          <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
            <Filter className="w-4 h-4 text-primary-400" />
            Status Filter
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
          >
            <option value="" className="bg-slate-900">All Scheduled</option>
            <option value="scheduled" className="bg-slate-900">Scheduled</option>
            <option value="checked-in" className="bg-slate-900">Checked In</option>
            <option value="in-progress" className="bg-slate-900">In Progress</option>
            <option value="completed" className="bg-slate-900">Completed</option>
            <option value="cancelled" className="bg-slate-900">Cancelled</option>
          </select>
        </div>

        <div className="flex items-end justify-end">
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter('');
            }}
            className="w-full h-11 px-5 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-750 transition-all hover:scale-[1.02] cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Appointment Cards list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-3 font-medium">Fetching active schedules...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/30 mb-4">
            <Calendar className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white">No schedules found</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            Try resetting your range parameters or create a new check-in book.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {appointments.map((appt) => {
            const formattedDate = new Date(appt.dateTime).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={appt._id}
                className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-lg hover:border-slate-700/60 transition-all flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Visual header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-white">{formattedDate}</p>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Assigned Tech: {appt.technicianId?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest border ${getStatusStyle(appt.status)}`}>
                      {appt.status}
                    </span>
                    <span className="text-sm font-bold text-slate-200 capitalize bg-slate-850 px-3.5 py-1 rounded-xl">
                      {appt.serviceType}
                    </span>
                  </div>
                </div>

                {/* Info layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Client & Vehicle Details</span>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p className="flex items-center gap-1.5 font-bold text-white text-base">
                        <User className="w-4 h-4 text-slate-400" />
                        {appt.customerId?.name || 'Deleted Client'}
                      </p>
                      <p className="flex items-center gap-1.5 font-medium mt-1">
                        <Car className="w-4 h-4 text-slate-400" />
                        <span className="px-2 py-0.5 bg-primary-950 text-primary-400 border border-primary-500/20 font-mono font-bold text-xs rounded uppercase shrink-0">
                          {appt.vehicleId?.plateNo}
                        </span>
                        <span>{appt.vehicleId?.make} {appt.vehicleId?.model}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Diagnostic Intake Comments</span>
                    <p className="text-sm text-slate-300 italic font-medium leading-relaxed">
                      {appt.note ? `"${appt.note}"` : 'No intake notes recorded.'}
                    </p>
                  </div>
                </div>

                {/* Subdocument check-in details display */}
                {appt.checkIn && (
                  <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex gap-6 text-sm text-slate-350">
                        <span>
                          <strong className="text-slate-400 uppercase text-xs tracking-widest block font-extrabold mb-1">Mileage In</strong>
                          <span className="font-mono text-base font-extrabold text-violet-400">{appt.checkIn.mileageIn.toLocaleString()} km</span>
                        </span>
                        <span>
                          <strong className="text-slate-400 uppercase text-xs tracking-widest block font-extrabold mb-1">Condition Notes</strong>
                          <span className="text-slate-205 font-medium">{appt.checkIn.conditionNotes || 'No issues declared'}</span>
                        </span>
                      </div>
                      <span className="text-xs font-bold text-violet-400/80 bg-violet-500/10 px-2.5 py-0.5 border border-violet-500/15 rounded">Inspected</span>
                    </div>

                    {/* Photos grid */}
                    {appt.checkIn.photos && appt.checkIn.photos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1">
                        {appt.checkIn.photos.map((photoUrl, idx) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950 group">
                            <img
                              src={photoUrl}
                              alt={`Checkin photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <a
                              href={photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white uppercase tracking-wider"
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
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850/45">
                  {appt.status === 'scheduled' && isReceptionistOrAdmin && (
                    <button
                      onClick={() => {
                        setCheckInApptId(appt._id);
                      }}
                      className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-violet-550/5"
                    >
                      <Camera className="w-4 h-4 animate-bounce" />
                      <span>Intake / Check-In</span>
                    </button>
                  )}

                  {appt.status === 'checked-in' && (isReceptionistOrAdmin || isTechnician) && (
                    <button
                      onClick={() => handleStatusChange(appt._id, 'in-progress')}
                      className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Play className="w-4 h-4 animate-pulse" />
                      <span>Start Repair Ops</span>
                    </button>
                  )}

                  {appt.status === 'in-progress' && (isReceptionistOrAdmin || isTechnician) && (
                    <button
                      onClick={() => handleStatusChange(appt._id, 'completed')}
                      className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Finish Repairs</span>
                    </button>
                  )}

                  {appt.status === 'scheduled' && isReceptionistOrAdmin && (
                    <button
                      onClick={() => handleStatusChange(appt._id, 'cancelled')}
                      className="flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-bold text-slate-500 hover:text-rose-455 hover:bg-rose-500/10 transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      <XCircle className="w-4.5 h-4.5 shrink-0" />
                      <span>Cancel booking</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Book Appointment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Create Booking</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{modalError}</span>
                </div>
              )}

              {/* Customer selection */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">1. Search Client *</label>
                {selectedCustomerId ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 flex justify-between items-center">
                    <span className="text-xs font-semibold text-white">{selectedCustomerName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setSelectedCustomerName('');
                        setVehicles([]);
                        setSelectedVehicleId('');
                      }}
                      className="text-slate-500 hover:text-white hover:bg-slate-800 p-0.5 rounded"
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
                      className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm placeholder-slate-650"
                    />
                    {searchLoading && (
                      <div className="absolute right-3.5 top-9.5">
                        <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                      </div>
                    )}
                    {searchedCustomers.length > 0 && (
                      <div className="absolute z-25 top-full mt-1.5 inset-x-0 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-850">
                        {searchedCustomers.map((cust) => (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-3 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-semibold text-white">{cust.name}</span>
                            <span className="text-slate-500 text-xxs">{cust.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Vehicle selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">2. Choose Vehicle *</label>
                <select
                  disabled={!selectedCustomerId || vehicles.length === 0}
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-250 text-sm disabled:opacity-40"
                >
                  {vehicles.length === 0 ? (
                    <option value="" className="bg-slate-900">-- Choose customer first (Must have registered vehicles) --</option>
                  ) : (
                    vehicles.map(v => (
                      <option key={v._id} value={v._id} className="bg-slate-900">
                        [{v.plateNo}] {v.make} {v.model} ({v.year})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Technician assignment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">3. Assign Technician *</label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                >
                  {technicians.length === 0 ? (
                    <option value="" className="bg-slate-900">-- Loading technicians... --</option>
                  ) : (
                    technicians.map(t => (
                      <option key={t._id} value={t._id} className="bg-slate-900">
                        {t.name} ({t.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Time and service details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">4. Appointment DateTime *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">5. Service Category *</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  >
                    <option value="Regular Maintenance" className="bg-slate-900">Regular Maintenance / Servicing</option>
                    <option value="Engine Repair" className="bg-slate-900">Engine Tuning / Overhauling</option>
                    <option value="Brake Overhaul" className="bg-slate-900">Brake assembly check</option>
                    <option value="Electrical Diagnostic" className="bg-slate-900">Electrical diagnostics</option>
                    <option value="Suspension Repair" className="bg-slate-900">Suspension check</option>
                    <option value="Other" className="bg-slate-900">Other diagnostic repairs</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Customer Notes</label>
                  <textarea
                    placeholder="e.g. Squeaking noise on rear axle, check brake pads."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows="2.5"
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] cursor-pointer glow-effect"
                >
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Book Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Intake / Check-In */}
      {checkInApptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-violet-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Vehicle Intake Check-In</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckInApptId(null);
                  setCheckInMileage('');
                  setCheckInNotes('');
                  setCheckInPhotos([]);
                  setCheckInError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4">
              {checkInError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{checkInError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Odometer Mileage In (km) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 102450"
                  value={checkInMileage}
                  onChange={(e) => setCheckInMileage(e.target.value)}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Intake Inspection Notes</label>
                <textarea
                  placeholder="Describe scratches, existing dents, fuel level, or technician observations..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  rows="3"
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm resize-none"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-violet-400" />
                  Attach Inspection Photos (Max 5)
                </label>
                <div className="relative border border-dashed border-slate-800 rounded-xl p-6 bg-slate-900/20 hover:border-violet-500/30 transition-colors flex flex-col items-center justify-center gap-2">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                  <span className="text-xs text-slate-400 font-semibold uppercase">Select JPG / PNG images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setCheckInPhotos(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {checkInPhotos.length > 0 && (
                    <span className="text-xs text-violet-400 font-bold mt-1">
                      {checkInPhotos.length} file(s) selected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCheckInApptId(null);
                    setCheckInMileage('');
                    setCheckInNotes('');
                    setCheckInPhotos([]);
                    setCheckInError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-855 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkInLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/10 hover:scale-[1.02] cursor-pointer"
                >
                  {checkInLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Checking In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4.5 h-4.5" />
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
