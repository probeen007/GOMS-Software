import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Search,
  Loader2,
  AlertCircle,
  X,
  User,
  Car,
  DollarSign,
  PlusCircle,
  Printer,
  CheckCircle,
  FileText,
  Camera,
  Archive,
  AlertTriangle,
  Filter
} from 'lucide-react';

export default function JobCards() {
  const { user } = useAuth();
  const isReceptionistOrAdmin = user?.role === 'admin' || user?.role === 'receptionist';
  const isTechnicianOrAdmin = user?.role === 'admin' || user?.role === 'technician';

  // State
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Close Card Form Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [mileageOut, setMileageOut] = useState('');
  const [findings, setFindings] = useState('');
  const [closeLoading, setCloseLoading] = useState(false);
  const [closeError, setCloseError] = useState('');

  // Fetch job cards log
  const fetchJobCards = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/job-cards', {
        params: { status: statusFilter }
      });
      setJobCards(response.data);
      // Auto-update selected card reference if already open
      if (selectedCard) {
        const updated = response.data.find(jc => jc._id === selectedCard._id);
        if (updated) setSelectedCard(updated);
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
    fetchJobCards();
    fetchInventory();
  }, [statusFilter]);

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
      const response = await axios.post(`/api/job-cards/${selectedCard._id}/parts`, {
        partId,
        qty: parseInt(partQty)
      });
      setSelectedCard(response.data);
      setPartId('');
      setPartQty(1);
      fetchJobCards();
      fetchInventory(); // refresh stock numbers
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
      const response = await axios.post(`/api/job-cards/${selectedCard._id}/labour`, {
        name: labourName,
        hours: parseFloat(labourHours),
        unitPrice: parseFloat(labourRate)
      });
      setSelectedCard(response.data);
      setLabourName('');
      setLabourHours('');
      setLabourRate('');
      fetchJobCards();
    } catch (err) {
      console.error(err);
      setLabourError(err.response?.data?.message || 'Failed to log labour');
    } finally {
      setLabourLoading(false);
    }
  };

  // Close Job Card submit
  const handleCloseCard = async (e) => {
    e.preventDefault();
    setCloseLoading(true);
    setCloseError('');

    try {
      const response = await axios.patch(`/api/job-cards/${selectedCard._id}/close`, {
        mileageOut: mileageOut ? parseInt(mileageOut) : undefined,
        findings
      });
      setSelectedCard(response.data);
      setIsCloseModalOpen(false);
      setMileageOut('');
      setFindings('');
      fetchJobCards();
    } catch (err) {
      console.error(err);
      setCloseError(err.response?.data?.message || 'Failed to close job card');
    } finally {
      setCloseLoading(false);
    }
  };

  const filteredJobCards = jobCards.filter(card => {
    const term = searchTerm.toLowerCase();
    const clientName = card.customerId?.name?.toLowerCase() || '';
    const plateNo = card.vehicleId?.plateNo?.toLowerCase() || '';
    const make = card.vehicleId?.make?.toLowerCase() || '';
    const model = card.vehicleId?.model?.toLowerCase() || '';
    const ref = card._id?.slice(-6).toLowerCase() || '';
    return clientName.includes(term) || plateNo.includes(term) || make.includes(term) || model.includes(term) || ref.includes(term);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Directory column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Job Cards</h1>
            <p className="text-slate-350 text-sm mt-1.5 font-medium">
              Track vehicle repairs, log workshop operations, and allocate inventory.
            </p>
          </div>
        </div>

        {/* Search & Filter widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-900/40 border border-slate-800 rounded-3xl shadow-md">
          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 mb-0.5">
              <Search className="w-4 h-4 text-primary-400" />
              Search Job Cards
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by plate, client name, model or REF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input block w-full rounded-xl h-11 pl-3.5 pr-10 text-slate-200 text-sm focus:outline-none placeholder-slate-500 font-medium"
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
              className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-200 text-sm focus:outline-none font-bold"
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="open" className="bg-slate-900">Open Tickets</option>
              <option value="closed" className="bg-slate-900">Closed Tickets</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-slate-400 text-sm mt-3 font-medium">Loading workshop logs...</p>
          </div>
        ) : filteredJobCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/30 mb-4">
              <Wrench className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-white">No job cards found</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm font-medium">
              {searchTerm ? "No job cards match your search criteria." : "Job cards are created automatically when estimates/quotations are approved by clients."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredJobCards.map((card) => (
              <div
                key={card._id}
                onClick={() => setSelectedCard(card)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${selectedCard?._id === card._id ? 'bg-primary-950/20 border-primary-500/40' : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/60'}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">CARD: {card._id.slice(-6).toUpperCase()}</span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${card.status === 'open' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {card.status}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{card.customerId?.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="px-2 py-0.5 bg-primary-950 text-primary-400 border border-primary-500/10 font-mono font-bold rounded uppercase text-xs">
                      {card.vehicleId?.plateNo}
                    </span>
                    <span>{card.vehicleId?.make} {card.vehicleId?.model}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-extrabold block">Total billing</span>
                  <p className="text-base font-black text-indigo-400 font-mono mt-0.5">Rs. {card.total.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Opened: {new Date(card.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workshop Desk Detailed panel */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-white tracking-tight">Workshop Detail Workspace</h2>
        {selectedCard ? (
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Header info */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-mono text-primary-400 font-bold bg-primary-950/45 px-2.5 py-0.5 border border-primary-500/25 rounded">
                  JC ID: {selectedCard._id}
                </span>
                <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${selectedCard.status === 'open' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {selectedCard.status}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-2">{selectedCard.customerId?.name}</h3>
              <p className="text-sm text-slate-400 font-medium">Plate Number: <strong className="font-mono text-slate-200 uppercase">{selectedCard.vehicleId?.plateNo}</strong></p>
            </div>

            {/* Intake Mileage & photos references */}
            {selectedCard.appointmentId?.checkIn && (
              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl space-y-2.5">
                <span className="text-xs font-extrabold text-violet-400 uppercase tracking-widest block">Intake Check-In Parameters</span>
                <div className="text-sm space-y-1.5 text-slate-300 font-medium">
                  <p>Intake Odometer: <strong className="font-mono text-slate-100">{selectedCard.appointmentId.checkIn.mileageIn.toLocaleString()} km</strong></p>
                  {selectedCard.appointmentId.checkIn.conditionNotes && (
                    <p className="text-xs italic text-slate-400 mt-1">&quot;{selectedCard.appointmentId.checkIn.conditionNotes}&quot;</p>
                  )}
                </div>

                {selectedCard.appointmentId.checkIn.photos && selectedCard.appointmentId.checkIn.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1.5">
                    {selectedCard.appointmentId.checkIn.photos.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="aspect-video rounded overflow-hidden border border-slate-850 bg-slate-950">
                        <img src={url} alt="Checkin intake" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diagnoses / Findings */}
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Diagnoses & Findings Log</span>
              <p className="text-sm text-slate-300 bg-slate-900/50 p-3.5 rounded-xl border border-slate-850 italic font-medium leading-relaxed">
                {selectedCard.findings || 'No diagnoses recorded yet.'}
              </p>
            </div>

            {/* Line allocations display */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Allocated Spares</span>
                {selectedCard.parts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">No parts allocated yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCard.parts.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-200">
                        <span className="font-medium">{p.name} <strong className="text-slate-400 text-xs font-normal">({p.qty} x Rs. {p.unitPrice})</strong></span>
                        <span className="font-mono font-bold">Rs. {p.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Logged Labour</span>
                {selectedCard.labour.length === 0 ? (
                  <p className="text-xs text-slate-500 italic font-medium">No labor logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCard.labour.map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm text-slate-200">
                        <span className="font-medium">{l.name} <strong className="text-slate-400 text-xs font-normal">({l.hours} hrs x Rs. {l.unitPrice})</strong></span>
                        <span className="font-mono font-bold">Rs. {l.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Finance totals */}
            <div className="space-y-2.5 border-t border-slate-800 pt-4 text-sm font-semibold text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-200 font-bold">Rs. {selectedCard.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT (13%):</span>
                <span className="font-mono">Rs. {selectedCard.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-850 pt-3">
                <span className="text-indigo-400">Total Billable:</span>
                <span className="font-mono text-indigo-400">Rs. {selectedCard.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Forms section (Technicians can add spares/labour, reception can close) */}
            {selectedCard.status === 'open' && (
              <div className="space-y-4 pt-4 border-t border-slate-850">
                {isTechnicianOrAdmin && (
                  <>
                    {/* Add Part Form */}
                    <form onSubmit={handleAllocatePart} className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-3">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest block">Allocate Spare Part</span>
                      {partError && <p className="text-xs text-rose-400 font-medium">{partError}</p>}
                      <div className="flex gap-2">
                        <select
                          required
                          value={partId}
                          onChange={(e) => setPartId(e.target.value)}
                          className="glass-input block flex-1 rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
                        >
                          <option value="" className="bg-slate-950">-- Pick Part --</option>
                          {inventoryList.map(p => (
                            <option key={p._id} value={p._id} className="bg-slate-950" disabled={p.qty <= 0}>
                              {p.name} (Stock: {p.qty}) (Rs. {p.unitPrice})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={partQty}
                          onChange={(e) => setPartQty(e.target.value)}
                          className="glass-input block w-16 rounded-xl h-11 px-2 text-slate-205 text-sm text-center focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={partLoading}
                          className="h-11 px-5 bg-indigo-650 hover:bg-indigo-550 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </form>

                    {/* Add Labour Form */}
                    <form onSubmit={handleLogLabour} className="p-4 bg-slate-900/40 border border-slate-855 rounded-2xl space-y-3">
                      <span className="text-xs font-extrabold text-slate-450 uppercase tracking-widest block">Log Labor Task</span>
                      {labourError && <p className="text-xs text-rose-400 font-medium">{labourError}</p>}
                      <input
                        type="text"
                        required
                        placeholder="Operation Description (e.g. Engine tuning)"
                        value={labourName}
                        onChange={(e) => setLabourName(e.target.value)}
                        className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="Hours"
                          value={labourHours}
                          onChange={(e) => setLabourHours(e.target.value)}
                          className="glass-input block w-1/2 rounded-xl h-11 px-3 text-slate-205 text-sm text-center focus:outline-none"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Rate (Rs.)"
                          value={labourRate}
                          onChange={(e) => setLabourRate(e.target.value)}
                          className="glass-input block w-1/2 rounded-xl h-11 px-3 text-slate-205 text-sm text-center focus:outline-none font-mono"
                        />
                        <button
                          type="submit"
                          disabled={labourLoading}
                          className="h-11 px-5 bg-indigo-650 hover:bg-indigo-550 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 cursor-pointer"
                        >
                          Log
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {/* Close job card (Receptionist/Admin only) */}
                {isReceptionistOrAdmin && (
                  <button
                    onClick={() => setIsCloseModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    <span>Close Work Ticket</span>
                  </button>
                )}
              </div>
            )}

            {/* Print Action Sheet */}
            <div className="pt-2">
              <a
                href={`/api/job-cards/${selectedCard._id}/pdf?token=${localStorage.getItem('token')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl text-sm font-bold text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-750 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Printer className="w-4.5 h-4.5" />
                <span>Print Job Sheet / Worksheet</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-900/10 border border-slate-850 py-16 text-center">
            <p className="text-slate-400 text-sm font-medium">Select a job card from the workshop list to log diagnostic updates, allocate parts, or sign off and close the ticket.</p>
          </div>
        )}
      </div>

      {/* Modal: Close Job Card */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-455" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Sign Off / Close Job Card</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCloseModalOpen(false);
                  setMileageOut('');
                  setFindings('');
                  setCloseError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseCard} className="p-6 space-y-4">
              {closeError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-455 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium leading-relaxed">{closeError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Odometer Mileage Out (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 102500"
                  value={mileageOut}
                  onChange={(e) => setMileageOut(e.target.value)}
                  className="glass-input block w-full rounded-xl h-11 px-3.5 text-slate-205 text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-widest block mb-0.5">Diagnostic Findings & Actions Taken *</label>
                <textarea
                  required
                  placeholder="Summarize parts replaced, tasks completed, or instructions for the client..."
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  rows="3"
                  className="glass-input block w-full rounded-xl py-3 px-3.5 text-slate-205 text-sm resize-none focus:outline-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCloseModalOpen(false);
                    setMileageOut('');
                    setFindings('');
                    setCloseError('');
                  }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closeLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-550/15 cursor-pointer"
                >
                  {closeLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Closing Card...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4.5 h-4.5" />
                      <span>Close Ticket</span>
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
