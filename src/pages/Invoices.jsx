import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDate, formatNepaliDateTime } from '../utils/nepaliDate';
import {
  FileText,
  Search,
  Loader2,
  X,
  CreditCard,
  DollarSign,
  Printer,
  Calendar,
  User,
  Car,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Receipt,
  Plus,
  Filter,
  Sparkles
} from 'lucide-react';

export default function Invoices() {
  const { user } = useAuth();
  const isAccountantOrAdmin = user?.role === 'admin' || user?.role === 'accountant';
  const isStaff = user?.role === 'admin' || user?.role === 'receptionist' || user?.role === 'accountant';

  // State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Form Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payReference, setPayReference] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  // Credit Note Form Modal State
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditReason, setCreditReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState('');

  // Loyalty Redemption Form Modal State
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  // Generate Invoice Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [unbilledRecords, setUnbilledRecords] = useState([]);
  const [unbilledLoading, setUnbilledLoading] = useState(false);
  const [selectedServicingId, setSelectedServicingId] = useState('');
  const [generateInvoiceType, setGenerateInvoiceType] = useState('vat');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/invoices', {
        params: { status: statusFilter }
      });
      setInvoices(response.data);
      // Auto-update details view if open
      if (selectedInvoiceData?.invoice?._id) {
        fetchInvoiceDetail(selectedInvoiceData.invoice._id);
      }
    } catch (err) {
      console.error('Fetch invoices error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetail = async (id) => {
    try {
      const response = await axios.get(`/api/invoices/${id}`);
      setSelectedInvoiceData(response.data);
    } catch (err) {
      console.error('Fetch invoice detail error:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchUnbilledRecords = async () => {
    setUnbilledLoading(true);
    try {
      const response = await axios.get('/api/servicing/unbilled');
      setUnbilledRecords(response.data);
    } catch (err) {
      console.error('Fetch unbilled servicing records error:', err);
    } finally {
      setUnbilledLoading(false);
    }
  };

  const openGenerateModal = () => {
    setIsGenerateModalOpen(true);
    setSelectedServicingId('');
    setGenerateInvoiceType('vat');
    setGenerateError('');
    fetchUnbilledRecords();
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedServicingId) {
      setGenerateError('Select a completed servicing record to invoice');
      return;
    }

    setGenerateLoading(true);
    setGenerateError('');

    try {
      const response = await axios.post('/api/invoices/generate', {
        servicingId: selectedServicingId,
        invoiceType: generateInvoiceType
      });
      setIsGenerateModalOpen(false);
      setSelectedServicingId('');
      await fetchInvoices();
      fetchInvoiceDetail(response.data._id);
    } catch (err) {
      console.error(err);
      setGenerateError(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setGenerateLoading(false);
    }
  };

  // Handle Payment Submit
  // Helper to construct WhatsApp link for Nepal phone numbers
  const getWhatsAppLink = (phone, message) => {
    let cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
      cleanPhone = '977' + cleanPhone; // Prepend Nepal country code
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setPayError('Specify a positive payment amount');
      return;
    }

    setPayLoading(true);
    setPayError('');

    try {
      await axios.post(`/api/invoices/${selectedInvoiceData.invoice._id}/payments`, {
        amount: parseFloat(payAmount),
        method: payMethod,
        reference: payReference,
        nextServiceDate: nextServiceDate || null,
        sendWhatsApp
      });
      
      if (sendWhatsApp && selectedInvoiceData?.invoice) {
        const customer = selectedInvoiceData.invoice.customerId;
        const invoiceNo = selectedInvoiceData.invoice.invoiceNo;
        const vehicle = selectedInvoiceData.invoice.vehicleId;
        const vehicleStr = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plateNo})` : '';
        
        let message = `Hi ${customer?.name || 'Customer'}, we have received your payment of Rs. ${parseFloat(payAmount).toFixed(2)} (${payMethod}) for Invoice #${invoiceNo}.`;
        if (nextServiceDate) {
          const dateStr = formatNepaliDate(nextServiceDate);
          message += ` Your next service for ${vehicleStr} is scheduled on ${dateStr}. Thank you!`;
        } else {
          message += ` Thank you for your business!`;
        }
        
        const link = getWhatsAppLink(customer?.phone || '', message);
        window.open(link, '_blank');
      }

      setIsPaymentModalOpen(false);
      setPayAmount('');
      setPayReference('');
      setNextServiceDate('');
      setSendWhatsApp(false);
      fetchInvoices();
    } catch (err) {
      console.error(err);
      setPayError(err.response?.data?.message || 'Payment submission failed');
    } finally {
      setPayLoading(false);
    }
  };

  // Handle Credit Note Submit
  const handleIssueCredit = async (e) => {
    e.preventDefault();
    if (!creditReason || !creditAmount || parseFloat(creditAmount) <= 0) {
      setCreditError('All fields are required and credit amount must be positive');
      return;
    }

    setCreditLoading(true);
    setCreditError('');

    try {
      await axios.post(`/api/invoices/${selectedInvoiceData.invoice._id}/credit-note`, {
        reason: creditReason,
        amount: parseFloat(creditAmount)
      });
      
      setIsCreditModalOpen(false);
      setCreditReason('');
      setCreditAmount('');
      fetchInvoices();
    } catch (err) {
      console.error(err);
      setCreditError(err.response?.data?.message || 'Credit note submission failed');
    } finally {
      setCreditLoading(false);
    }
  };

  // Handle Loyalty Points Redemption Submit
  const handleRedeemPoints = async (e) => {
    e.preventDefault();
    if (!redeemPoints || parseInt(redeemPoints) <= 0) {
      setRedeemError('Specify a positive points value to redeem');
      return;
    }

    setRedeemLoading(true);
    setRedeemError('');

    try {
      await axios.post(`/api/invoices/${selectedInvoiceData.invoice._id}/redeem-points`, {
        points: parseInt(redeemPoints)
      });
      
      setIsRedeemModalOpen(false);
      setRedeemPoints('');
      fetchInvoices();
    } catch (err) {
      console.error(err);
      setRedeemError(err.response?.data?.message || 'Point redemption failed');
    } finally {
      setRedeemLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const invoiceNo = inv.invoiceNo?.toLowerCase() || '';
    const clientName = inv.customerId?.name?.toLowerCase() || '';
    const plateNo = inv.vehicleId?.plateNo?.toLowerCase() || '';
    const make = inv.vehicleId?.make?.toLowerCase() || '';
    const model = inv.vehicleId?.model?.toLowerCase() || '';
    return invoiceNo.includes(term) || clientName.includes(term) || plateNo.includes(term) || make.includes(term) || model.includes(term);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Directory list column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Invoice ledger</h1>
            <p className="text-slate-350 text-sm mt-1.5 font-medium">
              Manage tax bills, record payments, and trace transaction records.
            </p>
          </div>
          {isStaff && (
            <button
              type="button"
              onClick={openGenerateModal}
              className="flex items-center justify-center gap-2 px-5 h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/10 hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate</span>
            </button>
          )}
        </div>

        {/* Search & Filter widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-md">
          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <Search className="w-4 h-4 text-primary-400" />
              Search Invoices
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by invoice #, plate, client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input block w-full rounded-xl h-11 pl-3.5 pr-10 text-slate-205 text-sm focus:outline-none placeholder-slate-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <Filter className="w-4 h-4 text-primary-400" />
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none font-bold"
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="unpaid" className="bg-slate-900">Unpaid</option>
              <option value="partially-paid" className="bg-slate-900">Partially Paid</option>
              <option value="paid" className="bg-slate-900">Fully Paid</option>
              <option value="credited" className="bg-slate-900">Credited / Adjustments</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-slate-400 text-sm mt-3 font-medium">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/30 mb-4">
              <FileText className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-white">No invoices logged</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm font-medium">
              {searchTerm ? "No invoices match your search criteria." : "Use the Generate button to create an invoice from a closed servicing record."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredInvoices.map((inv) => (
              <div
                key={inv._id}
                onClick={() => fetchInvoiceDetail(inv._id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${selectedInvoiceData?.invoice?._id === inv._id ? 'bg-emerald-950/15 border-emerald-500/40' : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/60'}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-450 bg-slate-800/60 px-2 py-0.5 rounded">{inv.invoiceNo}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${inv.invoiceType === 'vat' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {inv.invoiceType === 'vat' ? 'VAT' : 'Non-VAT'}
                    </span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' : inv.status === 'partially-paid' ? 'bg-amber-500/10 text-amber-450 border-amber-500/20' : inv.status === 'credited' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-rose-500/10 text-rose-455 border-rose-500/20'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{inv.customerId?.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="px-2 py-0.5 bg-primary-950 text-primary-400 border border-primary-500/10 font-mono font-bold rounded uppercase text-xs">
                      {inv.vehicleId?.plateNo}
                    </span>
                    <span>{inv.vehicleId?.make} {inv.vehicleId?.model}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold block">Outstanding Balance</span>
                  <p className={`text-base font-black font-mono mt-0.5 ${inv.amountDue > 0 ? 'text-rose-400' : 'text-emerald-450'}`}>
                    Rs. {inv.amountDue.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-550 mt-0.5 font-medium">Total: Rs. {inv.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Detailed panel workspace */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-white tracking-tight">Invoice workspace</h2>
        {selectedInvoiceData ? (
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Header info */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-mono text-emerald-455 font-bold bg-emerald-950/45 px-2.5 py-0.5 border border-emerald-500/25 rounded">
                  {selectedInvoiceData.invoice.invoiceNo}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${selectedInvoiceData.invoice.invoiceType === 'vat' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {selectedInvoiceData.invoice.invoiceType === 'vat' ? 'VAT' : 'Non-VAT'}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${selectedInvoiceData.invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : selectedInvoiceData.invoice.status === 'partially-paid' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' : 'bg-rose-500/10 text-rose-455 border-rose-500/10'}`}>
                    {selectedInvoiceData.invoice.status}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-black text-white mt-2">{selectedInvoiceData.invoice.customerId?.name}</h3>
              <p className="text-xs text-slate-400 font-medium">Date: <strong className="text-slate-205">{formatNepaliDate(selectedInvoiceData.invoice.createdAt)}</strong></p>
            </div>

            {/* Client & Vehicle specs card */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Billing Address</span>
                <p className="text-slate-300 font-semibold leading-relaxed text-sm">
                  {selectedInvoiceData.invoice.customerId?.address || 'No billing address.'}
                </p>
                <p className="text-slate-400 text-xs font-medium">{selectedInvoiceData.invoice.customerId?.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block mb-0.5">Vehicle Specifications</span>
                <p className="text-sm font-bold uppercase font-mono text-slate-200">{selectedInvoiceData.invoice.vehicleId?.plateNo}</p>
                <p className="text-slate-400 text-xs font-medium">{selectedInvoiceData.invoice.vehicleId?.make} {selectedInvoiceData.invoice.vehicleId?.model}</p>
              </div>
            </div>

            {/* Itemized Parts and Labor from Servicing record */}
            <div className="space-y-3.5 pt-2">
              <span className="text-xs font-extrabold text-slate-450 uppercase tracking-widest block">Itemized Service Details</span>
              <div className="space-y-2 border border-slate-850 p-4 rounded-2xl bg-slate-900/25">
                {/* Spares */}
                {selectedInvoiceData.invoice.servicingId?.parts.map((p, idx) => (
                  <div key={`part-${idx}`} className="flex justify-between items-center text-sm text-slate-300">
                    <span>{p.name} <strong className="text-slate-500 text-xs font-normal">({p.qty} x Rs. {p.unitPrice})</strong></span>
                    <span className="font-mono text-slate-400 font-bold">Rs. {p.total.toFixed(2)}</span>
                  </div>
                ))}
                {/* Labour */}
                {selectedInvoiceData.invoice.servicingId?.labour.map((l, idx) => (
                  <div key={`labour-${idx}`} className="flex justify-between items-center text-sm text-slate-300 border-t border-slate-900/80 pt-2 mt-2">
                    <span>{l.name} <strong className="text-slate-500 text-xs font-normal">({l.hours} hrs x Rs. {l.unitPrice})</strong></span>
                    <span className="font-mono text-slate-400 font-bold">Rs. {l.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subtotal, discount, VAT, amountPaid, amountDue */}
            <div className="space-y-2.5 border-t border-slate-805 pt-4 text-sm text-slate-400 font-semibold">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200 font-bold">Rs. {selectedInvoiceData.invoice.subtotal.toFixed(2)}</span>
              </div>
              {selectedInvoiceData.invoice.invoiceType === 'vat' && (
                <div className="flex justify-between text-slate-550">
                  <span>VAT (13%):</span>
                  <span className="font-mono text-slate-300 font-bold">Rs. {selectedInvoiceData.invoice.vat.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300 border-t border-slate-900/60 pt-2">
                <span>Total Amount:</span>
                <span className="font-mono text-slate-200 font-bold">Rs. {selectedInvoiceData.invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-455">
                <span>Total Paid:</span>
                <span className="font-mono text-emerald-400 font-bold">Rs. {selectedInvoiceData.invoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-white border-t border-slate-850 pt-3">
                <span className="text-rose-455">Total Balance Due:</span>
                <span className="font-mono text-rose-455 font-black text-lg animate-pulse">Rs. {selectedInvoiceData.invoice.amountDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments history ledger log */}
            {selectedInvoiceData.payments && selectedInvoiceData.payments.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-850">
                <span className="text-xs font-extrabold text-slate-450 uppercase tracking-widest block">Transaction Receipts</span>
                <div className="space-y-2">
                  {selectedInvoiceData.payments.map((p) => (
                    <div key={p._id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-855/60 flex justify-between items-center text-sm text-slate-300">
                      <div>
                        <p className="font-bold text-slate-200">Paid via <span className="uppercase text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-extrabold">{p.method}</span></p>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Clerk: {p.receivedBy?.name} | {formatNepaliDate(p.createdAt)}</p>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold text-base">+Rs. {p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Notes log */}
            {selectedInvoiceData.invoice.creditNotes && selectedInvoiceData.invoice.creditNotes.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-850">
                <span className="text-xs font-extrabold text-slate-450 uppercase tracking-widest block">Credit Adjustments</span>
                <div className="space-y-2">
                  {selectedInvoiceData.invoice.creditNotes.map((cr, idx) => (
                    <div key={idx} className="p-3 bg-sky-950/10 rounded-xl border border-sky-900/20 flex justify-between items-center text-sm text-slate-300">
                      <div>
                        <p className="font-bold text-sky-400">Credit note deduction</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">&quot;{cr.reason}&quot;</p>
                      </div>
                      <span className="font-mono text-sky-400 font-bold text-base">-Rs. {cr.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty points redemption prompt */}
            {selectedInvoiceData.invoice.customerId?.loyaltyPoints > 0 && selectedInvoiceData.invoice.status !== 'paid' && selectedInvoiceData.invoice.status !== 'credited' && (
              <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-3xl flex items-center justify-between text-xs mt-4">
                <div className="space-y-0.5">
                  <span className="text-amber-400 font-extrabold block text-sm">Redeemable Loyalty Points</span>
                  <p className="text-slate-400 font-medium">Customer has <strong className="text-amber-400">{selectedInvoiceData.invoice.customerId.loyaltyPoints} points</strong> (Rs. 1.00 value per point)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const maxRedeem = Math.min(
                      selectedInvoiceData.invoice.customerId.loyaltyPoints,
                      Math.floor(selectedInvoiceData.invoice.amountDue)
                    );
                    setRedeemPoints(maxRedeem.toString());
                    setIsRedeemModalOpen(true);
                  }}
                  className="px-5 h-11 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Redeem
                </button>
              </div>
            )}

            {/* Actions for Receptionist/Admin/Accountant */}
            {selectedInvoiceData.invoice.status !== 'paid' && selectedInvoiceData.invoice.status !== 'credited' && isStaff && (
              <div className="flex gap-2.5 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => {
                    setPayAmount(selectedInvoiceData.invoice.amountDue.toString());
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Receipt className="w-4.5 h-4.5" />
                  <span>Post Payment</span>
                </button>

                {isAccountantOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCreditAmount(selectedInvoiceData.invoice.amountDue.toString());
                      setIsCreditModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-5 h-11 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 rounded-xl text-sm font-bold text-sky-400 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <TrendingDown className="w-4.5 h-4.5" />
                    <span>Credit Note</span>
                  </button>
                )}
              </div>
            )}

            {/* Print Invoice layout */}
            <div className="pt-2">
              <a
                href={`/api/invoices/${selectedInvoiceData.invoice._id}/pdf?token=${localStorage.getItem('token')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 transition-all hover:scale-[1.02]"
              >
                <Printer className="w-4.5 h-4.5" />
                <span>Print Official Invoice</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900/10 border border-slate-850 py-16 text-center">
            <p className="text-slate-555 text-xs font-medium">Select an invoice from the ledger to view bill details, record client payments, issue credit adjustments, or download print sheets.</p>
          </div>
        )}
      </div>

      {/* Modal: Record Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-450" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Record Invoice Payment</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPayAmount('');
                  setPayReference('');
                  setPayError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{payError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Payment Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Payment Method *</label>
                <select
                  required
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none font-bold"
                >
                  <option value="cash" className="bg-slate-950">Cash payment</option>
                  <option value="card" className="bg-slate-950">POS Card swipe</option>
                  <option value="fonepay" className="bg-slate-950">Fonepay QR Scan</option>
                  <option value="bank-transfer" className="bg-slate-950">Direct Bank Wire</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Transaction Reference ID / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Txn #0928374 or Bank Check #"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Next Service Date</label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="sendWhatsApp"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="h-5 w-5 bg-slate-900 border-slate-800 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <label htmlFor="sendWhatsApp" className="text-xs font-extrabold text-slate-300 cursor-pointer select-none">
                    Send WhatsApp Reminder
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPayAmount('');
                    setPayReference('');
                    setNextServiceDate('');
                    setSendWhatsApp(false);
                    setPayError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-855 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-550/15 cursor-pointer"
                >
                  {payLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Post Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Credit Note */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-400"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-sky-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Issue Credit Adjustment</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreditModalOpen(false);
                  setCreditReason('');
                  setCreditAmount('');
                  setCreditError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCredit} className="p-6 space-y-4">
              {creditError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{creditError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Credit Deduction Amount (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Reason for adjustment *</label>
                <textarea
                  required
                  placeholder="e.g. Loyalty point waiver, parts warranty return, customer courtesy discount..."
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  rows="3"
                  className="glass-input block w-full rounded-xl py-3 px-3.5 text-slate-205 text-sm resize-none focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreditModalOpen(false);
                    setCreditReason('');
                    setCreditAmount('');
                    setCreditError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-all shadow-lg shadow-sky-550/15 cursor-pointer"
                >
                  {creditLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Issuing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Issue Credit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Redeem Loyalty Points */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-455"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-450" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Redeem Customer Points</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRedeemModalOpen(false);
                  setRedeemPoints('');
                  setRedeemError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRedeemPoints} className="p-6 space-y-4">
              {redeemError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{redeemError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Points to Redeem *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  max={Math.min(
                    selectedInvoiceData.invoice.customerId?.loyaltyPoints || 0,
                    Math.floor(selectedInvoiceData.invoice.amountDue || 0)
                  )}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm font-semibold focus:outline-none"
                />
                <p className="text-xs text-slate-450 font-medium mt-1">
                  Customer Balance: <strong className="text-amber-400">{selectedInvoiceData.invoice.customerId?.loyaltyPoints || 0} points</strong>. 
                  Redeem value: Rs. 1.00 discount per point.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsRedeemModalOpen(false);
                    setRedeemPoints('');
                    setRedeemError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeemLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-lg shadow-amber-550/15 cursor-pointer"
                >
                  {redeemLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Points Discount</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generate Invoice */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-450" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Generate Invoice</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4">
              {generateError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{generateError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Closed Servicing Record *</label>
                {unbilledLoading ? (
                  <div className="py-6 text-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" /></div>
                ) : unbilledRecords.length === 0 ? (
                  <p className="text-xs text-slate-450 italic p-3 bg-slate-900/50 rounded-xl border border-slate-850">
                    No closed servicing records are awaiting invoicing. Close a servicing record first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {unbilledRecords.map((rec) => (
                      <label
                        key={rec._id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${selectedServicingId === rec._id ? 'bg-emerald-950/25 border-emerald-500/40' : 'bg-slate-900/50 border-slate-850 hover:border-slate-750'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="servicingRecord"
                            checked={selectedServicingId === rec._id}
                            onChange={() => setSelectedServicingId(rec._id)}
                            className="h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                          />
                          <div>
                            <p className="text-sm font-bold text-white">{rec.customerId?.name}</p>
                            <p className="text-xs text-slate-450 font-mono uppercase">{rec.vehicleId?.plateNo} — {rec.vehicleId?.make} {rec.vehicleId?.model}</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono font-bold text-emerald-400">Rs. {rec.total.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Invoice Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGenerateInvoiceType('vat')}
                    className={`h-11 rounded-xl text-sm font-bold border transition-all cursor-pointer ${generateInvoiceType === 'vat' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    VAT (13%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerateInvoiceType('non-vat')}
                    className={`h-11 rounded-xl text-sm font-bold border transition-all cursor-pointer ${generateInvoiceType === 'non-vat' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    Non-VAT
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-855 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateLoading || !selectedServicingId}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-550/15 cursor-pointer"
                >
                  {generateLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5" />
                      <span>Generate Invoice</span>
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
