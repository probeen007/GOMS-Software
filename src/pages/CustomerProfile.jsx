import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Plus,
  Car,
  Calendar,
  Layers,
  Wrench,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Loyalty states
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Add Vehicle Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plateNo: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    colour: ''
  });
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch Customer Details
  const fetchCustomerDetails = async () => {
    try {
      const response = await axios.get(`/api/customers/${id}`);
      setCustomer(response.data.customer);
      setVehicles(response.data.vehicles);

      // Fetch Loyalty Ledger History
      const loyaltyResponse = await axios.get(`/api/loyalty/customer/${id}`);
      setLoyaltyHistory(loyaltyResponse.data);
    } catch (err) {
      console.error('Error fetching customer profile:', err);
      setError(err.response?.data?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  // Handle Adjust Points Form Submission
  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!adjustPoints || !adjustNotes) {
      setAdjustError('Points and reason notes are required');
      return;
    }

    setAdjustLoading(true);
    setAdjustError('');

    try {
      await axios.post('/api/loyalty/adjust', {
        customerId: id,
        points: parseInt(adjustPoints),
        notes: adjustNotes
      });
      setIsAdjustPointsOpen(false);
      setAdjustPoints('');
      setAdjustNotes('');
      fetchCustomerDetails();
    } catch (err) {
      console.error('Points adjustment error:', err);
      setAdjustError(err.response?.data?.message || 'Failed to adjust points');
    } finally {
      setAdjustLoading(false);
    }
  };

  // Handle Add Vehicle Form Submission
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.plateNo || !newVehicle.make || !newVehicle.model || !newVehicle.year) {
      setModalError('Plate number, Make, Model, and Year are required');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const response = await axios.post(`/api/customers/${id}/vehicles`, newVehicle);
      setVehicles([...vehicles, response.data]);
      setIsModalOpen(false);
      // Reset form
      setNewVehicle({
        plateNo: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        colour: ''
      });
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setModalError(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm mt-3 font-semibold">Loading customer profile...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center max-w-lg mx-auto shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Error Loading Profile</h3>
        <p className="text-slate-500 text-sm mt-1">{error || 'The requested customer profile could not be found.'}</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-6 flex items-center justify-center gap-2 mx-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and profile title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-550/10 transition-all duration-200 shadow-sm cursor-pointer"
          title="Back to Directory"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{customer.name}</h1>
          <p className="text-slate-550 text-sm mt-0.5 font-semibold capitalize">Client profile &bull; {customer.type} account</p>
        </div>
      </div>

      {/* Grid: Left - Customer Info Card, Right - Vehicles Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile Details Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-150">
              <span className="text-xs font-extrabold text-slate-550 uppercase tracking-widest">Client Details</span>
              {customer.type === 'corporate' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                  <Building className="w-3.5 h-3.5" /> Corporate
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-655 border border-sky-100">
                  <User className="w-3.5 h-3.5" /> Individual
                </span>
              )}
            </div>

            {/* Profile Fields */}
            <div className="py-5 space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Account ID</span>
                <p className="text-sm font-mono text-slate-800 font-medium">{customer._id}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Phone number</span>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Email address</span>
                {customer.email ? (
                  <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-450 italic">No email logged</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Physical Address</span>
                {customer.address ? (
                  <div className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{customer.address}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-450 italic">No address logged</p>
                )}
              </div>
            </div>

            {/* Loyalty points banner */}
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-blue-650 font-extrabold uppercase tracking-wider">Loyalty Balance</span>
                <p className="text-xs text-slate-500 mt-0.5">Automated rewards program</p>
              </div>
              <span className="text-2xl font-black text-blue-600">{customer.loyaltyPoints || 0} pts</span>
            </div>

            {/* Loyalty Points Ledger History statement card */}
            <div className="mt-5 p-5 bg-slate-50/50 border border-slate-150 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Points statement audit</span>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setIsAdjustPointsOpen(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-550 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Adjust points
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {loyaltyHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No point history ledger found.</p>
                ) : (
                  loyaltyHistory.map((txn) => (
                    <div key={txn._id} className="p-3 bg-white rounded-xl flex justify-between items-center text-xs text-slate-650 border border-slate-100 shadow-sm">
                      <div>
                        <p className="font-bold text-slate-800 capitalize">{txn.transactionType}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{txn.notes}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(txn.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-mono font-black text-sm shrink-0 pl-2 ${txn.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {txn.points > 0 ? `+${txn.points}` : txn.points}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Vehicles and Service History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Associated Vehicles card layout */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  <span>Associated Vehicles</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Vehicles registered under this customer account.</p>
              </div>

              {user?.role !== 'technician' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-805 hover:bg-slate-50 bg-white border border-slate-200 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              )}
            </div>

            {/* Vehicles Cards List */}
            {vehicles.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30">
                <Car className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-slate-550">No vehicles registered</h4>
                <p className="text-xs text-slate-500 mt-0.5">Add a vehicle to enable bookings, service checks, and quote builds.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle._id}
                    className="p-4 rounded-2xl bg-slate-50/50 border border-slate-155 flex flex-col justify-between hover:border-blue-200 transition-colors shadow-sm"
                  >
                    <div>
                      {/* Plate Badge and Make/Model */}
                      <div className="flex items-center justify-between gap-3">
                        <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-mono text-xs font-extrabold tracking-wide uppercase border border-blue-500/20">
                          {vehicle.plateNo}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{vehicle.year}</span>
                      </div>
                      
                      <h4 className="font-bold text-slate-800 text-base mt-3 capitalize">
                        {vehicle.make} {vehicle.model}
                      </h4>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-650 border-t border-slate-200/60 pt-2.5">
                        {vehicle.colour && (
                          <div className="flex justify-between">
                            <span className="text-slate-450 uppercase tracking-wide font-extrabold">Colour</span>
                            <span className="capitalize font-semibold text-slate-800">{vehicle.colour}</span>
                          </div>
                        )}
                        {vehicle.vin && (
                          <div className="flex justify-between">
                            <span className="text-slate-450 uppercase tracking-wide font-extrabold">VIN</span>
                            <span className="font-mono font-semibold text-slate-850">{vehicle.vin}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service History Card */}
          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Service Ledger History</span>
            </h3>
            
            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/30">
              <Wrench className="w-8 h-8 text-slate-455 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-550">No service history records yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Service logs, closed job cards, and invoice lists will appear here automatically once repair cards are closed in subsequent steps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Vehicle Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Gradient accent header bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-150">
              <h2 className="text-lg font-bold text-slate-900">Register Vehicle</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-805 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-705 font-bold">{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">License Plate No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BA-1-PA-2026"
                    value={newVehicle.plateNo}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plateNo: e.target.value.toUpperCase() })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-805 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle Make/Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-355 text-slate-805 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hilux"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-355 text-slate-805 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Manufacture Year *</label>
                  <input
                    type="number"
                    required
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-555 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Metallic Grey"
                    value={newVehicle.colour}
                    onChange={(e) => setNewVehicle({ ...newVehicle, colour: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-355 text-slate-805 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-555 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">VIN (Chassis Number)</label>
                  <input
                    type="text"
                    placeholder="e.g. JT3HN10U3D002938"
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value.toUpperCase() })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-355 text-slate-805 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-555 transition-all placeholder-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-150 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-650 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Vehicle</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Loyalty Points */}
      {isAdjustPointsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-550 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-150">
              <h2 className="text-lg font-bold text-slate-900">Adjust Loyalty Points</h2>
              <button
                onClick={() => {
                  setIsAdjustPointsOpen(false);
                  setAdjustPoints('');
                  setAdjustNotes('');
                  setAdjustError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-805 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{adjustError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Points adjustment *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or -30"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm font-bold focus:outline-none focus:bg-white focus:border-blue-550 transition-all"
                />
                <p className="text-xs text-slate-450 mt-1 font-semibold">Use positive integers to award points, negative integers to deduct them.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Adjustment Reason / Notes *</label>
                <textarea
                  required
                  placeholder="e.g. Sign up bonus, manual goodwill correction, warranty adjustments..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  rows="3"
                  className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-805 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-555 transition-all resize-none placeholder-slate-400"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-150 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustPointsOpen(false);
                    setAdjustPoints('');
                    setAdjustNotes('');
                    setAdjustError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {adjustLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adjusting...</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Adjustment</span>
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
