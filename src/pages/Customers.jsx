import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building,
  User,
  Plus,
  X,
  AlertCircle,
  Car,
  Wrench
} from 'lucide-react';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  // State
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'individual',
    vehicleModel: '',
    vehicleNumber: ''
  });
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Soft-Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Find Service Records search
  const [recordSearchTerm, setRecordSearchTerm] = useState('');
  const [recordSearchBy, setRecordSearchBy] = useState('vehicle-number');

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/customers', {
        params: { page, search, limit: 8 }
      });
      setCustomers(response.data.customers);
      setTotalPages(response.data.pages);
      setTotalCustomers(response.data.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, page]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page
  };

  // Create Customer Form Submission
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      setModalError('Name and Phone number are required');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const response = await axios.post('/api/customers', newCustomer);

      // Optionally register a vehicle in the same step
      if (newCustomer.vehicleModel.trim() && newCustomer.vehicleNumber.trim()) {
        try {
          await axios.post(`/api/customers/${response.data._id}/vehicles`, {
            plateNo: newCustomer.vehicleNumber,
            model: newCustomer.vehicleModel
          });
        } catch (vehicleError) {
          console.error('Error registering vehicle for new customer:', vehicleError);
        }
      }

      setIsModalOpen(false);
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'individual',
        vehicleModel: '',
        vehicleNumber: ''
      });
      // Redirect to new customer profile
      navigate(`/customers/${response.data._id}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      setModalError(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setModalLoading(false);
    }
  };

  // Find Service Records search submit -> deep-link into Servicing page
  const handleRecordSearchSubmit = (e) => {
    e.preventDefault();
    if (!recordSearchTerm.trim()) return;
    navigate(`/servicing?q=${encodeURIComponent(recordSearchTerm.trim())}&by=${recordSearchBy}`);
  };

  // Delete Customer Action
  const handleDeleteCustomer = async (customerId) => {
    try {
      await axios.delete(`/api/customers/${customerId}`);
      setDeleteConfirmId(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customers Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage auto-shop client profiles, contact information, and vehicle associations.
          </p>
        </div>

        {user?.role !== 'technician' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-md shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Find Service Records */}
      <form onSubmit={handleRecordSearchSubmit} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4.5 h-4.5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Find Service Records</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={recordSearchBy}
            onChange={(e) => setRecordSearchBy(e.target.value)}
            className="h-11 bg-white border border-slate-200 rounded-xl px-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-550 cursor-pointer"
          >
            <option value="vehicle-number">Vehicle Number</option>
            <option value="customer-name">Customer Name</option>
            <option value="customer-phone">Customer Number</option>
          </select>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Search by vehicle number, customer name, or phone..."
              value={recordSearchTerm}
              onChange={(e) => setRecordSearchTerm(e.target.value)}
              className="block w-full h-11 bg-white border border-slate-200 hover:border-slate-350 text-slate-800 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:border-blue-550 focus:ring-1 focus:ring-blue-550 transition-all placeholder-slate-450"
            />
          </div>
          <button
            type="submit"
            className="h-11 px-5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer shrink-0"
          >
            Search Records
          </button>
        </div>
      </form>

      {/* Control Panel (Search and Stats) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={search}
            onChange={handleSearchChange}
            className="block w-full h-14 bg-white border border-slate-200 hover:border-slate-350 text-slate-800 pl-11 pr-4 rounded-2xl text-sm focus:outline-none focus:border-blue-550 focus:ring-1 focus:ring-blue-550 transition-all placeholder-slate-450 shadow-sm"
          />
        </div>
        <div className="h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-between px-6 shadow-sm">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total records</span>
          <span className="text-2xl font-black text-blue-650">{totalCustomers}</span>
        </div>
      </div>

      {/* Customers Table / Card List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-3xl border border-slate-200 py-12 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-3 font-semibold">Fetching client profiles...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 mb-4">
            <User className="w-6 h-6 text-slate-450" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No customers found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            {search ? 'Try adjusting your search query, or clear it to view all.' : 'Get started by creating your first customer profile.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table Container for large screens */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
            <table className="min-w-full divide-y divide-slate-150 text-left">
              <thead className="bg-slate-50/75">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-transparent text-sm">
                {customers.map((customer) => (
                  <tr
                    key={customer._id}
                    className="hover:bg-slate-50/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/customers/${customer._id}`)}
                  >
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50/65 flex items-center justify-center font-bold text-blue-650 text-sm group-hover:bg-blue-100 transition-colors uppercase border border-blue-100/30">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {customer.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">
                            ID: {customer._id.substring(18)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-650">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[180px]">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                      {customer.type === 'corporate' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                          <Building className="w-3.5 h-3.5" />
                          Corporate
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100">
                          <User className="w-3.5 h-3.5" />
                          Individual
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 max-w-[180px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.address || 'No address logged'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          deleteConfirmId === customer._id ? (
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                              <span className="text-xs text-rose-600 font-bold px-2">Delete?</span>
                              <button
                                onClick={() => handleDeleteCustomer(customer._id)}
                                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                                title="Confirm delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(customer._id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete customer"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card list for small screens */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {customers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => navigate(`/customers/${customer._id}`)}
                className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 hover:border-blue-400 transition-colors cursor-pointer shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-base uppercase">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{customer.name}</h4>
                      <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-0.5">
                        ID: {customer._id.substring(18)}
                      </p>
                    </div>
                  </div>
                  {customer.type === 'corporate' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-100">
                      Corporate
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-600 border border-sky-100">
                      Individual
                    </span>
                  )}
                </div>

                <div className="space-y-2 border-t border-b border-slate-100 py-3 text-sm text-slate-650">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{customer.address || 'No address logged'}</span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                    {deleteConfirmId === customer._id ? (
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200 text-xs">
                        <span className="text-rose-600 font-bold">Delete?</span>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-550 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(customer._id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-650 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Client</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-transparent pt-4 px-2">
              <span className="text-sm font-semibold text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Customer Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Gradient accent header bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-150">
              <h2 className="text-lg font-bold text-slate-900">Create Customer Profile</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +977 98xxxxxxxx"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Customer Type</label>
                  <select
                    value={newCustomer.type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all cursor-pointer"
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Billing Address</label>
                  <textarea
                    placeholder="e.g. Kathmandu, Nepal"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    rows="2"
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400 resize-none"
                  ></textarea>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle (optional)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle Model</label>
                  <input
                    type="text"
                    placeholder="e.g. Hilux"
                    value={newCustomer.vehicleModel}
                    onChange={(e) => setNewCustomer({ ...newCustomer, vehicleModel: e.target.value })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BA-1-PA-2026"
                    value={newCustomer.vehicleNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, vehicleNumber: e.target.value.toUpperCase() })}
                    className="block w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 text-slate-800 rounded-xl py-2.5 px-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-550 transition-all placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-150 mt-6">
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
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Profile</span>
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
