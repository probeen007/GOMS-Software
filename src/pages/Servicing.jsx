import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDate } from '../utils/nepaliDate';
import {
  Wrench,
  Search,
  Loader2,
  AlertCircle,
  X,
  User,
  Plus,
  Printer,
  CheckCircle,
  Archive,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Servicing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isReceptionistOrAdmin = user?.role === 'admin' || user?.role === 'receptionist';
  const isTechnicianOrAdmin = user?.role === 'admin' || user?.role === 'technician';
  const canCreate = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'technician';

  // State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Service record search (by vehicle number / customer name / customer number)
  const [recordSearchQuery, setRecordSearchQuery] = useState(searchParams.get('q') || '');
  const [recordSearchBy, setRecordSearchBy] = useState(searchParams.get('by') || '');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Allocation forms
  const [inventoryList, setInventoryList] = useState([]);

  // Allocate Part Form
  const [partId, setPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState('');

  // Log Labour Form
  const [labourName, setLabourName] = useState('');
  const [labourHours, setLabourHours] = useState('');
  const [labourRate, setLabourRate] = useState('');
  const [labourLoading, setLabourLoading] = useState(false);
  const [labourError, setLabourError] = useState('');

  // Close Record Form Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [mileageOut, setMileageOut] = useState('');
  const [findings, setFindings] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState('');

  // New Servicing Record Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Fetch servicing records log
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/servicing', {
        params: { status: statusFilter, search: searchTerm, page, limit: 15 }
      });
      setRecords(response.data.records);
      setTotalPages(response.data.pages || 1);
      if (selectedRecord) {
        const updated = response.data.records.find(r => r._id === selectedRecord._id);
        if (updated) setSelectedRecord(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch parts inventory list
  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventoryList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Reset to page 1 whenever the filter/search criteria change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm]);

  // Debounce the search box so we don't fire a request on every keystroke
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchRecords();
    }, 350);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, page]);

  // Run the deep-linked service-record search on mount (from Customers page)
  useEffect(() => {
    if (recordSearchQuery) {
      handleRecordSearch(recordSearchQuery, recordSearchBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecordSearch = async (term, by) => {
    if (!term || !term.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await axios.get('/api/servicing/search', {
        params: { q: term, by }
      });
      setSearchResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearRecordSearch = () => {
    setRecordSearchQuery('');
    setRecordSearchBy('');
    setSearchResults(null);
  };

  // Customer autocomplete for the "New Servicing Record" modal
  useEffect(() => {
    if (!customerSearch) {
      setSearchedCustomers([]);
      return;
    }
    const delay = setTimeout(async () => {
      setCustomerSearchLoading(true);
      try {
        const response = await axios.get('/api/customers', {
          params: { search: customerSearch, limit: 5 }
        });
        setSearchedCustomers(response.data.customers);
      } catch (err) {
        console.error(err);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [customerSearch]);

  const handleSelectCustomer = async (cust) => {
    setSelectedCustomerId(cust._id);
    setSelectedCustomerName(cust.name);
    setSearchedCustomers([]);
    setCustomerSearch('');
    try {
      const response = await axios.get(`/api/customers/${cust._id}`);
      setCustomerVehicles(response.data.vehicles);
      setSelectedVehicleId(response.data.vehicles.length > 0 ? response.data.vehicles[0]._id : '');
    } catch (err) {
      console.error(err);
    }
  };

  const resetCreateForm = () => {
    setSelectedCustomerId('');
    setSelectedCustomerName('');
    setCustomerVehicles([]);
    setSelectedVehicleId('');
    setCustomerSearch('');
    setCreateError('');
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      setCreateError('Please select a customer and vehicle.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      await axios.post('/api/servicing', {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId
      });
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchRecords();
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || 'Failed to create servicing record');
    } finally {
      setCreateLoading(false);
    }
  };

  // Submit Part Allocation
  const handleAllocatePart = async (e) => {
    e.preventDefault();
    if (!partId || partQty <= 0) {
      setPartError('Specify valid part and quantity');
      return;
    }

    setPartLoading(true);
    setPartError('');

    try {
      const response = await axios.post(`/api/servicing/${selectedRecord._id}/parts`, {
        partId,
        qty: parseInt(partQty)
      });
      setSelectedRecord(response.data);
      setPartId('');
      setPartQty(1);
      fetchRecords();
      fetchInventory();
    } catch (err) {
      console.error(err);
      setPartError(err.response?.data?.message || 'Failed to allocate part');
    } finally {
      setPartLoading(false);
    }
  };

  // Submit Labour logging
  const handleLogLabour = async (e) => {
    e.preventDefault();
    if (!labourName || !labourHours || !labourRate) {
      setLabourError('All labour fields are required');
      return;
    }

    setLabourLoading(true);
    setLabourError('');

    try {
      const response = await axios.post(`/api/servicing/${selectedRecord._id}/labour`, {
        name: labourName,
        hours: parseFloat(labourHours),
        unitPrice: parseFloat(labourRate)
      });
      setSelectedRecord(response.data);
      setLabourName('');
      setLabourHours('');
      setLabourRate('');
      fetchRecords();
    } catch (err) {
      console.error(err);
      setLabourError(err.response?.data?.message || 'Failed to log labour');
    } finally {
      setLabourLoading(false);
    }
  };

  // Close Servicing Record submit
  const handleCloseRecord = async (e) => {
    e.preventDefault();
    setCloseLoading(true);
    setCloseError('');

    try {
      const response = await axios.patch(`/api/servicing/${selectedRecord._id}/close`, {
        mileageOut: mileageOut ? parseInt(mileageOut) : undefined,
        findings
      });
      setSelectedRecord(response.data);
      setIsCloseModalOpen(false);
      setMileageOut('');
      setFindings('');
      fetchRecords();
    } catch (err) {
      console.error(err);
      setCloseError(err.response?.data?.message || 'Failed to close servicing record');
    } finally {
      setCloseLoading(false);
    }
  };

  // Search/status filtering now happens server-side (see fetchRecords), so
  // `records` already holds the current page's matching results.

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Directory column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Servicing</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track vehicle repairs, log workshop operations, and allocate inventory.
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-md shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>New Servicing Record</span>
            </button>
          )}
        </div>

        {/* Deep-linked service record search results (from Customers page) */}
        {(searchLoading || searchResults) && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-600" />
                Service Record Search: &quot;{recordSearchQuery}&quot;
              </span>
              <button type="button" onClick={clearRecordSearch} className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            {searchLoading ? (
              <div className="py-6 text-center"><Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto" /></div>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No service records matched your search.</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 cursor-pointer flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{r.customerId?.name}</span>
                      <span className="text-slate-500 ml-2 font-mono text-xs uppercase">{r.vehicleId?.plateNo}</span>
                    </div>
                    <span className={r.status === 'open' ? 'badge-indigo' : 'badge-slate'}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search & Filter widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-600" />
              Search Servicing Records
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by plate, client name, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full h-11 rounded-xl border-slate-200 pl-3.5 pr-10 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
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
              <option value="">All Statuses</option>
              <option value="open">Open Tickets</option>
              <option value="closed">Closed Tickets</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-500 text-sm mt-3 font-semibold">Loading workshop logs...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 mb-4">
              <Wrench className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No servicing records found</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm">
              {searchTerm ? "No records match your search criteria." : "Create a new servicing record for a customer's vehicle to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {records.map((record) => (
              <div
                key={record._id}
                onClick={() => setSelectedRecord(record)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md ${selectedRecord?._id === record._id ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">REC: {record._id.slice(-6).toUpperCase()}</span>
                    <span className={record.status === 'open' ? 'badge-indigo' : 'badge-slate'}>
                      {record.status}
                    </span>
                    {record.invoiceId && (
                      <span className="badge-emerald">Invoiced</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{record.customerId?.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-mono font-bold rounded uppercase text-xs">
                      {record.vehicleId?.plateNo}
                    </span>
                    <span>{record.vehicleId?.make} {record.vehicleId?.model}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 uppercase tracking-wide font-bold block">Total billing</span>
                  <p className="text-base font-bold text-blue-700 font-mono mt-0.5">Rs. {record.total.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Opened: {formatNepaliDate(record.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-transparent pt-2 px-2">
            <span className="text-sm font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Workshop Desk Detailed panel */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Servicing Workspace</h2>
        {selectedRecord ? (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            {/* Header info */}
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 border border-blue-100 rounded">
                  REC ID: {selectedRecord._id.slice(-8).toUpperCase()}
                </span>
                <span className={selectedRecord.status === 'open' ? 'badge-indigo' : 'badge-slate'}>
                  {selectedRecord.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedRecord.customerId?.name}</h3>
              <p className="text-sm text-slate-500 font-medium">Plate Number: <strong className="font-mono text-slate-700 uppercase">{selectedRecord.vehicleId?.plateNo}</strong></p>
              {selectedRecord.invoiceId && (
                <p className="text-xs text-emerald-600 font-bold">This record has already been invoiced.</p>
              )}
            </div>

            {/* Diagnoses / Findings */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Diagnoses &amp; Findings Log</span>
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 italic font-medium leading-relaxed">
                {selectedRecord.findings || 'No diagnoses recorded yet.'}
              </p>
            </div>

            {/* Line allocations display */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Allocated Spares</span>
                {selectedRecord.parts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">No parts allocated yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRecord.parts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-700">
                        <span className="font-medium">{p.name} <strong className="text-slate-400 text-xs font-normal">({p.qty} x Rs. {p.unitPrice})</strong></span>
                        <span className="font-mono font-bold">Rs. {p.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Logged Labour</span>
                {selectedRecord.labour.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">No labor logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRecord.labour.map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-700">
                        <span className="font-medium">{l.name} <strong className="text-slate-400 text-xs font-normal">({l.hours} hrs x Rs. {l.unitPrice})</strong></span>
                        <span className="font-mono font-bold">Rs. {l.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Finance totals */}
            <div className="space-y-2.5 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-700 font-bold">Rs. {selectedRecord.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (13%):</span>
                <span className="font-mono">Rs. {selectedRecord.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-3">
                <span className="text-blue-700">Total Billable:</span>
                <span className="font-mono text-blue-700">Rs. {selectedRecord.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Forms section (Technicians can add spares/labour, reception can close) */}
            {selectedRecord.status === 'open' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {isTechnicianOrAdmin && (
                  <>
                    {/* Add Part Form */}
                    <form onSubmit={handleAllocatePart} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Allocate Spare Part</span>
                      {partError && <p className="text-xs text-rose-600 font-medium">{partError}</p>}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          required
                          value={partId}
                          onChange={(e) => setPartId(e.target.value)}
                          className="block flex-1 h-11 rounded-xl border-slate-200 text-sm cursor-pointer"
                        >
                          <option value="">-- Pick Part --</option>
                          {inventoryList.map(p => (
                            <option key={p._id} value={p._id} disabled={p.qty <= 0}>
                              {p.name} (Stock: {p.qty}) (Rs. {p.unitPrice})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Qty"
                            value={partQty}
                            onChange={(e) => setPartQty(e.target.value)}
                            className="block w-16 h-11 rounded-xl border-slate-200 text-sm text-center"
                          />
                          <button
                            type="submit"
                            disabled={partLoading}
                            className="h-11 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Add Labour Form */}
                    <form onSubmit={handleLogLabour} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Log Labor Task</span>
                      {labourError && <p className="text-xs text-rose-600 font-medium">{labourError}</p>}
                      <input
                        type="text"
                        required
                        placeholder="Operation Description (e.g. Engine tuning)"
                        value={labourName}
                        onChange={(e) => setLabourName(e.target.value)}
                        className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="Hours"
                          value={labourHours}
                          onChange={(e) => setLabourHours(e.target.value)}
                          className="block sm:w-1/2 h-11 rounded-xl border-slate-200 text-sm text-center"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Rate (Rs.)"
                          value={labourRate}
                          onChange={(e) => setLabourRate(e.target.value)}
                          className="block sm:w-1/2 h-11 rounded-xl border-slate-200 text-sm text-center font-mono"
                        />
                        <button
                          type="submit"
                          disabled={labourLoading}
                          className="h-11 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                        >
                          Log
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* Close servicing record (Receptionist/Admin only) */}
                {isReceptionistOrAdmin && (
                  <button
                    onClick={() => setIsCloseModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>Close Servicing Record</span>
                  </button>
                )}
              </div>
            )}

            {/* Print Action Sheet */}
            <div className="pt-2">
              <a
                href={`/api/servicing/${selectedRecord._id}/pdf?token=${localStorage.getItem('token')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
              >
                <Printer className="w-4.5 h-4.5" />
                <span>Print Service Sheet</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl py-16 text-center shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Select a servicing record from the workshop list to log diagnostic updates, allocate parts, or sign off and close the ticket.</p>
          </div>
        )}
      </div>

      {/* Modal: New Servicing Record */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">New Servicing Record</h2>
              <button
                type="button"
                onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Customer *</label>
                {selectedCustomerId ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /> {selectedCustomerName}</span>
                    <button type="button" onClick={() => { setSelectedCustomerId(''); setSelectedCustomerName(''); setCustomerVehicles([]); setSelectedVehicleId(''); }} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search customer by name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                    />
                    {customerSearchLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-3.5" />}
                    {searchedCustomers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                        {searchedCustomers.map((c) => (
                          <button
                            type="button"
                            key={c._id}
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            {c.name} <span className="text-slate-400 text-xs">({c.phone})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCustomerId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Vehicle *</label>
                  {customerVehicles.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">This customer has no registered vehicles yet.</p>
                  ) : (
                    <select
                      required
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="block w-full h-11 rounded-xl border-slate-200 text-sm font-bold cursor-pointer"
                    >
                      {customerVehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.plateNo} — {v.make} {v.model}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); resetCreateForm(); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !selectedCustomerId || !selectedVehicleId}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Open Servicing Record</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Servicing Record */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">Sign Off / Close Servicing Record</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCloseModalOpen(false);
                  setMileageOut('');
                  setFindings('');
                  setCloseError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseRecord} className="p-6 space-y-4">
              {closeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{closeError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Odometer Mileage Out (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 102500"
                  value={mileageOut}
                  onChange={(e) => setMileageOut(e.target.value)}
                  className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Diagnostic Findings &amp; Actions Taken *</label>
                <textarea
                  required
                  placeholder="Summarize parts replaced, tasks completed, or instructions for the client..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows="3"
                  className="block w-full rounded-xl border-slate-200 text-sm resize-none py-3 px-3.5"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCloseModalOpen(false);
                    setMileageOut('');
                    setFindings('');
                    setCloseError('');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closeLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                >
                  {closeLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Closing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Close Record</span>
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
