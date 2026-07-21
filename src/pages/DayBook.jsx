import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatNepaliDate } from '../utils/nepaliDate';
import {
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Lock,
  Unlock,
  Save,
  HelpCircle,
  FileText,
  DollarSign
} from 'lucide-react';

export default function DayBook() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Selected date state (defaults to today's date in YYYY-MM-DD format)
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Loaded daybook details & transaction aggregates
  const [daybookData, setDaybookData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'receipts' | 'payments'

  // Form input states
  const [openingCash, setOpeningCash] = useState(0);
  const [openingBank, setOpeningBank] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const [closingBank, setClosingBank] = useState(0);
  const [notes, setNotes] = useState('');

  const fetchDaybook = async (date) => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const response = await axios.get(`/api/daybook/date/${date}`);
      const { daybook, transactions, aggregates } = response.data;
      setDaybookData({ daybook, transactions, aggregates });
      
      // Initialize inputs from loaded daybook
      setOpeningCash(daybook.openingBalanceCash || 0);
      setOpeningBank(daybook.openingBalanceBank || 0);
      setClosingCash(daybook.closingBalanceCash || 0);
      setClosingBank(daybook.closingBalanceBank || 0);
      setNotes(daybook.notes || '');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Day Book records for the selected date');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaybook(selectedDate);
  }, [selectedDate]);

  const handleSaveDaybook = async (closeDay) => {
    setSaveLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const payload = {
        date: selectedDate,
        openingBalanceCash: Number(openingCash) || 0,
        openingBalanceBank: Number(openingBank) || 0,
        closingBalanceCash: Number(closingCash) || 0,
        closingBalanceBank: Number(closingBank) || 0,
        isClosed: closeDay,
        notes
      };

      const response = await axios.post('/api/daybook/save', payload);
      setSaveSuccess(closeDay ? 'Day Book Closed & Reconciled Successfully!' : 'Day Book Draft Saved Successfully!');
      
      // Reload daybook details
      fetchDaybook(selectedDate);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save Day Book record');
    } finally {
      setSaveLoading(false);
    }
  };

  const isClosed = daybookData?.daybook?.isClosed;
  const canEdit = !isClosed || isAdmin;

  // Expected Closing computation:
  // Expected = Opening + Receipts - Payments
  const expectedCash = Number(openingCash) + (daybookData?.aggregates?.receiptsCash || 0) - (daybookData?.aggregates?.paymentsCash || 0);
  const expectedBank = Number(openingBank) + (daybookData?.aggregates?.receiptsBank || 0) - (daybookData?.aggregates?.paymentsBank || 0);

  // Variance: Difference between Actual Closing (user input) and Expected Closing (calculated)
  const varianceCash = Number(closingCash) - expectedCash;
  const varianceBank = Number(closingBank) - expectedBank;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Daily Day Book Tracker</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reconcile daily payments, track opening/closing cash balances, and manage transactional audit journals.
          </p>
        </div>

        {/* Date Selector input */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <Calendar className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-0 p-0 text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-3xl border border-slate-200 shadow-sm py-12">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500 mt-4 font-bold">Retrieving daybook logs and aggregates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main ledger & transaction details (left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick status bar */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${isClosed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <div className="flex items-center gap-2.5">
                {isClosed ? (
                  <>
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-extrabold">Day Book Closed &amp; Reconciled</p>
                      <p className="text-xs text-emerald-600 font-medium">This day's accounts are locked from standard edits.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-extrabold">Day Book Active / Open</p>
                      <p className="text-xs text-amber-600 font-medium">Accepting transactions, balancing, and updates.</p>
                    </div>
                  </>
                )}
              </div>
              
              {!canEdit && (
                <span className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-emerald-600 text-white rounded-lg border border-emerald-700">
                  Read Only
                </span>
              )}
            </div>

            {/* Error / Success feedback */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-700 font-bold">{error}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-emerald-700 font-bold">{saveSuccess}</span>
              </div>
            )}

            {/* Tabs Selector */}
            <div className="flex gap-2.5 border-b border-slate-100 pb-px">
              <button
                onClick={() => setActiveTab('summary')}
                className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${activeTab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Day Ledger Journal
              </button>
              <button
                onClick={() => setActiveTab('receipts')}
                className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${activeTab === 'receipts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Inflow (Receipts)
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-3 text-sm font-bold border-b-2 px-1 transition-all cursor-pointer ${activeTab === 'payments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                Outflow (Payments)
              </button>
            </div>

            {/* Tab: Summary Ledger */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cash Flow Summary Inflow */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Cash Inflow</span>
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">CASH RECEIPTS</span>
                        <span className="text-sm font-mono font-bold text-slate-700">Rs. {(daybookData?.aggregates?.receiptsCash || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">BANK RECEIPTS</span>
                        <span className="text-sm font-mono font-bold text-slate-700">Rs. {(daybookData?.aggregates?.receiptsBank || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow Summary Outflow */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Cash Outflow</span>
                      <TrendingDown className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">CASH OUT</span>
                        <span className="text-sm font-mono font-bold text-slate-700">Rs. {(daybookData?.aggregates?.paymentsCash || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">BANK OUT</span>
                        <span className="text-sm font-mono font-bold text-slate-700">Rs. {(daybookData?.aggregates?.paymentsBank || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined transaction ledger */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Transaction Journal Entries</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{formatNepaliDate(selectedDate)}</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
                    {/* Receipts / Payments List */}
                    {daybookData?.transactions?.payments?.map((txn) => (
                      <div key={txn._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold uppercase rounded text-[9px] border border-emerald-100">INFLOW</span>
                            Payment Received (Invoice #{txn.invoiceId?.invoiceNo})
                          </p>
                          <p className="text-slate-500 text-[10px]">Method: <strong className="uppercase">{txn.method}</strong> &bull; Ref: {txn.reference || 'None'} &bull; By: {txn.receivedBy?.name}</p>
                        </div>
                        <span className="font-mono font-extrabold text-emerald-600 text-sm shrink-0 ml-4">
                          +Rs. {txn.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {/* Expenditures List */}
                    {daybookData?.transactions?.expenditures?.map((txn) => (
                      <div key={txn._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold uppercase rounded text-[9px] border border-rose-100">OUTFLOW</span>
                            Expenditure: {txn.category}
                          </p>
                          <p className="text-slate-500 text-[10px]">Note: {txn.note || 'None'}</p>
                        </div>
                        <span className="font-mono font-extrabold text-rose-600 text-sm shrink-0 ml-4">
                          -Rs. {txn.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {/* Purchases List */}
                    {daybookData?.transactions?.purchases?.map((txn) => (
                      <div key={txn._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-extrabold uppercase rounded text-[9px] border border-slate-200">OUTFLOW</span>
                            Supplier Purchase Restock ({txn.supplierName})
                          </p>
                          <p className="text-slate-500 text-[10px]">Type: <strong className="uppercase">{txn.purchaseType}</strong> &bull; Total items: {txn.items?.length || 0}</p>
                        </div>
                        <span className="font-mono font-extrabold text-rose-600 text-sm shrink-0 ml-4">
                          -Rs. {txn.totalCost.toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {daybookData?.transactions?.payments?.length === 0 &&
                     daybookData?.transactions?.expenditures?.length === 0 &&
                     daybookData?.transactions?.purchases?.length === 0 && (
                      <div className="p-8 text-center text-slate-400 italic">
                        No transactions registered on this calendar day.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Receipts Inflow */}
            {activeTab === 'receipts' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Receipts Inflow Log</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
                  {daybookData?.transactions?.payments?.map((txn) => (
                    <div key={txn._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">Invoice Payment</p>
                        <p className="text-slate-500 text-[10px]">Invoice Ref: #{txn.invoiceId?.invoiceNo} &bull; Method: <strong className="uppercase">{txn.method}</strong> &bull; Ref: {txn.reference || 'N/A'}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">Rs. {txn.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {daybookData?.transactions?.payments?.length === 0 && (
                    <div className="p-6 text-center text-slate-400 italic">No receipts recorded on this day.</div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Payments Outflow */}
            {activeTab === 'payments' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payments Outflow Log</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto pr-1">
                  {/* Manual expenditures */}
                  {daybookData?.transactions?.expenditures?.map((txn) => (
                    <div key={txn._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">Manual Expenditure: {txn.category}</p>
                        <p className="text-slate-500 text-[10px]">{txn.note}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600">Rs. {txn.amount.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Stock purchases */}
                  {daybookData?.transactions?.purchases?.map((txn) => (
                    <div key={txn._id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800">Inventory Purchase Restock</p>
                        <p className="text-slate-500 text-[10px]">Supplier: {txn.supplierName} &bull; Bill: {txn.purchaseType}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600">Rs. {txn.totalCost.toFixed(2)}</span>
                    </div>
                  ))}

                  {daybookData?.transactions?.expenditures?.length === 0 &&
                   daybookData?.transactions?.purchases?.length === 0 && (
                    <div className="p-6 text-center text-slate-400 italic">No payments recorded on this day.</div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Opening, closing balances, reconciliations & save actions (right 1 col) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Balances Reconciliation</span>
              </h3>

              <div className="space-y-4">
                {/* 1. Opening Cash */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Cash Opening Balance (Rs.)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    className="block w-full h-10 rounded-xl border-slate-200 text-xs font-semibold font-mono disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* 2. Opening Bank */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Bank Opening Balance (Rs.)</label>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={openingBank}
                    onChange={(e) => setOpeningBank(e.target.value)}
                    className="block w-full h-10 rounded-xl border-slate-200 text-xs font-semibold font-mono disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* Expected Closings (calculated dynamically) */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2">
                  <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wide block">Expected Balances</span>
                  <div className="flex justify-between font-mono font-bold text-slate-700">
                    <span>Expected Cash:</span>
                    <span>Rs. {expectedCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono font-bold text-slate-700">
                    <span>Expected Bank:</span>
                    <span>Rs. {expectedBank.toFixed(2)}</span>
                  </div>
                </div>

                {/* 3. Actual Closing Cash */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Cash Closing Balance (Rs.)</label>
                    {varianceCash !== 0 && (
                      <span className={`text-[10px] font-bold ${varianceCash > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {varianceCash > 0 ? `+${varianceCash.toFixed(2)}` : varianceCash.toFixed(2)} Var
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    className={`block w-full h-10 rounded-xl border-slate-200 text-xs font-semibold font-mono disabled:bg-slate-50 disabled:text-slate-500 ${varianceCash !== 0 ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-400' : ''}`}
                  />
                </div>

                {/* 4. Actual Closing Bank */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Bank Closing Balance (Rs.)</label>
                    {varianceBank !== 0 && (
                      <span className={`text-[10px] font-bold ${varianceBank > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {varianceBank > 0 ? `+${varianceBank.toFixed(2)}` : varianceBank.toFixed(2)} Var
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    disabled={!canEdit}
                    value={closingBank}
                    onChange={(e) => setClosingBank(e.target.value)}
                    className={`block w-full h-10 rounded-xl border-slate-200 text-xs font-semibold font-mono disabled:bg-slate-50 disabled:text-slate-500 ${varianceBank !== 0 ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-400' : ''}`}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Notes &amp; Discrepancies</label>
                  <textarea
                    disabled={!canEdit}
                    placeholder="Describe any shortages, bank deposit details, card terminal settlements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    className="block w-full rounded-xl border-slate-200 text-xs resize-none py-2 px-3 disabled:bg-slate-50 disabled:text-slate-500"
                  ></textarea>
                </div>
              </div>

              {/* Form submit actions */}
              {canEdit ? (
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={saveLoading}
                    onClick={() => handleSaveDaybook(false)}
                    className="flex items-center justify-center gap-1.5 h-11 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-slate-400" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={saveLoading}
                    onClick={() => handleSaveDaybook(true)}
                    className="flex items-center justify-center gap-1.5 h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    {saveLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>Lock &amp; Close</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-[11px] text-slate-500 font-semibold italic">Reconciliation finalized. Standard edits locked.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
