/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle2, ShieldAlert, Cpu, Layers, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function UploadView() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'validating' | 'scanning' | 'analyzing' | 'ready' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  
  // Simulated dataset templates to make it very convenient for testing!
  const templates = [
    {
      name: 'Nungwi-Tourism-Load-May2026.xlsx',
      size: '2.4 MB',
      rows: [
        { Area: 'Nungwi', DemandMW: 14.5, AirconOverload: 'Yes', Date: '2026-05-20' },
        { Area: 'Kendwa', DemandMW: 9.1, AirconOverload: 'No', Date: '2026-05-20' },
        { Area: 'Matemwe', DemandMW: 6.8, AirconOverload: 'Yes', Date: '2026-05-20' },
        { Area: 'Stone Town', DemandMW: 26.2, AirconOverload: 'No', Date: '2026-05-20' }
      ]
    },
    {
      name: 'Mtoni-Transformer-Thermal-Diagnostics.csv',
      size: '850 KB',
      rows: [
        { Transformer: 'Mwera Crossing TX-01', OilTempCelsius: 82, LoadPerc: 94, OilOk: 'Adequate' },
        { Transformer: 'Mwera School TX-02', OilTempCelsius: 98, LoadPerc: 112, OilOk: 'CRITICAL LOW' },
        { Transformer: 'Maruhubi Seaforth TX-01', OilTempCelsius: 75, LoadPerc: 88, OilOk: 'Adequate' }
      ]
    },
    {
      name: 'Unguja-East-Non-Technical-Losses.json',
      size: '1.2 MB',
      rows: [
        { customerId: 'CUST-0941', meterId: 'M-ST-9942', rawUsage: [450, 20], status: 'Suspected' },
        { customerId: 'CUST-2022', meterId: 'M-NW-2022', rawUsage: [310, 80], status: 'Suspected' }
      ]
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      triggerSpreadsheetProcess(file.name, `${(file.size / 1024).toFixed(1)} KB`, templates[0].rows);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      triggerSpreadsheetProcess(file.name, `${(file.size / 1024).toFixed(1)} KB`, templates[0].rows);
    }
  };

  const handleTemplateSelect = (tmpl: typeof templates[0]) => {
    triggerSpreadsheetProcess(tmpl.name, tmpl.size, tmpl.rows);
  };

  const triggerSpreadsheetProcess = (name: string, size: string, rows: any[]) => {
    setFileName(name);
    setFileSize(size);
    setUploadState('validating');

    // Simulated multi-stage industrial validation pipeline as requested
    setTimeout(() => {
      setUploadState('scanning');
      setTimeout(() => {
        setUploadState('analyzing');
        
        const token = localStorage.getItem('zeco_auth_token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Execute real backend API call which integrates with Gemini to run AI scanning!
        fetch('/api/upload-dataset', {
          method: 'POST',
          headers,
          body: JSON.stringify({ fileName: name, fileContentJson: rows })
        })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload and processing failed.');
          return data;
        })
        .then(data => {
          setParsedData(data);
          setUploadState('ready');
        })
        .catch(err => {
          console.error(err);
          const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
          setParsedData({ error: isFetchError ? 'Grid terminal upload offline. Ensure connection link is fully initialized and try again.' : (err.message || 'Verification failed.') });
          setUploadState('error');
        });

      }, 1500);
    }, 1200);
  };

  const handleReset = () => {
    setUploadState('idle');
    setFileName('');
    setFileSize('');
    setParsedData(null);
  };

  return (
    <div className="space-y-6" id="upload-center-container">
      
      {/* Top Description bar */}
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-base">Intelligent Data Ingestion Desk</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Feed Excel telemetry, SCADA logger voltages, or customer load histories to analyze anomalies and train ZECO predictive networks.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#C1121F]/10 text-[#C1121F] border border-[#C1121F]/20 uppercase font-bold">
            Normalizers: Online
          </span>
        </div>
      </div>

      {/* Upload Sandbox and Drag layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Upload Terminal */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {uploadState === 'idle' ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[340px] transition-all duration-200 relative ${
                dragActive 
                  ? 'border-[#C1121F] bg-[#C1121F]/5 shadow-inner' 
                  : 'border-gray-800 bg-[#1e1e1e] hover:border-gray-700'
              }`}
            >
              <input
                type="file"
                id="file-input-selector"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".xlsx,.xls,.csv,.json"
              />
              
              <div className="p-3.5 rounded-full bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#C1121F] mb-3">
                <Upload className="w-6 h-6 animate-bounce" />
              </div>

              <h5 className="font-bold text-white text-sm">Drag & drop spreadsheet telemetry</h5>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm leading-normal">
                Supports SCADA Excel logs (.xlsx), CSV boundary formats, and consumer smart meter profiles.
              </p>

              <div className="mt-5 flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase font-bold">
                <span>Maximum size: 50MB</span>
                <span>•</span>
                <span>Spatial alignment: Zanzibar Gids</span>
              </div>
            </div>
          ) : (
            /* Multi-Stage processing visual terminal */
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 min-h-[340px] flex flex-col justify-between shadow-sm">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-850 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#C1121F] w-3.5 h-3.5" />
                  <span className="font-mono text-xs text-white uppercase font-bold">{fileName}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">{fileSize}</span>
              </div>

              {/* Status Visual Animation */}
              <div className="my-auto py-4 flex flex-col items-center text-center">
                
                {uploadState === 'validating' && (
                  <div className="space-y-3">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="absolute inset-0 rounded-full border border-gray-800" />
                      <div className="absolute inset-0 rounded-full border-t border-[#C1121F] animate-spin" />
                    </div>
                    <div>
                      <h6 className="font-mono text-xs text-white uppercase font-bold">STAGE 1: Scanning Spreadsheet Signatures</h6>
                      <p className="text-[10px] text-gray-500 mt-0.5">Verifying mime partitions and data boundaries</p>
                    </div>
                  </div>
                )}

                {uploadState === 'scanning' && (
                  <div className="space-y-3">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="absolute inset-0 rounded-full border border-gray-800" />
                      <div className="absolute inset-1.5 rounded-full border-b border-amber-500 animate-spin" />
                    </div>
                    <div>
                      <h6 className="font-mono text-xs text-amber-500 uppercase font-bold">STAGE 2: Geographic Metric Mapping</h6>
                      <p className="text-[10px] text-gray-500 mt-0.5">Matching stations to Unguja / Pemba database nodes</p>
                    </div>
                  </div>
                )}

                {uploadState === 'analyzing' && (
                  <div className="space-y-3">
                    <div className="relative w-12 h-12 mx-auto">
                      <div className="absolute inset-0 rounded-full border-t border-[#C1121F] animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-r border-[#C1121F] animate-spin" />
                    </div>
                    <div>
                      <h6 className="font-mono text-xs text-[#C1121F] uppercase font-bold">STAGE 3: Formulating Anomaly Vectors</h6>
                      <p className="text-[10px] text-gray-500 mt-0.5">Structuring neural insights with Gemini parser client</p>
                    </div>
                  </div>
                )}

                {uploadState === 'ready' && parsedData && (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-950/20 border border-emerald-800 flex items-center justify-center text-emerald-500 mx-auto">
                      <CheckCircle2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h6 className="font-sans text-xs text-white font-bold uppercase tracking-wider">Ingestion & AI Parsing: Successful</h6>
                      <p className="text-[10px] text-emerald-500 font-mono mt-0.5">Validity rate: {parsedData.cleanSuccessRate}% • {parsedData.predictionsCount} records plotted</p>
                    </div>
                  </motion.div>
                )}

                {uploadState === 'error' && (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-red-950/30 border border-red-800 flex items-center justify-center text-[#C1121F] mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h6 className="font-sans text-xs text-white font-bold uppercase">Grid mapping failure</h6>
                      <p className="text-[10px] text-gray-400 mt-0.5">Failed to read table boundary shapes.</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Reset Control */}
              <div className="border-t border-gray-850 pt-2.5 flex justify-end">
                <button
                  id="reset-upload-action"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded bg-neutral-800 text-white hover:bg-neutral-700 text-xs font-semibold border border-gray-800 transition-colors cursor-pointer"
                >
                  Retrieve New File
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Templates Panel and active logs */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Quick Demo Templates */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
            <h5 className="font-sans font-bold text-white text-xs mb-2 uppercase tracking-wide">ZECO Telemetry Templates</h5>
            <p className="text-[11px] text-gray-400 leading-normal mb-3.5">
              Select an official grid registry catalog format below to simulate immediate SCADA retraining cycles:
            </p>

            <div className="space-y-2">
              {templates.map((tmpl, idx) => (
                <button
                  key={idx}
                  id={`temp-select-${idx}`}
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="w-full text-left p-3 rounded bg-[#111] border border-gray-850 hover:border-gray-750 flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="text-gray-450 group-hover:text-[#C1121F] w-4 h-4 transition-colors shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#C1121F] transition-colors">{tmpl.name}</div>
                      <div className="text-[9px] text-gray-500 font-mono mt-0.5 font-bold uppercase">Size: {tmpl.size} • Schema: {Object.keys(tmpl.rows[0]).length} headers</div>
                    </div>
                  </div>
                  <Upload className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Resulting Diagnostic Pane */}
          {uploadState === 'ready' && parsedData && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 mb-3 pb-2 border-b border-gray-850">
                <Cpu className="w-3.5 h-3.5" />
                <span className="font-sans font-bold tracking-wider uppercase text-[10px]">SCADA Vector Parsing Diagnostics</span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-gray-500 font-bold text-[9px] uppercase">Resolved Schema Matrix:</span>
                  <div className="text-white font-bold mt-0.5 text-[11px]">{parsedData.detectedMetric}</div>
                </div>

                <div>
                  <span className="text-gray-500 font-bold text-[9px] uppercase">Mapped Location Vertices:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedData?.detectedLocations?.map((loc: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 bg-[#111] text-gray-300 rounded text-[9px] uppercase border border-gray-850 font-bold">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 font-bold text-[9px] uppercase">Gemini Generative Report:</span>
                  <p className="text-gray-300 leading-normal font-sans text-[11px] mt-1 p-2.5 bg-black/40 rounded border border-gray-850">
                    {parsedData.aiInsightSummary}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
