/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, Printer, Clipboard, CheckCircle, RefreshCw, Sparkles, Loader2, Download, ShieldAlert } from 'lucide-react';

export default function ReportsView() {
  const [reportType, setReportType] = useState<'outage' | 'theft' | 'demand' | 'billing'>('outage');
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateReport = () => {
    setLoading(true);
    setReportResult(null);

    const token = localStorage.getItem('zeco_auth_token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/ai/report', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reportType })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Access Denied: Missing permissions');
      return data;
    })
    .then(data => {
      setReportResult(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setReportResult({ error: isFetchError ? 'Terminal connection offline. Secure report links could not be validated.' : (err.message || 'Execution terminal failure.') });
      setLoading(false);
    });
  };

  const handleCopy = () => {
    if (reportResult?.reportMarkdown) {
      navigator.clipboard.writeText(reportResult.reportMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const decodeMarkdownLines = (md: string) => {
    if (!md) return [];
    return md.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-bold font-sans text-white border-b border-gray-800 pb-2 mt-6 mb-3">{trimmed.replace('# ', '')}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-semibold font-sans text-white mt-5 mb-2.5">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-semibold font-sans text-[#C1121F] uppercase mt-4 mb-2">{trimmed.replace('### ', '')}</h3>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-bold text-gray-300 tracking-wider uppercase mt-4 mb-1.5">{trimmed.replace('#### ', '')}</h4>;
      }
      if (trimmed.startsWith('- ')) {
        return <li key={idx} className="text-xs text-gray-300 font-sans list-disc ml-5 mb-1.5 leading-relaxed">{trimmed.replace('- ', '')}</li>;
      }
      if (trimmed.startsWith('1. ') || trimmed.match(/^\d+\.\s/)) {
        return <li key={idx} className="text-xs text-gray-300 font-sans list-none ml-2.5 mb-2 leading-relaxed font-mono"><span className="text-[#C1121F] font-bold pr-1">{trimmed.split('. ')[0]}.</span> {trimmed.substring(trimmed.indexOf('. ') + 2)}</li>;
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={idx} className="text-xs text-gray-400 font-mono italic mb-3 font-semibold">{trimmed.replace(/\*\*/g, '')}</p>;
      }
      if (trimmed === '---') {
        return <hr key={idx} className="border-gray-850 my-5" />;
      }
      // handle simple bold elements within line
      if (trimmed !== '') {
        return <p key={idx} className="text-xs text-gray-300 leading-relaxed font-sans mb-3">{trimmed.replace(/\*\*/g, '')}</p>;
      }
      return <div key={idx} className="h-2" />;
    });
  };

  return (
    <div className="space-y-6" id="reports-view-pane">
      
      {/* Configuration row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Trigger parameters card */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-4 shadow-sm">
            <span className="text-[9px] font-mono text-[#C1121F] tracking-widest uppercase font-bold">REPORT AGENT COMMAND</span>
            <h4 className="text-sm font-bold text-white mt-1">Grid Intelligence Exporter</h4>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">
              Compile full-scale grid vulnerability audits, outage risk catalogs, or non-technical loss investigations powered by Gemini.
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="text-gray-400 text-[9px] font-mono uppercase font-bold">Target Theme Specification</label>
                <select
                  id="select-report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full mt-1 px-2.5 py-1.5 border border-gray-800 rounded bg-[#111] text-xs text-white focus:outline-none focus:border-[#C1121F] cursor-pointer"
                >
                  <option value="outage">1. Outage Predictive Risk Report</option>
                  <option value="theft">2. Non-Technical Loss & Theft Audit</option>
                  <option value="demand">3. Regional Power Demand Projection</option>
                  <option value="billing">4. Prepayment & Tariff Exhaustion Forecast</option>
                </select>
              </div>

              <button
                id="btn-report-generate"
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full mt-1 py-2 rounded border border-[#C1121F]/20 bg-[#C1121F] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#C1121F]/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling ZECO matrix...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Compile AI Grid Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#1e1e1e] border border-gray-800 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="text-emerald-500 w-4 h-4" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Security & Integrity Check</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal font-mono">
              Completed reports are digitally hashed and mapped corresponding to the active Super Admin identity (Mhandisi Abubakar Ali) to enforce standard ZECO distribution protection credentials.
            </p>
          </div>
        </div>

        {/* compiled display panel */}
        <div className="lg:col-span-8 flex flex-col min-h-[440px]">
          {loading ? (
            <div className="flex-1 bg-[#1e1e1e] border border-gray-800 rounded-lg flex flex-col items-center justify-center p-8 text-center gap-2">
              <Loader2 className="w-6 h-6 text-[#C1121F] animate-spin" />
              <div className="space-y-0.5">
                <h6 className="font-mono text-xs text-white uppercase font-bold">Querying Grid Knowledge Layers</h6>
                <p className="text-[11px] text-gray-500">Synthesizing telemetry records and formulating executive recommendations...</p>
              </div>
            </div>
          ) : reportResult && !reportResult.error ? (
            <div className="bg-[#1e1e1e] border border-gray-800 rounded-lg shadow-sm flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Report Header Actions */}
              <div className="p-3 bg-[#111] border-b border-gray-850 flex justify-between items-center">
                <div>
                  <div className="text-[11px] font-bold text-white uppercase font-mono tracking-wider">COMPILED DIGITAL REGISTER</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5 font-bold">AUTHOR ID: {reportResult.author}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-report-copy"
                    onClick={handleCopy}
                    className="p-1 px-1.5 rounded bg-neutral-800 hover:bg-neutral-750 border border-gray-800 text-gray-300 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1"
                    title="Copy Markdown to Clipboard"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold font-mono text-emerald-500">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold font-mono">COPY</span>
                      </>
                    )}
                  </button>
                  <button
                    id="btn-report-print"
                    onClick={() => window.print()}
                    className="p-1 px-1.5 rounded bg-neutral-800 hover:bg-neutral-750 border border-gray-800 text-gray-300 hover:text-white transition-all cursor-pointer text-xs flex items-center gap-1"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold font-mono">PRINT</span>
                  </button>
                </div>
              </div>

              {/* Rendered Markdown Body */}
              <div className="flex-1 p-5 overflow-y-auto max-h-[500px] bg-black/45 text-left scrollbar-thin">
                <div className="prose prose-invert prose-xs max-w-none">
                  {decodeMarkdownLines(reportResult.reportMarkdown)}
                </div>
              </div>

              {/* Footer status signoff */}
              <div className="p-2.5 bg-[#111] border-t border-gray-850 flex justify-between items-center text-[9px] font-mono text-gray-500 font-bold">
                <span>COMPILED ON DATE: {reportResult.generatedAt}</span>
                <span className="text-[#C1121F] font-bold">RESTRICTED USE</span>
              </div>

            </div>
          ) : reportResult && reportResult.error ? (
            <div className="flex-1 bg-[#1e1e1e] border border-gray-800 rounded-lg flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <ShieldAlert className="w-12 h-12 text-[#C1121F] mb-3 animate-pulse" />
              <h6 className="font-mono font-bold text-white text-xs uppercase tracking-wider">Grid Clearance Violation</h6>
              <p className="text-[11px] text-gray-500 mt-2 max-w-sm leading-normal font-mono">
                {reportResult.error}
              </p>
            </div>
          ) : (
            <div className="flex-1 bg-[#1e1e1e] border border-gray-800 rounded-lg flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <FileText className="w-8 h-8 text-gray-600 mb-2 animate-pulse" />
              <h6 className="font-sans font-bold text-white text-xs uppercase tracking-wider">No Active Document Generated</h6>
              <p className="text-[11px] text-gray-500 mt-1 max-w-sm leading-normal">
                Choose a SCADA theme specification layout on the left and select &quot;Compile AI Grid Report&quot; to synthesize grid logs instantly.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
