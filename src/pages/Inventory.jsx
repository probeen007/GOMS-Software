import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  TrendingDown,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  X,
  PlusCircle,
  Trash2,
  Briefcase,
  Layers,
  ArrowRight,
  Package,
  DollarSign
} from 'lucide-react';

export default function Inventory() {
  const { user } = useAuth();
  const isAuthorized = user?.role === 'admin' || user?.role === 'accountant';

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);

  // Modal: Add New Part
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    supplierName: '',
    qty: 0,
    minQty: 5,
    unitCost: 0,
    unitPrice: 0
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Modal: Edit Part
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Modal: Record Purchase/Restock
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
    supplierName: '',
    items: [{ partId: '', qty: 1, unitCost: 0 }],
    totalCost: 0
  });
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Fetch Inventory Items
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/inventory', {
        params: { search, lowStock }
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInventory();
    }, 450);
    return () => clearTimeout(delayDebounceFn);
  }, [search, lowStock]);

  // Recalculate Purchase Total
  useEffect(() => {
    const total = purchaseData.items.reduce((sum, item) => {
      return sum + (Number(item.qty) * Number(item.unitCost));
    }, 0);
    setPurchaseData(prev => ({ ...prev, totalCost: total }));
  }, [purchaseData.items]);

  // Handle Add New Part
  const handleAddNewItem = async (e) => {
    e.preventDefault();
    if (!newItem.sku || !newItem.name || newItem.unitCost < 0 || newItem.unitPrice < 0) {
      setAddError('Please enter valid details.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      await axios.post('/api/inventory', newItem);
      setIsAddModalOpen(false);
      setNewItem({
        sku: '',
        name: '',
        supplierName: '',
        qty: 0,
        minQty: 5,
        unitCost: 0,
        unitPrice: 0
      });
      fetchInventory();
    } catch (error) {
      console.error(error);
      setAddError(error.response?.data?.message || 'Failed to register item');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Edit Part Details
  const handleEditItemSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      await axios.patch(`/api/inventory/${editingItem._id}`, editingItem);
      setIsEditModalOpen(false);
      setEditingItem(null);
      fetchInventory();
    } catch (error) {
      console.error(error);
      setEditError(error.response?.data?.message || 'Failed to update item');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Purchase Restocking Submit
  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    // Validate rows
    const emptyRows = purchaseData.items.some(item => !item.partId || item.qty <= 0 || item.unitCost < 0);
    if (emptyRows || !purchaseData.supplierName) {
      setPurchaseError('Please fill in all supplier and row fields with valid quantities/costs.');
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError('');
    try {
      await axios.post('/api/inventory/purchases', purchaseData);
      setIsPurchaseModalOpen(false);
      setPurchaseData({
        supplierName: '',
        items: [{ partId: '', qty: 1, unitCost: 0 }],
        totalCost: 0
      });
      fetchInventory();
    } catch (error) {
      console.error(error);
      setPurchaseError(error.response?.data?.message || 'Failed to log purchase');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Restock helper lines management
  const addPurchaseRow = () => {
    setPurchaseData(prev => ({
      ...prev,
      items: [...prev.items, { partId: '', qty: 1, unitCost: 0 }]
    }));
  };

  const removePurchaseRow = (index) => {
    if (purchaseData.items.length === 1) return;
    const list = [...purchaseData.items];
    list.splice(index, 1);
    setPurchaseData(prev => ({ ...prev, items: list }));
  };

  const handlePurchaseRowChange = (index, field, value) => {
    const list = [...purchaseData.items];
    list[index][field] = value;
    setPurchaseData(prev => ({ ...prev, items: list }));
  };

  // Count low stock items
  const lowStockCount = items.filter(item => item.qty < item.minQty).length;

  return (
    <div className="space-y-6">
      {/* Header and Callout Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Parts Inventory Ledger</h1>
          <p className="text-slate-350 text-sm mt-1.5 font-medium">
            Monitor auto component stock, update values, and log restocking logs directly to accounts.
          </p>
        </div>

        {isAuthorized && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 h-11 rounded-xl text-sm font-bold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>Record Purchase</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] glow-effect cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Add Part</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search parts by SKU, description, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-12 block w-full h-12 rounded-2xl text-slate-205 text-base focus:outline-none placeholder-slate-500"
          />
        </div>

        <div className="h-12 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between px-4 shadow-sm hover:border-slate-700 transition-colors">
          <label className="flex items-center gap-3.5 cursor-pointer select-none">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={lowStock}
                onChange={(e) => setLowStock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-amber-550 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 peer-checked:after:bg-white shadow-inner"></div>
            </div>
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">
              Low Stock Alert Only
            </span>
          </label>
        </div>

        <div className="h-12 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between px-5">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings</span>
          <span className={`text-base font-black px-3 py-0.5 rounded-full ${lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-slate-850 text-slate-500'}`}>
            {lowStockCount}
          </span>
        </div>
      </div>

      {/* Inventory Database Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/15 rounded-3xl border border-slate-800/65 py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-slate-400 text-sm mt-3 font-medium">Fetching parts catalog...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-900/20 rounded-3xl border border-slate-800/80 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/30 mb-4">
            <Package className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white">No parts cataloged</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            {search || lowStock ? 'No parts match the selected filters.' : 'Get started by creating your first inventory item.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table for larger screens */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-xl">
            <table className="min-w-full divide-y divide-slate-800 text-left">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">SKU</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-center">Stock Level</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Unit Cost</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Unit Price</th>
                  <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest">Supplier</th>
                  {isAuthorized && <th className="px-6 py-4.5 text-xs font-extrabold text-slate-400 uppercase tracking-widest text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/55 bg-transparent">
                {items.map((item) => {
                  const isLow = item.qty < item.minQty;
                  return (
                    <tr key={item._id} className="hover:bg-slate-800/15 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded font-mono text-sm font-bold bg-slate-800 border border-slate-700/85 text-primary-400 uppercase tracking-wider">
                          {item.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-base font-bold text-white">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`text-sm font-black px-3 py-1 rounded-full ${isLow ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {item.qty} units
                          </span>
                          {isLow && (
                            <span className="text-slate-500 text-xs font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              Min limit: {item.minQty}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-205 font-mono font-bold">
                        Rs. {item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-205 font-mono font-bold">
                        Rs. {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-350 font-medium">
                        {item.supplierName || 'Not cataloged'}
                      </td>
                      {isAuthorized && (
                        <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit part specs"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards for mobile screens */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {items.map((item) => {
              const isLow = item.qty < item.minQty;
              return (
                <div key={item._id} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-slate-800 border border-slate-700/85 text-primary-400 uppercase">
                      {item.sku}
                    </span>
                    <span className={`text-xxs font-extrabold px-2 py-0.5 rounded-full ${isLow ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {item.qty} units
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{item.name}</h4>
                    <p className="text-xxs text-slate-500 mt-1">Supplier: {item.supplierName || 'Not cataloged'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-800/50 py-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-xxs text-slate-500 uppercase tracking-wider">Unit Cost</span>
                      <p className="font-mono text-slate-300 font-semibold">Rs. {item.unitCost.toFixed(2)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xxs text-slate-500 uppercase tracking-wider">Unit Price</span>
                      <p className="font-mono text-slate-300 font-semibold">Rs. {item.unitPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {isLow ? (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Below min threshold ({item.minQty})
                      </span>
                    ) : (
                      <span />
                    )}

                    {isAuthorized && (
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer transition-all hover:scale-105"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add Inventory Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Catalog Inventory Part</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{addError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Unique SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OIF-10W40"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm placeholder-slate-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oil Filter 10W40"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm placeholder-slate-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bosch Nepal"
                    value={newItem.supplierName}
                    onChange={(e) => setNewItem({ ...newItem, supplierName: e.target.value })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm placeholder-slate-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Min Alarm Qty</label>
                  <input
                    type="number"
                    value={newItem.minQty}
                    onChange={(e) => setNewItem({ ...newItem, minQty: parseInt(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Initial Qty</label>
                  <input
                    type="number"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5" />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Unit Cost (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Unit Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] cursor-pointer glow-effect"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Catalog Part</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Inventory Item */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Edit Part Specifications</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Unique SKU</label>
                  <input
                    type="text"
                    required
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value.toUpperCase() })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Supplier Name</label>
                  <input
                    type="text"
                    value={editingItem.supplierName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Min Alarm Qty</label>
                  <input
                    type="number"
                    value={editingItem.minQty}
                    onChange={(e) => setEditingItem({ ...editingItem, minQty: parseInt(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Current Stock (Manual Edit)</label>
                  <input
                    type="number"
                    value={editingItem.qty}
                    onChange={(e) => setEditingItem({ ...editingItem, qty: parseInt(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5" />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Unit Cost (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.unitCost}
                    onChange={(e) => setEditingItem({ ...editingItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Unit Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] cursor-pointer glow-effect"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Purchase/Restock */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/75 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl glass-card rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-400" />
                <h2 className="text-xl font-extrabold text-white tracking-tight">Record Supplier Purchase</h2>
              </div>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="p-6 space-y-4">
              {purchaseError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-300 font-medium">{purchaseError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bosch Auto Parts Ltd."
                  value={purchaseData.supplierName}
                  onChange={(e) => setPurchaseData({ ...purchaseData, supplierName: e.target.value })}
                  className="glass-input block w-full rounded-xl py-2.5 px-3.5 text-slate-200 text-sm placeholder-slate-650"
                />
              </div>

              {/* Line Items List */}
              <div className="space-y-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Purchase Order Items</span>
                  <button
                    type="button"
                    onClick={addPurchaseRow}
                    className="flex items-center gap-1 text-xxs font-bold text-primary-400 hover:text-primary-350"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {purchaseData.items.map((row, index) => (
                    <div key={index} className="flex gap-3 items-end bg-slate-900/40 p-3 rounded-2xl border border-slate-850">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Select Part *</label>
                        <select
                          required
                          value={row.partId}
                          onChange={(e) => handlePurchaseRowChange(index, 'partId', e.target.value)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-xs"
                        >
                          <option value="" className="bg-slate-900">-- Choose Item --</option>
                          {items.map(part => (
                            <option key={part._id} value={part._id} className="bg-slate-900">
                              [{part.sku}] {part.name} (Stock: {part.qty})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Qty *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={row.qty}
                          onChange={(e) => handlePurchaseRowChange(index, 'qty', parseInt(e.target.value) || 0)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-xs"
                        />
                      </div>

                      <div className="w-28 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Unit Cost (Rs.) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={row.unitCost}
                          onChange={(e) => handlePurchaseRowChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="glass-input block w-full rounded-xl py-2 px-3 text-slate-200 text-xs font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removePurchaseRow(index)}
                        disabled={purchaseData.items.length === 1}
                        className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary banner */}
              <div className="p-4 bg-gradient-to-r from-primary-950/40 to-slate-900 border border-primary-500/10 rounded-2xl flex items-center justify-between mt-4">
                <div>
                  <span className="text-xs font-extrabold text-primary-400 uppercase tracking-widest">Estimated Expenditure</span>
                  <p className="text-xs text-slate-400 mt-0.5">Auto-registered as shop expense ledger entry</p>
                </div>
                <div className="flex items-center gap-1 font-black text-xl text-primary-400">
                  <span className="text-xs font-bold mr-1">Rs.</span>
                  <span>{purchaseData.totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-5 h-11 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseLoading}
                  className="flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/10 hover:scale-[1.02] cursor-pointer glow-effect"
                >
                  {purchaseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Submit Purchase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
