/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZANZIBAR_LOCATIONS, SUBSTATIONS, TRANSFORMERS, FEEDERS, MOCKED_AUDIT_LOGS } from '../data';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Zap, AlertTriangle, ShieldAlert, Cpu, Activity, ArrowRight, CheckCircle, RefreshCw, Layers } from 'lucide-react';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({ onNavigateToTab }: DashboardViewProps) {
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [freq, setFreq] = useState(50.00);

  // Simulate floating grid frequency real telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setFreq(parseFloat((49.95 + Math.random() * 0.1).toFixed(2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compute stats
  const totalDemand = ZANZIBAR_LOCATIONS.reduce((acc, loc) => acc + loc.baseDemandMW, 0);
  const averageOutageProbability = Math.round(
    ZANZIBAR_LOCATIONS.reduce((acc, loc) => acc + loc.outageRiskScore, 0) / ZANZIBAR_LOCATIONS.length
  );
  const overloadedTransformersCount = TRANSFORMERS.filter(t => t.status === 'Overloaded' || t.status === 'Failed').length;
  const criticalFeedersCount = FEEDERS.filter(f => f.status === 'Tripped').length;

  // Prepare chart datasets
  const regionChartData = [
    { name: 'Unguja North', demand: 35.9, capacity: 45.0, theftAnomalies: 42 },
    { name: 'Unguja Urban West', demand: 56.7, capacity: 65.0, theftAnomalies: 65 },
    { name: 'Unguja South', demand: 46.2, capacity: 55.0, theftAnomalies: 28 },
    { name: 'Pemba North', demand: 8.5, capacity: 15.0, theftAnomalies: 15 },
    { name: 'Pemba South', demand: 18.0, capacity: 25.0, theftAnomalies: 22 },
  ];

  const handleRetrainScadaModel = () => {
    setRetraining(true);
    setRetrainSuccess(false);
    setTimeout(() => {
      setRetraining(false);
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 4000);
    }, 2000);
  };

  return (
    <div className="space-y-4" id="dashboard-view-container">
      {/* SCADA Grid Core Telemetry Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Load */}
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold">Total Zanzibar Load</p>
              <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">{totalDemand.toFixed(1)} <span className="text-xs font-light text-gray-500">MW</span></h3>
            </div>
            <div className="p-2 border border-gray-800 rounded text-[#C1121F] bg-gray-900/40">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="text-emerald-500 font-bold flex items-center gap-1">● <span className="text-[9px] font-mono">ONLINE</span></span>
            <span className="truncate">Marine Cable load matching</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C1121F]" />
        </div>

        {/* Outage Alerts Critical */}
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold">Critical Grid Alarms</p>
              <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">
                {overloadedTransformersCount + criticalFeedersCount}{' '}
                <span className="text-xs font-light text-gray-500">Alerts</span>
              </h3>
            </div>
            <div className="p-2 border border-gray-800 rounded text-amber-500 bg-gray-900/40">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="text-yellow-500 font-bold font-mono">MWERA-02 TRIP</span>
            <span className="truncate">Unresolved breaker state</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500" />
        </div>

        {/* Theft & Leakages Suspects */}
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold">Theft Anomaly Cases</p>
              <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">5 <span className="text-xs font-light text-gray-500">Hotspots</span></h3>
            </div>
            <div className="p-2 border border-gray-800 rounded text-[#C1121F] bg-gray-900/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="text-[#C1121F] font-bold font-mono">MTONI & MWERA</span>
            <span className="truncate">Non-technical metrics flag</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C1121F]" />
        </div>

        {/* Grid Stability Frequency */}
        <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 font-bold">Grid Frequency</p>
              <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">{freq.toFixed(2)} <span className="text-xs font-light text-gray-500">Hz</span></h3>
            </div>
            <div className="p-2 border border-gray-800 rounded text-emerald-400 bg-gray-900/40">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="text-emerald-500 font-bold font-mono text-[9px] uppercase">Nominal State</span>
            <span className="truncate">Load balance aligned</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />
        </div>

      </div>

      {/* Main Charts & Overview grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Load Demand Chart comparison */}
        <div className="lg:col-span-8 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] text-[#C1121F] font-bold font-mono uppercase tracking-wide">ISLAND LEVEL TELEMETRY</span>
              <h4 className="text-base font-bold text-white mt-0.5">Predicted Power Demand vs Grid Capacity</h4>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/60 text-gray-400 border border-gray-800">SCADA AGGREGATES</span>
          </div>

          <div className="h-[320px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C1121F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C1121F" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} unit="MW" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '4px' }} 
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }} />
                <Area name="Predicted Regional Demand (MW)" type="monotone" dataKey="demand" stroke="#C1121F" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDemand)" />
                <Area name="Substation Base Capacity (MW)" type="monotone" dataKey="capacity" stroke="#10B981" strokeWidth={1} fillOpacity={0.4} fill="url(#colorCapacity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loss & Theft Anomaly Indices */}
        <div className="lg:col-span-4 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-[10px] text-[#C1121F] font-bold font-mono uppercase tracking-wide">REVENUE PROTECTION</span>
                <h4 className="text-sm font-bold text-white mt-0.5">Non-Technical Loss Index (Theft Index)</h4>
              </div>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionChartData} margin={{ top: 10, right: -10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#666" fontSize={9} tickLine={false} />
                  <YAxis stroke="#666" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '4px' }}
                    itemStyle={{ fontSize: '10px' }}
                  />
                  <Bar name="Theft Suspicion Score" dataKey="theftAnomalies" fill="#C1121F" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
              *The Theft Suspicion Score represents automated anomalies flagged on tourist hotels and residential transformers by the Isolation Forest ML logic.
            </p>
          </div>

          <div className="mt-4 border-t border-gray-800 pt-3">
            <button 
              id="dash-btn-theft"
              onClick={() => onNavigateToTab('loss')}
              className="w-full py-2 bg-gradient-to-r from-[#C1121F] to-[#E63946] text-white text-xs font-semibold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span>Examine Anomaly Patterns</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Critical Grid Hardware Live list */}
        <div className="lg:col-span-7 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-[10px] text-[#C1121F] font-bold font-mono uppercase tracking-wide">SCADA HARDWARE TELEMETRY</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Transformer Diagnostic Registry</h4>
            </div>
            <span className="text-[10px] text-yellow-500 font-semibold font-mono bg-yellow-950/20 px-2 py-0.5 rounded border border-yellow-900/40">2 OVERBURDENED</span>
          </div>

          <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
            {TRANSFORMERS.map(tx => (
              <div key={tx.id} className="p-2.5 bg-[#171717] border border-gray-800 hover:border-gray-750 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === 'Healthy' ? 'bg-emerald-500' : tx.status === 'Warning' ? 'bg-yellow-500' : 'bg-[#C1121F] animate-pulse'
                  }`} />
                  <div>
                    <div className="text-xs font-bold text-white">{tx.name}</div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5">Rating: {tx.kVA} kVA • Location: {tx.locationName} Zanzibar</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end text-[11px]">
                  <div className="text-right">
                    <div className="text-[9px] text-gray-500 font-mono uppercase">Load</div>
                    <div className={`font-bold font-mono ${tx.loadPercentage > 90 ? 'text-[#C1121F]' : 'text-gray-300'}`}>{tx.loadPercentage}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-gray-500 font-mono uppercase">Oil Temp</div>
                    <div className="font-bold text-white font-mono">{tx.oilTempCelsius}°C</div>
                  </div>
                  <div className="hidden sm:block">
                    <button 
                      id={`tx-diagnose-${tx.id}`}
                      onClick={() => onNavigateToTab('outages')}
                      className="px-2.5 py-1 bg-[#252525] rounded text-[10px] font-semibold text-white border border-gray-850 hover:border-gray-700 transition-colors"
                    >
                      Diagnose
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Administration quick controls */}
        <div className="lg:col-span-5 bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="text-[#C1121F] w-4 h-4" />
              <span className="font-sans font-semibold text-white tracking-wide uppercase text-xs">AI SCADA Coprocessor</span>
            </div>

            <p className="text-[11px] text-gray-400 leading-normal mb-3">
              Our neural prediction core (LSTM + Isolation Forest models) dynamically processes SCADA logs and meter fluctuations to flag theft margins. Ensure model parameters remain fully aligned.
            </p>

            {/* Simulated Training actions */}
            <div className="p-3 bg-[#111] rounded border border-gray-850 space-y-2.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Demand Algorithm:</span>
                <span className="font-mono text-emerald-500 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/40 text-[9px]">LSTM Active</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Outage Algorithm:</span>
                <span className="font-mono text-emerald-500 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/40 text-[9px]">XGBoost Active</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400 font-medium">Model Precision:</span>
                <span className="font-mono text-white bg-gray-900 px-1.5 py-0.5 rounded text-[9px] border border-gray-800">94.8% Accuracy</span>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              id="btn-scada-train"
              onClick={handleRetrainScadaModel}
              disabled={retraining}
              className="w-full py-2 rounded border border-[#C1121F]/30 bg-[#C1121F]/10 text-[#C1121F] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C1121F]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Running training routines...' : 'Force retrain SCADA networks'}</span>
            </button>

            {retrainSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 bg-emerald-950/20 border border-emerald-900 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5 rounded"
              >
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>SCADA grid models successfully aligned. Loss index offset reset.</span>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
