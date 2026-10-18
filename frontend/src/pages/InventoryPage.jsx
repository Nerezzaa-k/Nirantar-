import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, AlertTriangle, CheckCircle, RefreshCw, Plus, Building } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function InventoryPage() {
  const { showToast } = useNotifications();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock');
      if (res.data.success) {
        setStock(res.data.stock);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplenish = async (item) => {
    try {
      const res = await api.patch(`/stock/${item._id}`, {
        quantityAvailable: (item.quantityAvailable || 0) + 200
      });
      if (res.data.success) {
        showToast(`Stock replenished for ${item.medicationName} (+200 units)!`, 'success');
        fetchStock();
      }
    } catch (e) {
      showToast('Replenishment failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-600" />
            <span>Facility Medicine Inventory & Stockout Sentinel</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time pharmacy stock monitoring across Primary Health Centres to prevent non-adherence caused by supply shortages.
          </p>
        </div>
        <button onClick={fetchStock} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white">Facility Stock Levels</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-3 px-3">Medication Name</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Health Facility</th>
                <th className="py-3 px-3">Quantity Available</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {stock.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                    {item.medicationName}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-brand-700 dark:text-brand-300">
                    {item.conditionId?.name || 'General'}
                  </td>
                  <td className="py-3.5 px-3 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.facilityId?.name}</span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {item.quantityAvailable} {item.unit}
                  </td>
                  <td className="py-3.5 px-3">
                    {item.isStockout || item.quantityAvailable <= 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Stockout Alert</span>
                      </span>
                    ) : item.quantityAvailable < item.reorderThreshold ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 w-max">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 w-max">
                        Sufficient Stock
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleReplenish(item)}
                      className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-900 font-semibold hover:bg-brand-100"
                    >
                      + Replenish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
