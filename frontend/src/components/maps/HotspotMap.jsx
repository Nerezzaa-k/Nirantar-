import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function HotspotMap({ hotspots = [], onSelectVillage }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center on Sitapur district demonstration coordinates
    const defaultCenter = [27.5680, 80.6780];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    if (hotspots.length > 0) {
      const bounds = [];

      hotspots.forEach((h) => {
        if (!h.latitude || !h.longitude) return;
        const latLng = [h.latitude, h.longitude];
        bounds.push(latLng);

        // Marker color mapping
        const color = h.riskColor === 'red' ? '#e11d48' : h.riskColor === 'amber' ? '#f59e0b' : '#10b981';
        const pulseClass = h.riskColor === 'red' ? 'animate-pulse' : '';

        const marker = L.circleMarker(latLng, {
          radius: 12 + Math.min(h.highRiskCount * 2, 10),
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; min-width: 180px; padding: 4px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: ${color};">
              📍 ${h.name}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
              ${h.district} • Facility: ${h.facilityName}
            </div>
            <div style="margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>Total Patients:</span> <strong>${h.patientCount}</strong>
            </div>
            <div style="margin-bottom: 4px; display: flex; justify-content: space-between; color: #e11d48;">
              <span>High Risk:</span> <strong>${h.highRiskCount}</strong>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px;">
              <strong>Top Barrier:</strong><br/>
              <span style="color: #475569;">"${h.dominantReason || 'Travel & Distance'}"</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (onSelectVillage) {
          marker.on('click', () => onSelectVillage(h));
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

    return () => {
      // Keep map instance cached
    };
  }, [hotspots, onSelectVillage]);

  return (
    <div className="relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm z-10">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map legend overlay */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-[11px] space-y-1.5">
        <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Catchment Risk Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm" />
          <span className="text-slate-600 dark:text-slate-300">High Risk Hotspot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm" />
          <span className="text-slate-600 dark:text-slate-300">Moderate Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
          <span className="text-slate-600 dark:text-slate-300">Adherence Controlled</span>
        </div>
      </div>
    </div>
  );
}
