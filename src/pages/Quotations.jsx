import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  X,
  User,
  Car,
  DollarSign,
  PlusCircle,
  Trash2,
  ExternalLink,
  Printer,
  Check,
  XCircle,
  Tag,
  Send
} from 'lucide-react';

export default function Quotations() {
  const { user } = useAuth();
  const isAuthorized = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'accountant';

  // State
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal: Create Quotation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Customer search inside modal
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchedCustomers, setSearchedCustomers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form fields
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [items, setItems] = useState([{ type: 'labour', partId: '', name: '', qty: 1, unitPrice: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [vat, setVat] = useState(13); // Default 13% VAT in Nepal

  // Autocomplete Inventory reference list
  const [inventoryList, setInventoryList] = useState([]);

  // Fetch all quotations
  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/quotations');
      setQuotations(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch inventory catalog
  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventoryList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendQuotation = async () => {
    if (!selectedQuote) return;
    setActionLoading(true);
    try {
      const response = await axios.patch(`/api/quotations/${selectedQuote._id}`, {
        status: 'sent'
      });
      setSelectedQuote(response.data);
      // Also update in the main list
      setQuotations(prev => prev.map(q => q._id === response.data._id ? response.data : q));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveQuotation = async () => {
    if (!selectedQuote) return;
    if (!window.confirm('Are you sure you want to approve this quotation? This will automatically open a Job Card.')) return;
    setActionLoading(true);
    try {
      const response = await axios.patch(`/api/quotations/${selectedQuote._id}`, {
        status: 'approved'
      });
      setSelectedQuote(response.data);
      setQuotations(prev => prev.map(q => q._id === response.data._id ? response.data : q));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineQuotation = async () => {
    if (!selectedQuote) return;
    const reason = window.prompt('Please specify the reason for declining this estimate:');
    if (reason === null) return; // cancelled prompt
    setActionLoading(true);
    try {
      const response = await axios.patch(`/api/quotations/${selectedQuote._id}`, {
        status: 'rejected',
        rejectionReason: reason || 'Declined by staff'
      });
      setSelectedQuote(response.data);
      setQuotations(prev => prev.map(q => q._id === response.data._id ? response.data : q));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to decline quotation');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    fetchInventory();
  }, []);

  // Handle customer search
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

  // Select customer and fetch their vehicles
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Build Quote Row Changes
  const handleRowChange = (index, field, value) => {
    const list = [...items];
    list[index][field] = value;

    // Auto-fill Part details if selection changes
    if (field === 'partId' && list[index].type === 'part' && value) {
      const part = inventoryList.find(p => p._id === value);
      if (part) {
        list[index].name = part.name;
        list[index].unitPrice = part.unitPrice; // default selling price
      }
    }

    setItems(list);
  };

  const addRow = () => {
    setItems([...items, { type: 'labour', partId: '', name: '', qty: 1, unitPrice: 0 }]);
  };

  const removeRow = (index) => {
    if (items.length === 1) return;
    const list = [...items];
    list.splice(index, 1);
    setItems(list);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
  const taxedBase = subtotal - Number(discount);
  const vatValue = Math.max(0, taxedBase * (Number(vat) / 100));
  const estimatedTotal = Math.max(0, taxedBase + vatValue);

  // Submit Quote Builder
  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedVehicleId) {
      setModalError('Customer and vehicle references are required.');
      return;
    }

    const invalidRow = items.some(item => !item.name || item.qty <= 0 || item.unitPrice < 0);
    if (invalidRow) {
      setModalError('Please specify valid descriptions, quantities, and prices for all rows.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      await axios.post('/api/quotations', {
        customerId: selectedCustomerId,
        vehicleId: selectedVehicleId,
        items,
        discount: Number(discount),
        vat: Number(vat)
      });
      setIsModalOpen(false);
      setSelectedCustomerId('');
      setSelectedCustomerName('');
      setSelectedVehicleId('');
      setItems([{ type: 'labour', partId: '', name: '', qty: 1, unitPrice: 0 }]);
      setDiscount(0);
      setVat(13);
      fetchQuotations();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to register quotation');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'sent':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: Quotations Directory list */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Repair Estimates & Quotations</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">
              Draft customer cost estimates, review client approvals, and print invoices.
            </p>
          </div>

          {isAuthorized && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/10 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Create Quotation</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-3xl py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-slate-500 text-sm mt-3 font-medium">Fetching quotations log...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-3xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-4">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-700">No estimates recorded</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Click create quotation above to configure repair estimates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.map((quote) => (
              <div
                key={quote._id}
                onClick={() => setSelectedQuote(quote)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                  selectedQuote?._id === quote._id 
                    ? 'bg-blue-50/60 border-blue-400 shadow-sm shadow-blue-50' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-655 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">REF: {quote._id.slice(-6).toUpperCase()}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-extrabold uppercase tracking-wider border ${getStatusStyle(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{quote.customerId?.name || 'Deleted Client'}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span>Plate: <strong className="text-slate-750 font-bold">{quote.vehicleId?.plateNo || 'Unknown'}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Make: <strong className="text-slate-750 font-bold">{quote.vehicleId?.make} {quote.vehicleId?.model}</strong></span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold block">Estimated Cost</span>
                  <p className="text-lg font-black text-blue-600 font-mono mt-0.5">Rs. {quote.total.toFixed(2)}</p>
                  <p className="text-xs text-slate-405 mt-0.5 font-semibold">{new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Selection Details Panel */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Estimate Detailed View</h2>
        {selectedQuote ? (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm relative overflow-hidden">
            {/* Header info */}
            <div className="space-y-2 pb-4 border-b border-slate-150">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-mono text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 border border-slate-200 rounded">
                  REF: {selectedQuote._id}
                </span>
                <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded border ${getStatusStyle(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-2">{selectedQuote.customerId?.name}</h3>
              <p className="text-sm text-slate-505 font-semibold">Phone: {selectedQuote.customerId?.phone}</p>
            </div>

            {/* Vehicle spec summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div>
                <span className="text-xs text-slate-400 uppercase font-extrabold block mb-1 tracking-widest">Vehicle</span>
                <span className="font-bold text-sm text-slate-800">{selectedQuote.vehicleId?.make} {selectedQuote.vehicleId?.model}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-extrabold block mb-1 tracking-widest">Plate Number</span>
                <span className="font-mono text-sm text-slate-800 font-bold uppercase">{selectedQuote.vehicleId?.plateNo}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Line Items</span>
              <div className="space-y-2 divide-y divide-slate-150 max-h-[220px] overflow-y-auto pr-1">
                {selectedQuote.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center pt-3">
                    <div>
                      <p className="font-bold text-sm text-slate-800 leading-snug">{item.name}</p>
                      <span className="text-xs text-slate-450 uppercase tracking-wide font-medium">{item.type} ({item.qty} x Rs. {item.unitPrice})</span>
                    </div>
                    <span className="font-mono text-sm text-slate-850 font-bold">Rs. {item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Maths footer summary */}
            <div className="space-y-2.5 border-t border-slate-150 pt-4 text-sm font-semibold text-slate-550">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-850 font-bold">Rs. {selectedQuote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount Applied:</span>
                <span className="font-mono text-rose-650 font-bold">-Rs. {selectedQuote.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (13%):</span>
                <span className="font-mono text-slate-850 font-bold">Rs. {selectedQuote.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold border-t border-slate-150 pt-3 mt-1">
                <span className="text-blue-600">Total Estimate:</span>
                <span className="font-mono text-blue-600">Rs. {selectedQuote.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Rejection notice */}
            {selectedQuote.status === 'rejected' && selectedQuote.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5">
                <XCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-extrabold text-rose-700 uppercase tracking-widest block mb-0.5">Client Decline Reason</span>
                  <p className="text-sm text-rose-655 italic mt-0.5">&quot;{selectedQuote.rejectionReason}&quot;</p>
                </div>
              </div>
            )}

            {/* Send & Publish to Customer if Status is Draft */}
            {selectedQuote.status === 'draft' && isAuthorized && (
              <button
                onClick={handleSendQuotation}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-blue-500/10 mb-1"
              >
                {actionLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
                <span>Send & Publish to Customer</span>
              </button>
            )}

            {/* Direct Approval/Decline Actions for Staff */}
            {(selectedQuote.status === 'draft' || selectedQuote.status === 'sent') && isAuthorized && (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  onClick={handleApproveQuotation}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={handleDeclineQuotation}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </div>
            )}

            {/* Integration Action Utilities */}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href={`/quote-approval/${selectedQuote.approvalToken}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <ExternalLink className="w-4.5 h-4.5" />
                <span>Open Public Approval Link</span>
              </a>

              <a
                href={`/api/quotations/${selectedQuote._id}/pdf?token=${localStorage.getItem('token')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Printer className="w-4.5 h-4.5" />
                <span>Export Print PDF Invoice</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 py-16 text-center">
            <p className="text-slate-500 text-sm font-medium">Select a quotation from the directory to review detailed line-items, tax calculations, and export links.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Quotation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-405" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Compile Repair Quotation</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{modalError}</span>
                </div>
              )}

              {/* Client search */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">1. Select Customer *</label>
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
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search clients by name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm placeholder-slate-650"
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-9.5">
                        <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
                      </div>
                    )}
                    {searchedCustomers.length > 0 && (
                      <div className="absolute z-10 top-full mt-1.5 inset-x-0 bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl divide-y divide-slate-850">
                        {searchedCustomers.map((cust) => (
                          <div
                            key={cust._id}
                            onClick={() => handleSelectCustomer(cust)}
                            className="p-3 text-xs text-slate-300 hover:bg-slate-850 cursor-pointer flex justify-between items-center"
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

              {/* Vehicle Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">2. Assigned Vehicle *</label>
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

              {/* Items Line-Builder list */}
              <div className="space-y-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Line Items</span>
                  <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary-400 hover:text-primary-350"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add line row</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((row, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-end bg-slate-900/40 p-5 rounded-2xl border border-slate-850">
                      {/* Type toggle */}
                      <div className="w-full sm:w-28 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Type *</label>
                        <select
                          value={row.type}
                          onChange={(e) => {
                            handleRowChange(index, 'type', e.target.value);
                            handleRowChange(index, 'partId', ''); // reset references
                            handleRowChange(index, 'name', '');
                          }}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-slate-250 text-sm"
                        >
                          <option value="labour" className="bg-slate-900">Labour</option>
                          <option value="part" className="bg-slate-900">Part</option>
                        </select>
                      </div>

                      {/* Part selector or text input */}
                      {row.type === 'part' ? (
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Part catalog *</label>
                          <select
                            required
                            value={row.partId}
                            onChange={(e) => handleRowChange(index, 'partId', e.target.value)}
                            className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-sm"
                          >
                            <option value="" className="bg-slate-900">-- Select stock item --</option>
                            {inventoryList.map(p => (
                              <option key={p._id} value={p._id} className="bg-slate-900">
                                [{p.sku}] {p.name} (Rs. {p.unitPrice.toFixed(2)}) (Available: {p.qty})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex-1 space-y-1 w-full">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Labour Description *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Engine diagnostics work"
                            value={row.name}
                            onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                            className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-sm placeholder-slate-600"
                          />
                        </div>
                      )}

                      <div className="w-full sm:w-16 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Qty *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={row.qty}
                          onChange={(e) => handleRowChange(index, 'qty', parseInt(e.target.value) || 0)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-sm text-center"
                        />
                      </div>

                      <div className="w-full sm:w-24 space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Unit Price (Rs.) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={row.unitPrice}
                          onChange={(e) => handleRowChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-sm font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        disabled={items.length === 1}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-455 hover:bg-rose-500/10 disabled:opacity-30 self-center sm:self-end"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxation and totals summary */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Discount Amount (Rs.)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">VAT Rate (%)</label>
                  <input
                    type="number"
                    value={vat}
                    onChange={(e) => setVat(parseFloat(e.target.value) || 0)}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-wrap justify-between items-center gap-4 mt-6">
                <div className="flex gap-6 text-xs text-slate-400 font-extrabold uppercase tracking-widest">
                  <span>Subtotal: <strong className="text-slate-200 font-mono text-sm font-bold">Rs. {subtotal.toFixed(2)}</strong></span>
                  <span>VAT: <strong className="text-slate-200 font-mono text-sm font-bold">Rs. {vatValue.toFixed(2)}</strong></span>
                </div>
                <div className="flex items-center gap-1 font-black text-xl text-primary-400">
                  <span className="text-sm font-bold mr-1">Rs.</span>
                  <span>{estimatedTotal.toFixed(2)}</span>
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
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Generate Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
