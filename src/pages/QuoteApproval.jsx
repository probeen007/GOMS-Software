import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Car,
  User,
  AlertTriangle,
  Send
} from 'lucide-react';

export default function QuoteApproval() {
  const { token } = useParams();

  // State
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Approval/Decline action state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Fetch Public Quotation Details
  const fetchQuotationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/quotations/public/${token}`);
      setQuotation(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Quotation link invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchQuotationDetails();
    }
  }, [token]);

  // Handle Approve
  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await axios.post(`/api/quotations/public/${token}/approve`);
      setActionSuccess('approved');
      setQuotation(prev => ({ ...prev, status: 'approved' }));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Approval action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Decline
  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!declineReason) {
      setError('Please provide a reason for declining.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await axios.post(`/api/quotations/public/${token}/reject`, { reason: declineReason });
      setActionSuccess('rejected');
      setQuotation(prev => ({ ...prev, status: 'rejected', rejectionReason: declineReason }));
      setShowDeclineForm(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Decline action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 py-12">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-xs mt-3 font-semibold">Loading repair estimate details...</p>
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Invalid Estimate Token</h2>
        <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-650"></div>

        {/* Brand Banner */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">DRIVESYNC AUTOMOTIVE</h1>
            <p className="text-xs text-slate-500 font-bold tracking-wider mt-1">Kathmandu, Nepal | Estimate Invoice Approval</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-550 font-bold uppercase tracking-wider block mb-1">Estimate Reference</span>
            <span className="text-xs font-mono text-blue-600 font-bold bg-blue-50 px-3 py-1 border border-blue-100 rounded">
              {quotation._id}
            </span>
          </div>
        </div>

        {/* Status Banners */}
        {quotation.status === 'approved' && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 text-emerald-700">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">Estimate Approved! Our technicians will begin repairing your vehicle.</span>
          </div>
        )}

        {quotation.status === 'rejected' && (
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3 text-rose-700">
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">Estimate Declined. (Reason: &quot;{quotation.rejectionReason}&quot;)</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-sm text-rose-700 font-medium">{error}</span>
            </div>
          )}

          {/* Client & Vehicle summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" /> Client Information
              </span>
              <p className="text-base font-extrabold text-slate-800">{quotation.customerId?.name}</p>
              <p className="text-sm text-slate-500 font-medium">Phone: {quotation.customerId?.phone}</p>
            </div>

            <div className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-2">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Car className="w-4 h-4 text-slate-400" /> Vehicle details
              </span>
              <p className="text-base font-extrabold text-slate-800">{quotation.vehicleId?.make} {quotation.vehicleId?.model}</p>
              <p className="text-sm text-slate-500 font-medium">Plate Number: <strong className="font-mono text-slate-700 uppercase">{quotation.vehicleId?.plateNo}</strong></p>
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block">Estimated Service Line Items</span>
            <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {quotation.items.map((item, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center text-sm hover:bg-slate-50/30 transition-colors">
                  <div>
                    <p className="font-extrabold text-slate-800 leading-relaxed">{item.name}</p>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{item.type} ({item.qty} x Rs. {item.unitPrice})</span>
                  </div>
                  <span className="font-mono text-slate-800 font-extrabold text-base">Rs. {item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Math */}
          <div className="p-5 bg-slate-50/50 border border-slate-200/60 rounded-xl space-y-2.5 text-sm font-semibold text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-700 font-bold">Rs. {quotation.subtotal.toFixed(2)}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount Applied:</span>
                <span className="font-mono text-rose-600 font-bold">-Rs. {quotation.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>VAT (13%):</span>
              <span className="font-mono text-slate-700">Rs. {quotation.vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200/80 pt-3">
              <span className="text-blue-600">Estimated Total:</span>
              <span className="font-mono text-blue-600">Rs. {quotation.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action options */}
          {quotation.status === 'sent' && !actionSuccess && (
            <div className="space-y-4 pt-4">
              {!showDeclineForm ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-750 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/10 hover:scale-[1.02] cursor-pointer"
                  >
                    {actionLoading && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                    <span>Approve repairs</span>
                  </button>

                  <button
                    onClick={() => setShowDeclineForm(true)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold text-rose-650 bg-rose-50 hover:bg-rose-100/60 border border-rose-200 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Decline estimate</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDeclineSubmit} className="space-y-3 bg-slate-50/50 p-5 border border-slate-200/80 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Specify Rejection Reason *</label>
                    <textarea
                      required
                      placeholder="Please let us know why you are declining (e.g. Too expensive, postpone parts replacement...)"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      rows="2.5"
                      className="glass-input block w-full rounded-xl py-2 px-3 text-slate-800 text-sm resize-none focus:outline-none"
                    ></textarea>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeclineForm(false)}
                      className="px-5 h-11 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all hover:scale-[1.02] cursor-pointer shadow-lg shadow-rose-500/10"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Submit Decline</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
