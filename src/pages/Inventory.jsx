import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  ShoppingBag,
  Loader2,
  AlertTriangle,
  X,
  PlusCircle,
  Trash2,
  Package
} from 'lucide-react';

export default function Inventory() {
  const { user } = useAuth();
  const isAuthorized = user?.role === 'admin' || user?.role === 'accountant';

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [vatRate, setVatRate] = useState(13);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data) {
          setVatRate(res.data.vatRate || 13);
          setPurchaseData(prev => ({
            ...prev,
            purchaseType: res.data.vatEnabled ? 'vat' : 'non-vat'
          }));
        }
      } catch (err) {
        console.error('Error fetching settings in Inventory:', err);
      }
    };
    fetchSettings();
  }, []);

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
    totalCost: 0,
    purchaseType: 'non-vat',
    subtotal: 0,
    vat: 0
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
    if (purchaseData.purchaseType === 'vat') {
      const sub = total;
      const vatVal = Math.round((sub * (vatRate / 100)) * 100) / 100;
      setPurchaseData(prev => ({
        ...prev,
        subtotal: sub,
        vat: vatVal,
        totalCost: sub + vatVal
      }));
    } else {
      setPurchaseData(prev => ({
        ...prev,
        subtotal: total,
        vat: 0,
        totalCost: total
      }));
    }
  }, [purchaseData.items, purchaseData.purchaseType, vatRate]);

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
        totalCost: 0,
        purchaseType: 'non-vat',
        subtotal: 0,
        vat: 0
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

  // Count low stock items and valuation
  const lowStockCount = items.filter(item => item.qty < item.minQty).length;
  const totalValuation = items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0);

  return (
    <div className="space-y-6">
      {/* Header and Callout Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            <span>Parts Inventory</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor auto component stock, update values, and log restocking directly to accounts.
          </p>
        </div>

        {isAuthorized && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              <span>Record Restock</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-sm shadow-blue-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Part SKU</span>
            </button>
          </div>
        )}
      </div>

      {/* Analytics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Catalog SKUs</span>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{items.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Stock Reorder Alerts</span>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{lowStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Stock Valuation</span>
            <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">Rs. {totalValuation.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search parts by SKU, description, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 block w-full h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-blue-500 outline-none transition-all placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 h-10 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => setLowStock(e.target.checked)}
              className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-600">
              Low Stock Only ({lowStockCount})
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Database Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 py-12 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-3 font-medium">Fetching parts catalog...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 mb-4">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No parts cataloged</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm">
            {search || lowStock ? 'No parts match the selected filters.' : 'Get started by creating your first inventory item.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table for larger screens */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm max-h-[calc(100vh-340px)] min-h-[350px] overflow-y-auto pr-1">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">SKU</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Description</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-center">Stock Level</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Cost</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Supplier</th>
                    {isAuthorized && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wide text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-transparent">
                  {items.map((item) => {
                    const isLow = item.qty < item.minQty;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-blue-50 border border-blue-100 text-blue-700 uppercase tracking-wide">
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-mono font-bold">
                          Rs. {item.unitCost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-mono font-bold">
                          Rs. {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {item.supplierName || 'Not cataloged'}
                        </td>
                        {isAuthorized && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
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
          </div>

          {/* Cards for mobile screens */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {items.map((item) => {
              const isLow = item.qty < item.minQty;
              return (
                <div key={item._id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-blue-50 border border-blue-100 text-blue-700 uppercase">
                      {item.sku}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {item.qty} units
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Supplier: {item.supplierName || 'Not cataloged'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">Unit Cost</span>
                      <p className="font-mono text-slate-700 font-semibold">Rs. {item.unitCost.toFixed(2)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">Unit Price</span>
                      <p className="font-mono text-slate-700 font-semibold">Rs. {item.unitPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {isLow ? (
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
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
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Catalog Inventory Part</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{addError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unique SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OIF-10W40"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oil Filter 10W40"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bosch Nepal"
                    value={newItem.supplierName}
                    onChange={(e) => setNewItem({ ...newItem, supplierName: e.target.value })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Min Alarm Qty</label>
                  <input
                    type="number"
                    value={newItem.minQty}
                    onChange={(e) => setNewItem({ ...newItem, minQty: parseInt(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Initial Qty</label>
                  <input
                    type="number"
                    value={newItem.qty}
                    onChange={(e) => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5" />

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit Cost (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {addLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Catalog Part</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Inventory Item */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Part Specifications</h2>
              <button onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unique SKU</label>
                  <input
                    type="text"
                    required
                    value={editingItem.sku}
                    onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value.toUpperCase() })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Item Name</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Supplier Name</label>
                  <input
                    type="text"
                    value={editingItem.supplierName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Min Alarm Qty</label>
                  <input
                    type="number"
                    value={editingItem.minQty}
                    onChange={(e) => setEditingItem({ ...editingItem, minQty: parseInt(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Current Stock (Manual Edit)</label>
                  <input
                    type="number"
                    value={editingItem.qty}
                    onChange={(e) => setEditingItem({ ...editingItem, qty: parseInt(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5" />

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit Cost (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.unitCost}
                    onChange={(e) => setEditingItem({ ...editingItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Unit Price (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Purchase/Restock */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Record Supplier Purchase</h2>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPurchase} className="p-6 space-y-4">
              {purchaseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-rose-700 font-bold">{purchaseError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bosch Auto Parts Ltd."
                    value={purchaseData.supplierName}
                    onChange={(e) => setPurchaseData({ ...purchaseData, supplierName: e.target.value })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Purchase Type *</label>
                  <select
                    value={purchaseData.purchaseType}
                    onChange={(e) => setPurchaseData({ ...purchaseData, purchaseType: e.target.value })}
                    className="block w-full h-11 rounded-xl border-slate-200 text-sm"
                  >
                    <option value="non-vat">Non-VAT</option>
                    <option value="vat">VAT (13%)</option>
                  </select>
                </div>
              </div>

              {purchaseData.purchaseType === 'vat' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Subtotal (Rs.)</label>
                    <input
                      type="text"
                      disabled
                      value={purchaseData.subtotal.toFixed(2)}
                      className="block w-full h-10 rounded-lg border-slate-200 text-xs bg-slate-100 font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">VAT Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseData.vat}
                      onChange={(e) => {
                        const vatVal = parseFloat(e.target.value) || 0;
                        setPurchaseData(prev => ({
                          ...prev,
                          vat: vatVal,
                          totalCost: prev.subtotal + vatVal
                        }));
                      }}
                      className="block w-full h-10 rounded-lg border-slate-200 text-xs bg-white font-mono font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Line Items List */}
              <div className="space-y-3 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Purchase Order Items</span>
                  <button
                    type="button"
                    onClick={addPurchaseRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item Row</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {purchaseData.items.map((row, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 sm:items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Select Part *</label>
                        <select
                          required
                          value={row.partId}
                          onChange={(e) => handlePurchaseRowChange(index, 'partId', e.target.value)}
                          className="block w-full h-10 rounded-lg border-slate-200 text-xs cursor-pointer"
                        >
                          <option value="">-- Choose Item --</option>
                          {items.map(part => (
                            <option key={part._id} value={part._id}>
                              [{part.sku}] {part.name} (Stock: {part.qty})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:w-20 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Qty *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={row.qty}
                          onChange={(e) => handlePurchaseRowChange(index, 'qty', parseInt(e.target.value) || 0)}
                          className="block w-full h-10 rounded-lg border-slate-200 text-xs"
                        />
                      </div>

                      <div className="sm:w-28 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Cost (Rs.) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={row.unitCost}
                          onChange={(e) => handlePurchaseRowChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="block w-full h-10 rounded-lg border-slate-200 text-xs font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removePurchaseRow(index)}
                        disabled={purchaseData.items.length === 1}
                        className="p-2.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary banner */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between mt-4">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Estimated Expenditure</span>
                  <p className="text-xs text-slate-500 mt-0.5">Auto-registered as shop expense ledger entry</p>
                </div>
                <div className="flex items-center gap-1 font-bold text-xl text-blue-700">
                  <span className="text-xs font-bold mr-1">Rs.</span>
                  <span>{purchaseData.totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseLoading}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  {purchaseLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
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
