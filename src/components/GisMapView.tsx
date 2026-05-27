/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZANZIBAR_LOCATIONS, SUBSTATIONS, TRANSFORMERS } from '../data';
import { ZanzibarLocation } from '../types';
import { Map, Layers, ShieldAlert, Zap, AlertTriangle, HelpCircle, Activity, TrendingUp } from 'lucide-react';

interface GisMapViewProps {
  onSelectLocation?: (loc: ZanzibarLocation) => void;
}

export default function GisMapView({ onSelectLocation }: GisMapViewProps) {
  const [activeLayer, setActiveLayer] = useState<'demand' | 'outage' | 'theft' | 'health'>('demand');
  const [selectedLoc, setSelectedLoc] = useState<ZanzibarLocation>(ZANZIBAR_LOCATIONS[0]);
  const [hoveredLoc, setHoveredLoc] = useState<ZanzibarLocation | null>(null);

  // Map limits: Zanzibar lies within:
  // Lat: -6.50 to -4.90 (approx 180km tall)
  // Lng: 39.10 to 39.90
  // Scaling mathematics for nice SVG fitting
  const scaleX = (longitude: number) => {
    // scale from lng [39.1, 39.9] to a [50, 450] SVG width
    return 50 + ((longitude - 39.1) / (39.9 - 39.1)) * 400;
  };

  const scaleY = (latitude: number) => {
    // scale from lat [-4.9, -6.5] to a [50, 750] SVG height
    // -4.9 is top (North Pemba), -6.5 is bottom (South Unguja)
    return 50 + ((latitude - (-4.9)) / ((-6.5) - (-4.9))) * 700;
  };

  const getHeatColor = (loc: ZanzibarLocation, layer: string) => {
    if (layer === 'demand') {
      const value = loc.baseDemandMW; // 4 to 25 MW
      if (value > 18) return '#C1121F'; // Red
      if (value > 10) return '#F59E0B'; // Orange
      return '#10B981'; // Green
    } else if (layer === 'outage') {
      const value = loc.outageRiskScore; // 0-100
      if (value > 75) return '#C1121F';
      if (value > 50) return '#F59E0B';
      return '#10B981';
    } else if (layer === 'theft') {
      const value = loc.theftIndex; // 0-100
      if (value > 60) return '#C1121F';
      if (value > 35) return '#F59E0B';
      return '#10B981';
    } else {
      // health (inverse of outage score)
      const value = 100 - loc.outageRiskScore;
      if (value < 40) return '#C1121F';
      if (value < 60) return '#F59E0B';
      return '#10B981';
    }
  };

  const getIntensityText = (loc: ZanzibarLocation, layer: string) => {
    if (layer === 'demand') return `${loc.baseDemandMW} MW Peak`;
    if (layer === 'outage') return `Outage Prob: ${loc.outageRiskScore}%`;
    if (layer === 'theft') return `Theft Risk: ${loc.theftIndex}%`;
    return `Health: ${100 - loc.outageRiskScore}%`;
  };

  const handleLocationClick = (loc: ZanzibarLocation) => {
    setSelectedLoc(loc);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  // Build grid lines representing high-voltage submarine lines from Zanzibar mainland and inter-island interconnectors
  // Mtoni (sub-mtoni) coordinates: lat -6.13, lng 39.21
  // Connect Mtoni to Stone Town, Nungwi, Fumba, Paje, and also North Pemba (Chake Chake)
  const gridInterconnectors = [
    { from: 'loc-mtoni', to: 'loc-stonetown', capacity: '132KV Transmission' },
    { from: 'loc-mtoni', to: 'loc-mwera', capacity: '33KV Distribution' },
    { from: 'loc-mwera', to: 'loc-nungwi', capacity: '33KV Distribution Ring-North' },
    { from: 'loc-nungwi', to: 'loc-kendwa', capacity: '11KV Feeder Loop' },
    { from: 'loc-nungwi', to: 'loc-matemwe', capacity: '11KV Link' },
    { from: 'loc-mwera', to: 'loc-kiwengwa', capacity: '33KV Link' },
    { from: 'loc-stonetown', to: 'loc-fumba', capacity: '33KV Smart Trunk' },
    { from: 'loc-mwera', to: 'loc-paje', capacity: '33KV East Ring' },
    { from: 'loc-paje', to: 'loc-jambiani', capacity: '11KV Local Feeder' },
    { from: 'loc-jambiani', to: 'loc-makunduchi', capacity: '11KV Local Link' },
    { from: 'loc-jambiani', to: 'loc-kizimkazi', capacity: '11KV Link' },
    // Inter-island Pemba cable from Mainland Tanga to Ras Kiuyu (Pemba) simulated
    { from: 'loc-wete', to: 'loc-chakechake', capacity: '33KV Pemba Central Link' },
    { from: 'loc-chakechake', to: 'loc-mkoani', capacity: '33KV Pemba South Link' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="gis-map-view-container">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="text-[#C1121F] w-4 h-4" />
            <span className="font-sans font-semibold text-white tracking-wide uppercase text-xs">GIS Intelligence Overlays</span>
          </div>
          
          <p className="text-[11px] text-gray-400 mb-4 leading-normal">
            Toggle high-fidelity layers synchronized with Zanzibar SCADA registers to view predictive grids, anomalies, and active bottlenecks.
          </p>

          <div className="flex flex-col gap-1.55">
            {[
              { id: 'demand', label: '1. Demand Heatmap', desc: 'Predictive seasonal MW distribution', icon: TrendingUp },
              { id: 'outage', label: '2. Outage Risk Layer', desc: 'SCADA transformer alert warnings', icon: AlertTriangle },
              { id: 'theft', label: '3. Theft Hotspot Analysis', desc: 'Non-technical loss anomalies', icon: ShieldAlert },
              { id: 'health', label: '4. Asset Health Index', desc: 'Critical equipment aging bounds', icon: Activity },
            ].map(layer => {
              const Icon = layer.icon;
              return (
                <button
                  key={layer.id}
                  id={`gis-btn-${layer.id}`}
                  onClick={() => setActiveLayer(layer.id as any)}
                  className={`w-full text-left p-3 rounded-md border transition-all duration-200 relative overflow-hidden cursor-pointer ${
                    activeLayer === layer.id
                      ? 'bg-[#C1121F]/10 border-[#C1121F]/30 text-white shadow-sm'
                      : 'bg-transparent border-gray-850 text-gray-400 hover:border-gray-750 hover:text-white hover:bg-neutral-800/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded ${activeLayer === layer.id ? 'bg-[#C1121F] text-white' : 'bg-black text-gray-500'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{layer.label}</div>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5">{layer.desc}</div>
                    </div>
                  </div>
                  {activeLayer === layer.id && (
                    <motion.div
                      layoutId="activeOverlayIndicator"
                      className="absolute right-0 top-0 bottom-0 w-1 bg-[#C1121F]"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Hub Telemetry */}
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-sans font-semibold text-white tracking-wide uppercase text-xs">Region Telemetry Desk</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-gray-800 text-[#C1121F] font-bold">
              LIVE SCADA FEED
            </span>
          </div>

          <div className="p-2.5 bg-black/40 rounded border border-gray-850 mb-3">
            <div className="text-gray-500 text-[9px] uppercase font-mono tracking-wider">Active Region Anchor</div>
            <div className="text-base font-bold text-white mt-1">{selectedLoc.name}</div>
            <div className="text-[10px] text-[#C1121F] font-mono mt-0.5 capitalize">{selectedLoc.region} Zanzibar</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-neutral-900/60 rounded border border-gray-850">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Load Baseline</span>
              <div className="text-xs font-bold text-white mt-0.5 font-mono">{selectedLoc.baseDemandMW} MW</div>
            </div>
            <div className="p-2 bg-neutral-900/60 rounded border border-gray-850">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Active Meters</span>
              <div className="text-xs font-bold text-white mt-0.5 font-mono">{selectedLoc.activeCustomers.toLocaleString()}</div>
            </div>
            <div className="p-2 bg-neutral-900/60 rounded border border-gray-850">
              <span className="text-gray-500 text-[9px] font-mono uppercase">SCADA Outage</span>
              <div className={`text-xs font-bold mt-0.5 font-mono ${selectedLoc.outageRiskScore > 70 ? 'text-[#C1121F]' : 'text-yellow-500'}`}>
                {selectedLoc.outageRiskScore}%
              </div>
            </div>
            <div className="p-2 bg-neutral-900/60 rounded border border-gray-850">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Anomaly Index</span>
              <div className="text-xs font-bold text-white mt-0.5 font-mono text-[#C1121F]">{selectedLoc.theftIndex}%</div>
            </div>
          </div>

          {/* Connected SCADA Aggregates under the selected point */}
          <div className="border-t border-gray-850 pt-2.5 flex flex-col gap-1.5">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">SCADA Hardware Nodes for {selectedLoc.name}</div>
            {TRANSFORMERS.filter(t => t.locationName.toLowerCase() === selectedLoc.name.toLowerCase()).length === 0 ? (
              <div className="text-[10px] text-gray-500 italic font-mono">No direct heavy SCADA assets configured to this node. Using regional cluster feeds.</div>
            ) : (
              TRANSFORMERS.filter(t => t.locationName === selectedLoc.name).map(t => (
                <div key={t.id} className="p-1.5 bg-black/30 rounded border border-gray-850 flex justify-between items-center text-[11px]">
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-[8px] font-mono text-gray-500 mt-0.5">{t.kVA} kVA • {t.ageYears} years old</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-semibold text-black ${
                    t.status === 'Healthy' ? 'bg-emerald-500' : t.status === 'Overloaded' ? 'bg-amber-500 animate-pulse' : 'bg-[#C1121F] text-white animate-pulse'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vector GIS Map Sandbox */}
      <div className="lg:col-span-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-3 flex flex-col min-h-[500px] lg:min-h-[720px] shadow-sm relative overflow-hidden">
        {/* Map Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="p-3 rounded-lg bg-[#111111]/95 border border-gray-800 shadow-lg pointer-events-auto">
            <div className="text-xs text-[#C1121F] uppercase font-bold tracking-widest font-mono">Zanzibar Grid Terminal</div>
            <div className="text-sm font-bold text-white mt-1">Unguja & Pemba Islands Digital Twin</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-gray-400 font-mono">Vector GIS overlay rendering: active</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#111111]/95 border border-gray-800 text-xs text-gray-400 flex flex-col gap-1 pointer-events-auto">
            <span className="font-bold text-white mb-1">Scale Index Legend</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C1121F]" />
              <span>Critical Overload / Risk (&gt;75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Medium Threshold Risk (40%-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Normal Standard Level (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* SVG Drawing Area */}
        <div className="flex-1 flex items-center justify-center p-2 mt-12 select-none relative">
          <svg className="w-full h-full max-h-[680px]" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1E1E1E" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0B0B0B" stopOpacity="0.8" />
              </radialGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#C1121F" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* Ocean Ambient Background */}
            <rect width="500" height="800" fill="url(#oceanGlow)" className="rounded-lg" />

            {/* Decorative Grid Lat/Lng lines */}
            <line x1="50" y1="50" x2="50" y2="750" stroke="#1E1E1E" strokeDasharray="3,3" />
            <line x1="250" y1="50" x2="250" y2="750" stroke="#1E1E1E" strokeDasharray="3,3" />
            <line x1="450" y1="50" x2="450" y2="750" stroke="#1E1E1E" strokeDasharray="3,3" />
            
            <line x1="50" y1="150" x2="450" y2="150" stroke="#1E1E1E" strokeDasharray="3,3" />
            <line x1="50" y1="450" x2="450" y2="450" stroke="#1E1E1E" strokeDasharray="3,3" />
            <line x1="50" y1="650" x2="450" y2="650" stroke="#1E1E1E" strokeDasharray="3,3" />

            <text x="20" y="145" fill="#444" className="font-mono text-[9px]">LAT -5.10° S</text>
            <text x="20" y="445" fill="#444" className="font-mono text-[9px]">LAT -6.00° S</text>
            <text x="20" y="645" fill="#444" className="font-mono text-[9px]">LAT -6.35° S</text>

            {/* PEMBA ISLANDS (North Grid Group) - stylized land masses */}
            <g id="pemba-vector-mass" filter="url(#shadow)">
              {/* Path matching Pemba North configuration */}
              <path
                d="M 350,60 C 375,65 390,90 392,110 C 395,135 385,150 380,175 C 375,195 365,210 355,220 C 342,215 338,195 335,180 C 330,150 340,120 342,90 Z"
                fill="#161616"
                stroke="#1E1E1E"
                strokeWidth="2"
                className="transition-colors duration-300 hover:fill-[#222222]"
              />
              <text x="365" y="140" fill="#444" className="font-sans font-bold tracking-widest text-[11px] select-none">PEMBA</text>
            </g>

            {/* UNGUJA MAINLAND (South Grid Group) - stylized land masses */}
            <g id="unguja-vector-mass" filter="url(#shadow)">
              {/* Path stretching North Nungwi down to South Makunduchi */}
              <path
                d="M 125,230 C 130,220 145,210 155,225 C 160,240 162,260 168,280 C 172,300 185,320 190,340 C 196,370 198,400 197,425 C 195,465 180,490 170,515 C 160,535 152,555 158,580 C 162,600 170,625 185,645 C 198,660 205,680 198,695 C 190,705 175,700 160,680 C 145,660 135,630 131,600 C 124,565 118,525 115,485 C 110,440 106,390 108,350 C 110,310 115,270 120,245 Z"
                fill="#161616"
                stroke="#1E1E1E"
                strokeWidth="2.5"
                className="transition-colors duration-300 hover:fill-[#222222]"
              />
              <text x="135" y="470" fill="#444" className="font-sans font-bold tracking-widest text-[13px] select-none">UNGUJA</text>
            </g>

            {/* Grid distribution lines feeders mapping */}
            <g id="grid-routing-lines">
              {gridInterconnectors.map((line, idx) => {
                const locFrom = ZANZIBAR_LOCATIONS.find(l => l.id === line.from);
                const locTo = ZANZIBAR_LOCATIONS.find(l => l.id === line.to);

                if (!locFrom || !locTo) return null;

                const x1 = scaleX(locFrom.lng);
                const y1 = scaleY(locFrom.lat);
                const x2 = scaleX(locTo.lng);
                const y2 = scaleY(locTo.lat);

                // Risk analysis modifier: highlight line red if either end is critical
                const isCritical = locFrom.outageRiskScore > 75 || locTo.outageRiskScore > 75;
                const isMedium = locFrom.outageRiskScore > 50 || locTo.outageRiskScore > 50;

                return (
                  <g key={`${line.from}-${line.to}-${idx}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isCritical ? '#C1121F' : isMedium ? '#F59E0B' : '#047857'}
                      strokeWidth={isCritical ? '2.5' : '1.5'}
                      strokeDasharray={isCritical ? 'none' : '4,4'}
                      opacity="0.65"
                      className="cursor-help"
                    />
                    {/* Pulsing telemetry particles passing through transmission lines */}
                    <circle r="2.5" fill="#ffffff" opacity="0.8">
                      <animateMotion
                        dur={isCritical ? '1.5s' : '3.5s'}
                        repeatCount="indefinite"
                        path={`M ${x1} ${y1} L ${x2} ${y2}`}
                      />
                    </circle>
                  </g>
                );
              })}
            </g>

            {/* Clickable Island location nodes */}
            <g id="grid-anchor-nodes">
              {ZANZIBAR_LOCATIONS.map(loc => {
                const cx = scaleX(loc.lng);
                const cy = scaleY(loc.lat);
                const color = getHeatColor(loc, activeLayer);
                const isSelected = selectedLoc.id === loc.id;
                const isHovered = hoveredLoc?.id === loc.id;

                return (
                  <g
                    key={loc.id}
                    className="cursor-pointer"
                    onClick={() => handleLocationClick(loc)}
                    onMouseEnter={() => setHoveredLoc(loc)}
                    onMouseLeave={() => setHoveredLoc(null)}
                  >
                    {/* Ring glowing overlay for selected or hovered coordinates */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? '14' : '10'}
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="r"
                          values={`${isSelected ? '8' : '6'};${isSelected ? '22' : '15'}`}
                          dur="2.5s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="1;0"
                          dur="2.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Central Data node point */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? '6' : '4.5'}
                      fill={color}
                      className="transition-all duration-300"
                      stroke="#fff"
                      strokeWidth="1"
                    />

                    {/* Anchor text labels labels */}
                    <text
                      x={cx + 10}
                      y={cy + 4}
                      fill={isSelected ? '#fff' : '#aaa'}
                      className="text-[9px] font-sans font-bold select-none drop-shadow-md pointer-events-none"
                    >
                      {loc.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Map Hover Tooltip overlay */}
          {hoveredLoc && (
            <div
              className="absolute p-3 rounded bg-[#111111] border border-gray-800 shadow-xl pointer-events-none z-20 text-xs text-white"
              style={{
                left: `${Math.min(320, Math.max(10, scaleX(hoveredLoc.lng) - 80))}px`,
                top: `${Math.min(650, Math.max(10, scaleY(hoveredLoc.lat) - 100))}px`,
              }}
            >
              <div className="font-bold text-white border-b border-gray-850 pb-1 mb-1.5 flex justify-between items-center gap-2">
                <span>{hoveredLoc.name}</span>
                <span className="text-[8px] px-1 rounded bg-red-950 text-red-400 font-mono tracking-wider">{hoveredLoc.region[0]}Z</span>
              </div>
              <div className="flex flex-col gap-1 font-mono text-[10px]">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Baseline Demand:</span>
                  <span className="text-white font-bold">{hoveredLoc.baseDemandMW} MW</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Layer Metric:</span>
                  <span className="text-[#C1121F] font-bold">{getIntensityText(hoveredLoc, activeLayer)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Drawer Info Panel */}
        <div className="p-3 bg-[#111111]/90 border border-gray-800 rounded-lg mt-auto text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-950 text-amber-500">
              <Zap className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase">Unguja Core Link</div>
              <div className="font-bold text-white">Mtoni 132KV ring: Nominal</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-red-950 text-[#C1121F]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase">Pemba submarine link</div>
              <div className="font-bold text-white">Chake Chake Interconnector: Active</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-950 text-emerald-500">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-mono uppercase">Active Grid Controls</div>
              <div className="text-[10px] text-white leading-tight">Click on any location node on the map to query grid telemetry.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
