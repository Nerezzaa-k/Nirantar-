import React, { useState, useEffect } from 'react';
import api from '../services/api';
import HotspotMap from '../components/maps/HotspotMap';
import { MapPin, AlertTriangle, ShieldCheck, RefreshCw, Filter } from 'lucide-react';

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState(null);

  useEffect(() => {
    fetchHotspots();
  }, []);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/hotspots');
      if (res.data.success) {
        setHotspots(res.data.hotspots);
        if (res.data.hotspots.length > 0) {
          setSelectedVillage(res.data.hotspots[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-500" />
            <span>Geographic Village Risk Hotspots</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            District population surveillance: Pinpointing village clusters with elevated treatment dropout risk.
          </p>
        </div>
        <button
          onClick={fetchHotspots}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          title="Refresh map"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-8 p-4 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm">
          <HotspotMap
            hotspots={hotspots}
            onSelectVillage={(v) => setSelectedVillage(v)}
          />
        </div>

        {/* Village Details Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Selected Village Surveillance
            </h2>

            {selectedVillage ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Village Name</span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {selectedVillage.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{selectedVillage.district} • Facility: {selectedVillage.facilityName}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[10px]">Total Patients</span>
                    <div className="text-xl font-black font-mono text-slate-900 dark:text-white">{selectedVillage.patientCount}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                    <span className="text-[10px]">High Risk</span>
                    <div className="text-xl font-black font-mono">{selectedVillage.highRiskCount}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Dominant Reported Barrier</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1">
                    "{selectedVillage.dominantReason}"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-teal-50 dark:bg-brand-950/40 border border-teal-200 dark:border-brand-900 text-[11px] text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-brand-800 dark:text-brand-300">Recommended Action: </span>
                  {selectedVillage.highRiskCount > 2
                    ? 'Deploy monthly outreach vehicle and village doorstep refill batch immediately.'
                    : 'Maintain weekly ASHA routine home visits.'}
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Click any village marker on the map to inspect surveillance metrics.</p>
            )}
          </div>

          {/* Villages Summary List */}
          <div className="p-4 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white">All Catchment Villages</h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {hotspots.map(v => (
                <button
                  key={v.villageId}
                  onClick={() => setSelectedVillage(v)}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                    selectedVillage?.villageId === v.villageId
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{v.name}</span>
                  <span className="font-mono text-[11px]">
                    {v.highRiskCount > 0 ? (
                      <span className="text-rose-600 font-bold">{v.highRiskCount} high risk</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Controlled</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
