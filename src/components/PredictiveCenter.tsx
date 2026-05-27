/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZANZIBAR_LOCATIONS, SUBSTATIONS, TRANSFORMERS } from '../data';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, AlertTriangle, ShieldAlert, BadgeCent, Sparkles, Plus, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';

export default function PredictiveCenter() {
  const [activeSubTab, setActiveSubTab] = useState<'demand' | 'outage' | 'theft' | 'billing'>('demand');

  // Demand parameters
  const [demandLoc, setDemandLoc] = useState(ZANZIBAR_LOCATIONS[0].id);
  const [demandData, setDemandData] = useState<any>(null);
  const [demandLoading, setDemandLoading] = useState(false);

  // Outage parameters
  const [selectedTx, setSelectedTx] = useState(TRANSFORMERS[0].id);
  const [outageResult, setOutageResult] = useState<any>(null);
  const [outageLoading, setOutageLoading] = useState(false);

  // Theft parameters
  const [theftLoc, setTheftLoc] = useState(ZANZIBAR_LOCATIONS[0].id);
  const [theftData, setTheftData] = useState<any>(null);
  const [theftLoading, setTheftLoading] = useState(false);

  // Billing parameters
  const [inputKWh, setInputKWh] = useState(480);
  const [billingResult, setBillingResult] = useState<any>(null);

  // Fetch Demand Predictions
  useEffect(() => {
    setDemandLoading(true);
    const token = localStorage.getItem('zeco_auth_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/predict/demand', {
      method: 'POST',
      headers,
      body: JSON.stringify({ locationId: demandLoc, periodDays: 3 })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access Denied: Missing permissions');
      return data;
    })
    .then(data => {
      setDemandData(data);
      setDemandLoading(false);
    })
    .catch(err => {
      console.error(err);
      const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setDemandData({ error: isFetchError ? 'Terminal connection offline. Check system link and try again.' : (err.message || 'Verification failed.') });
      setDemandLoading(false);
    });
  }, [demandLoc]);

  // Fetch Outage Predictions
  useEffect(() => {
    setOutageLoading(true);
    const token = localStorage.getItem('zeco_auth_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/predict/outage', {
      method: 'POST',
      headers,
      body: JSON.stringify({ transformerId: selectedTx })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access Denied: Missing permissions');
      return data;
    })
    .then(data => {
      setOutageResult(data);
      setOutageLoading(false);
    })
    .catch(err => {
      console.error(err);
      const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setOutageResult({ error: isFetchError ? 'Terminal connection offline. Check system link and try again.' : (err.message || 'Verification failed.') });
      setOutageLoading(false);
    });
  }, [selectedTx]);

  // Fetch Theft suspects
  useEffect(() => {
    setTheftLoading(true);
    const token = localStorage.getItem('zeco_auth_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/predict/theft', {
      method: 'POST',
      headers,
      body: JSON.stringify({ locationId: theftLoc })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access Denied: Missing permissions');
      return data;
    })
    .then(data => {
      setTheftData(data);
      setTheftLoading(false);
    })
    .catch(err => {
      console.error(err);
      const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setTheftData({ error: isFetchError ? 'Terminal connection offline. Check system link and try again.' : (err.message || 'Verification failed.') });
      setTheftLoading(false);
    });
  }, [theftLoc]);

  // Compute Billing Estimates
  useEffect(() => {
    const token = localStorage.getItem('zeco_auth_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/predict/billing', {
      method: 'POST',
      headers,
      body: JSON.stringify({ customerKWh: inputKWh })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access Denied: Missing permissions');
      return data;
    })
    .then(data => setBillingResult(data))
    .catch(err => {
      console.error(err);
      const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setBillingResult({ error: isFetchError ? 'Terminal connection offline. Check system link and try again.' : (err.message || 'Verification failed.') });
    });
  }, [inputKWh]);

  return (
    <div className="space-y-4" id="predictive-center-panel">
      
      {/* Tab controls */}
      <div className="flex bg-[#1e1e1e] border border-gray-850 p-1 rounded-lg gap-1 overflow-x-auto">
        {[
          { id: 'demand', label: '1. Demand Forecaster', icon: Zap },
          { id: 'outage', label: '2. Outage Modeler', icon: AlertTriangle },
          { id: 'theft', label: '3. Theft Detection', icon: ShieldAlert },
          { id: 'billing', label: '4. Smart Billing', icon: BadgeCent },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`pred-subtab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-[#C1121F] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-neutral-800/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB MODULES DISPLAY */}

      {/* MODULE 1: POWER DEMAND FORECASTER */}
      {activeSubTab === 'demand' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="demand-module-block">
          
          {/* Controls column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
              <span className="text-[9px] font-mono text-[#C1121F] tracking-widest uppercase font-bold">ALGORITHM: LSTM NEURAL</span>
              <h4 className="text-xs font-bold text-white mt-1">Zanzibar Regional demand configuration</h4>
              <p className="text-[11px] text-gray-400 mt-2 leading-normal font-sans">
                Tune demand modeling using seasonal coefficients. Higher summer tourist loads shift baseline requirements for luxury beach wards automatically.
              </p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-gray-400 text-[9px] font-mono uppercase">Query Specific Node</label>
                  <select
                    id="select-demand-loc"
                    value={demandLoc}
                    onChange={(e) => setDemandLoc(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-800 rounded bg-[#111] text-xs text-white focus:outline-none focus:border-[#C1121F]"
                  >
                    {ZANZIBAR_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.region})</option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-black/40 rounded border border-gray-850 flex justify-between items-center text-xs font-mono text-gray-400">
                  <span>Current peak index:</span>
                  <span className="text-white font-bold uppercase text-[9px] px-2 py-0.5 rounded bg-[#C1121F]/10 border border-[#C1121F]/20">
                    High peak model
                  </span>
                </div>
              </div>
            </div>

            {/* Capacity status details card */}
            {demandData && !demandData.error && (
              <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm space-y-3">
                <span className="text-[9px] font-mono text-gray-500 uppercase">GRID OUTCOME METRICS</span>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-[#111] rounded border border-gray-850">
                    <div className="text-gray-500 text-[9px] uppercase">Peak Forecast</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {demandData.predictions && demandData.predictions.length > 0
                        ? Math.max(...demandData.predictions.map((p: any) => p.predictedDemandMW)).toFixed(1)
                        : "0.0"} MW
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#111] rounded border border-gray-850">
                    <div className="text-gray-500 text-[9px] uppercase">Normal Baseline</div>
                    <div className="text-sm font-bold text-white mt-1">{demandData.baseMW} MW</div>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-[10px] text-gray-400 leading-normal bg-black/40 p-2.5 rounded border border-gray-850">
                  <span className="text-emerald-500 font-bold shrink-0">✔</span>
                  <span>Grid distribution registers confirm ample active capacity under continuous interconnector state. No shedding projected.</span>
                </div>
              </div>
            )}

            {demandData && demandData.error && (
              <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-[#C1121F] mx-auto animate-pulse" />
                <div className="text-xs font-bold text-white uppercase font-mono">Access Restriction</div>
                <div className="text-[10px] text-gray-400 font-sans leading-relaxed">{demandData.error}</div>
              </div>
            )}
          </div>

          {/* Forecast display Graph columns */}
          <div className="lg:col-span-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col justify-between">
            {demandLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-[#C1121F] animate-spin" />
                <span className="text-xs text-gray-500 font-mono">Querying LSTM prediction registers...</span>
              </div>
            ) : demandData && !demandData.error ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h5 className="font-sans font-bold text-white text-sm">3-Day Power Load Demand Curves</h5>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5 font-bold">Forecast alignment: {demandData.locationName} Hub</p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20 font-bold">
                    MODEL VALIDATED
                  </span>
                </div>

                <div className="h-[360px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={demandData.predictions || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#555" 
                        fontSize={9} 
                        tickLine={false} 
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return `${date.getHours()}:00 (${date.getDate()}/${date.getMonth()+1})`;
                        }}
                      />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} unit="MW" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '4px' }}
                        labelStyle={{ fontSize: '10px', color: '#888' }}
                        itemStyle={{ fontSize: '11px', color: '#fff' }}
                      />
                      <Line name="Neural Forecast Demand MW" type="monotone" dataKey="predictedDemandMW" stroke="#C1121F" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                      <Line name="Baseline Normal MW" type="monotone" dataKey="historicalDemandMW" stroke="#4B5563" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 p-3 bg-black/40 border border-gray-850 rounded text-[11px] text-gray-400 leading-normal font-sans">
                  The red line denotes automated peak-hour projections. A midday peak is simulated near 14:00 (due to cooling weights on hotels) followed by the high residential tourism surge in {demandData.locationName} between 18:00 and 21:00 UTC.
                </div>
              </>
            ) : demandData && demandData.error ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center">
                <ShieldAlert className="w-10 h-10 text-[#C1121F] animate-pulse" />
                <span className="text-sm font-bold text-white">Grid Clearance Violation</span>
                <span className="text-xs text-gray-400 max-w-sm px-4 font-mono leading-normal">{demandData.error}</span>
              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* MODULE 2: OUTAGE RISK MODELER */}
      {activeSubTab === 'outage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="outage-module-block">
          
          {/* Controls column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
              <span className="text-[9px] font-mono text-[#C1121F] tracking-widest uppercase font-bold">ALGORITHM: XGBOOST REGRESSION</span>
              <h4 className="text-xs font-bold text-white mt-1">Transformer Outage Hazard Modeling</h4>
              <p className="text-[11px] text-gray-400 mt-2 leading-normal">
                Analyze critical oil temperature thresholds and equipment thermal decay boundaries to pre-empt transformer failure indices.
              </p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-gray-400 text-[9px] font-mono uppercase">Target Substation Transformer</label>
                  <select
                    id="select-outage-tx"
                    value={selectedTx}
                    onChange={(e) => setSelectedTx(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-800 rounded bg-[#111] text-xs text-white focus:outline-none focus:border-[#C1121F]"
                  >
                    {TRANSFORMERS.map(tx => (
                      <option key={tx.id} value={tx.id}>{tx.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
              <span className="text-[9px] font-mono text-gray-500 uppercase">TELEMETRY DECAY INDICATOR</span>
              
              <div className="mt-3.5 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Aging Profile Threshold:</span>
                  <span className="text-white">SCADA aligned</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Atmosphere Weather impact:</span>
                  <span className="text-white">Dry / Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Substation Protection relay:</span>
                  <span className="text-emerald-500 font-bold">Standard</span>
                </div>
              </div>
            </div>
          </div>

          {/* ML Output display columns */}
          <div className="lg:col-span-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
            {outageLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 text-[#C1121F] animate-spin" />
                <span className="text-xs text-gray-500 font-mono">Formulating neural failure coefficients...</span>
              </div>
            ) : outageResult && !outageResult.error ? (
              <div className="space-y-4">
                
                {/* Outage status visual gauge */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-850">
                  <div>
                    <h5 className="font-sans font-bold text-white text-base">Outage Probability Assessment</h5>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">Asset Anchor: {outageResult.transformerName} ({outageResult.locationName})</p>
                  </div>

                  {/* Circular progress simulated */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="transparent" stroke="#111" strokeWidth="4" />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="26" 
                          fill="transparent" 
                          stroke={outageResult.riskLevel === 'Critical' || outageResult.riskLevel === 'High' ? '#C1121F' : '#F59E0B'} 
                          strokeWidth="5" 
                          strokeDasharray={163}
                          strokeDashoffset={163 - (163 * outageResult.probability) / 100}
                        />
                      </svg>
                      <span className="absolute text-xs font-extrabold font-mono text-white">{outageResult.probability}%</span>
                    </div>

                    <div>
                      <div className="text-[9px] text-gray-500 font-mono uppercase font-bold">Assessed Risk Status</div>
                      <div className={`text-sm font-extrabold tracking-wide uppercase mt-0.5 ${
                        outageResult.riskLevel === 'Critical' ? 'text-[#C1121F] animate-pulse' : 'text-yellow-500'
                      }`}>
                        {outageResult.riskLevel} Level Hazard
                      </div>
                    </div>
                  </div>
                </div>

                {/* Factors lists */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest font-bold">SCADA Contending Risk Factors</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    {(outageResult.factors || []).map((f: string, idx: number) => (
                      <div key={idx} className="p-2.5 bg-[#111] border border-gray-855 rounded text-xs flex items-start gap-2 text-gray-300">
                        <AlertCircle className="w-4 h-4 text-[#C1121F] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cognitive Blueprint recommendations */}
                <div className="p-3.5 bg-neutral-900/60 border border-gray-800 rounded space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C1121F]" />
                    <span className="font-sans font-semibold text-white text-xs">AI Grid Coordinator Action Blueprint</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-normal font-sans">
                    {outageResult.recommendedAction}
                  </p>
                </div>

              </div>
            ) : outageResult && outageResult.error ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <ShieldAlert className="w-10 h-10 text-[#C1121F] animate-pulse" />
                <span className="text-sm font-bold text-white">Grid Clearance Violation</span>
                <span className="text-xs text-gray-400 max-w-sm px-4 font-mono leading-normal">{outageResult.error}</span>
              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* MODULE 3: ELECTRICITY THEFT DETECTION */}
      {activeSubTab === 'theft' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="theft-module-block">
          
          {/* Controls column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
              <span className="text-[9px] font-mono text-[#C1121F] tracking-widest uppercase font-bold">ALGORITHM: ISOLATION FOREST ANOMALY</span>
              <h4 className="text-xs font-bold text-white mt-1">Non-Technical loss inspection desk</h4>
              <p className="text-[11px] text-gray-400 mt-2 leading-normal">
                Inspect sudden shifts in meter records, night bypass trends on heavy chilling components, or neutral phase disconnect actions.
              </p>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-gray-400 text-[9px] font-mono uppercase">Filter by Regional GIS Coordinates</label>
                  <select
                    id="select-theft-loc"
                    value={theftLoc}
                    onChange={(e) => setTheftLoc(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 border border-gray-800 rounded bg-[#111] text-xs text-white focus:outline-none focus:border-[#C1121F]"
                  >
                    {ZANZIBAR_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name} (Theft score: {loc.theftIndex}%)</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
              <span className="text-[9px] font-mono text-gray-500 uppercase font-bold">REVENUE AUDITING PARAMETERS</span>
              <p className="text-[10px] text-gray-500 leading-normal mt-1 font-mono">
                System compares historical 90-day baseline shapes of similar profiles against active weekly smart meters and flagged anomalies immediately.
              </p>
            </div>
          </div>

          {/* Anomaly list output */}
          <div className="lg:col-span-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col justify-between">
            {theftLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-[#C1121F] animate-spin" />
                <span className="text-xs text-gray-500 font-mono">Running isolation anomaly logic checks...</span>
              </div>
            ) : theftData && !theftData.error ? (
              <>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-850">
                  <div>
                    <h5 className="font-sans font-bold text-white text-sm">Suspicious Consumer Profiles</h5>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Scanned Hotspot Threshold Rank: {theftData.theftHotspotRank}</p>
                  </div>
                  <span className="text-xs font-mono text-white bg-black/60 px-2 py-0.5 rounded border border-gray-800">
                    {theftData.activeCasesModelCount} cases found
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {(theftData.cases || []).map((c: any) => (
                    <div key={c.id} className="p-3 bg-[#111] border border-gray-850 hover:border-gray-750 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${
                            c.status === 'Confirmed' ? 'bg-[#C1121F]' : 'bg-yellow-600'
                          }`}>
                            {c.status}
                          </span>
                          <span className="text-xs font-bold text-white">{c.customerName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">Meter Model ID: {c.meterId} • Ward: {c.locationName}</div>
                        <p className="text-[11px] text-gray-300 mt-1.5 font-mono italic bg-black/40 p-2 rounded border border-gray-850">{c.anomalyPattern}</p>
                      </div>

                      <div className="text-right flex md:flex-col justify-between items-center md:items-end shrink-0 gap-1 border-t md:border-t-0 border-gray-850 pt-2 md:pt-0">
                        <div>
                          <span className="text-[9px] text-gray-500 font-mono uppercase">Theft index</span>
                          <div className="text-sm font-extrabold text-[#C1121F] font-mono mt-0.5">{c.theftScore}% Score</div>
                        </div>
                        <div className="mt-1">
                          <span className="text-[9px] text-gray-500 font-mono uppercase block">Estimated loss</span>
                          <span className="text-xs font-bold text-white font-mono mt-0.5">{c.reportedLossKWh} KWh</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : theftData && theftData.error ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center">
                <ShieldAlert className="w-10 h-10 text-[#C1121F] animate-pulse" />
                <span className="text-sm font-bold text-white">Grid Clearance Violation</span>
                <span className="text-xs text-gray-400 max-w-sm px-4 font-mono leading-normal">{theftData.error}</span>
              </div>
            ) : null}
          </div>

        </div>
      )}

      {/* MODULE 4: SMART BILLING & TARIFF MODELER */}
      {activeSubTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="billing-module-block">
          
          {/* Controls column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
              <span className="text-[9px] font-mono text-[#C1121F] tracking-widest uppercase font-bold">ZECO TARIFF CALCULATOR</span>
              <h4 className="text-xs font-bold text-white mt-1">Customer consumption profiling desk</h4>
              <p className="text-[11px] text-gray-400 mt-2 leading-normal">
                Project billing weights and unit exhausted timelines using active monthly load histories. Useful for prepayment models and revenue protection forecasting.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-gray-400 text-[9px] font-mono uppercase">Consumptive usage (Monthly KWh)</label>
                  <div className="flex items-center gap-2.5 mt-1">
                    <input
                      type="range"
                      min="50"
                      max="1500"
                      step="20"
                      value={inputKWh}
                      onChange={(e) => setInputKWh(parseInt(e.target.value))}
                      className="flex-1 accent-[#C1121F] cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-white bg-[#111] border border-gray-850 px-2.5 py-1 rounded w-16 text-center select-none">
                      {inputKWh}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded border border-gray-850 text-[11px] flex flex-col gap-1.5">
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500 font-bold">Flat prepayment tariff:</span>
                    <span className="text-white font-bold">$0.18 / KWh</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-500 font-bold">Infrastructure Tax:</span>
                    <span className="text-white font-semibold">Included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forecasting output column */}
          <div className="lg:col-span-7 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
            {billingResult && !billingResult.error && (
              <div className="space-y-4">
                <div>
                  <h5 className="font-sans font-bold text-white text-base">PREDICTIVE CUSTOMER BILL SHEET</h5>
                  <p className="text-[9px] text-gray-400 font-mono mt-0.5 font-bold uppercase">Calibrated for typical Unguja properties</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#111] border border-gray-850 rounded-md">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">Monthly Bill USD</span>
                    <div className="text-xl font-extrabold text-white font-mono mt-1">${billingResult.currentBillUSD}</div>
                    <span className="text-[9px] text-gray-400 mt-1.5 block font-mono">KWh: {billingResult.currentMonthlyKWh}</span>
                  </div>

                  <div className="p-3 bg-[#111] border border-gray-850 rounded-md">
                    <span className="text-[9px] text-gray-500 font-mono uppercase">Forecasting 30-Day Surge</span>
                    <div className="text-xl font-extrabold text-[#C1121F] font-mono mt-1">${billingResult.predictedBillUSD}</div>
                    <span className="text-[9px] text-gray-400 mt-1.5 block font-mono">KWh: {billingResult.predictedKWh}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#111] border border-gray-855 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] text-gray-500 font-mono uppercase font-bold">Token Depletion Period</span>
                    <div className="text-xs font-extrabold text-white mt-1">Prepayment exhaustion in <span className="text-[#C1121F] font-mono">{billingResult.unitExhaustionDays} Days</span></div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold leading-none shrink-0 ${
                    billingResult.spikeRisk === 'High' ? 'bg-[#C1121F] text-white' : billingResult.spikeRisk === 'Medium' ? 'bg-yellow-600 text-white' : 'bg-[#10B981] text-black'
                  }`}>
                    {billingResult.spikeRisk} Spike Risk
                  </span>
                </div>

                <div className="p-3 bg-black/40 border border-gray-855 rounded text-[11px] text-gray-500 leading-normal font-sans">
                  The forecasted 30-day bill utilizes dynamic seasonal profiles which typically project spikes due to tourist cooling requirements or regional wet/dry weather patterns.
                </div>
              </div>
            )}

            {billingResult && billingResult.error && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <ShieldAlert className="w-10 h-10 text-[#C1121F] animate-pulse" />
                <span className="text-sm font-bold text-white">Grid Clearance Violation</span>
                <span className="text-xs text-gray-400 max-w-sm px-4 font-mono leading-normal">{billingResult.error}</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
