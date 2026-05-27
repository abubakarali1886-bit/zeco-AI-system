/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  ShieldAlert, 
  BadgeCent, 
  FileText, 
  Settings, 
  Users, 
  Bell, 
  LogOut, 
  ChevronDown, 
  User as UserIcon, 
  Activity, 
  Globe, 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  Clock, 
  FlameKindling,
  Terminal,
  Cpu
} from 'lucide-react';

import { User, Notification, ZanzibarLocation } from './types';
import { INITIAL_USERS } from './data';
import DashboardView from './components/DashboardView';
import GisMapView from './components/GisMapView';
import PredictiveCenter from './components/PredictiveCenter';
import UploadView from './components/UploadView';
import ReportsView from './components/ReportsView';
import UserManagementView from './components/UserManagementView';
import SettingsView from './components/SettingsView';
import ZecoLogo from './components/ZecoLogo';

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('zeco_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showForgot, setShowForgot] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Forgot Password Helpers
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveredPasskey, setRecoveredPasskey] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Active platform views
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Real-time alarm monitoring alerts
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n-001',
      title: 'Mtoni Substation Core High Thermal Hazard',
      message: 'Mtoni F4 feeder (Mwera Interconnector) reported critical oil temperature spike of 98°C.',
      type: 'error',
      timestamp: 'Just Now',
      read: false
    },
    {
      id: 'n-002',
      title: 'Loss anomaly flags in Kiwengwa Beach',
      message: 'Isolation Forest flags non-technical load bypass deviation on meter ST-2012.',
      type: 'warning',
      timestamp: '25 min ago',
      read: false
    },
    {
      id: 'n-003',
      title: 'Substation automated retraining synced',
      message: 'Demand neural prediction algorithms dynamically calibrated with tourist seasonal loads.',
      type: 'success',
      timestamp: '1 hour ago',
      read: true
    }
  ]);



  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Authorized credentials are required.');
      return;
    }

    setAuthLoading(true);
    setLoginError('');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credential verification mismatch.');
      return data;
    })
    .then(data => {
      if (data.user && data.token) {
        localStorage.setItem('zeco_user', JSON.stringify(data.user));
        localStorage.setItem('zeco_auth_token', data.token);
        setCurrentUser(data.user);
        setActiveTab('dashboard');
      } else {
        setLoginError('Incorrect authorizations. Verify credentials.');
      }
      setAuthLoading(false);
    })
    .catch(err => {
      console.error(err);
      const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
      setLoginError(isFetchError ? 'Zeco platform terminal connection offline. Ensure the backend server is fully initialized and try again.' : (err.message || 'Server authentication connectivity timeout.'));
      setAuthLoading(false);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('zeco_user');
    localStorage.removeItem('zeco_auth_token');
    setCurrentUser(null);
    setActiveTab('dashboard');
    setShowProfile(false);
    setShowNotifications(false);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Helper: check permissions
  // Users tab → only 'Super Admin' or users with 'user_management' permissions
  const hasTabPermission = (tabId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Super Admin') return true;

    const perms = currentUser.permissions || [];

    if (tabId === 'users') {
      return perms.includes('user_management');
    }
    if (tabId === 'settings') {
      return currentUser.role === 'Super Admin';
    }
    if (tabId === 'upload') {
      return perms.includes('upload_datasets') || currentUser.role === 'Data Analyst';
    }
    return true; // other basic views are open
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#111111] text-gray-100 flex flex-col font-sans select-none" id="zeco-ai-app-root">
      
      {/* 1. LANDING & LOGIN VIEWS */}
      {!currentUser ? (
        <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-br from-[#111111] via-[#151515] to-black relative overflow-hidden" id="landing-container">
          {/* Animated decorative grid coordinates */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C1121F] rounded-full filter blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-800 rounded-full filter blur-[80px]" />
          </div>

          {/* Top minimal header */}
          <header className="flex justify-between items-center z-10 w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <ZecoLogo size={38} className="shadow-lg animate-pulse" />
              <div>
                <span className="font-sans text-xs text-white font-black tracking-widest block leading-none">ZECO PLATFORM</span>
                <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Grid Command OS</span>
              </div>
            </div>
            
            <span className="text-[10px] font-mono border border-[#C1121F]/20 rounded-full px-3 py-1 bg-[#C1121F]/10 text-[#C1121F] font-semibold">
              UNGUJA & PEMBA GRID TERMINAL
            </span>
          </header>

          {/* Primary Landing Content */}
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto z-10">
            
            {/* Mission Statement */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="text-xs text-[#C1121F] font-extrabold uppercase tracking-widest font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C1121F] animate-spin" />
                <span>Next-Generation SCADA Coprocessor</span>
              </span>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Zanzibar Electricity Corporation <span className="bg-gradient-to-r from-[#C1121F] to-[#E63946] bg-clip-text text-transparent">AI Intelligence</span> & Prediction System.
              </h1>

              <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
                Empower regional ZECO engineers with actual LSTM load demand forecasting, real-time XGBoost transformer outage mitigation profiles, Isolation Forest non-technical fraud detection, and multi-layered GIS routing of Unguja and Pemba.
              </p>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-900 pt-6">
                <div>
                  <div className="text-2xl font-extrabold text-white font-mono">15+ Wards</div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Full GIS Coverage</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white font-mono">94.8%</div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">AI Prediction Precision</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white font-mono">&lt; 15s</div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">SCADA Diagnostics Sync</div>
                </div>
              </div>
            </div>

            {/* Premium Login Sandbox Form */}
            <div className="lg:col-span-5 bg-[#121212]/95 border border-[#C1121F]/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              
              {!showForgot ? (
                /* Login screen */
                <form onSubmit={handleManualLogin} className="space-y-4 text-left" id="login-form-box">
                  <div className="flex flex-col items-center text-center pb-3 border-b border-gray-900 mb-1">
                    <ZecoLogo size={68} className="mb-2.5 filter drop-shadow-[0_4px_6px_rgba(193,18,31,0.15)]" />
                    <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-sans">SCADA COMMAND AUTHORIZATION</h3>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal font-sans">Enter authorized credentials to link secure grid terminal keys.</p>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-lg bg-red-950/25 border border-[#C1121F]/30 text-xs text-[#C1121F] font-mono">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 uppercase font-mono">Authorized Operator ID</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" />
                      <input
                        type="email"
                        required
                        placeholder="abubakarali1886@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#C1121F]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-gray-400 uppercase font-mono">Pass Key</label>
                      <button 
                        type="button" 
                        id="forgot-password-trigger"
                        onClick={() => setShowForgot(true)} 
                        className="text-[10px] text-gray-500 hover:text-white"
                      >
                        Forgot Pass?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-600" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#C1121F]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-login-submit"
                    disabled={authLoading}
                    className="w-full py-2 bg-gradient-to-r from-[#C1121F] to-[#E63946] text-white font-bold text-xs rounded-lg uppercase tracking-wider hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{authLoading ? 'Authorizing secure links...' : 'Request terminal authorization'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                /* Dynamic real password recovery flow */
                <form 
                  id="forgot-password-box" 
                  className="space-y-4 text-left"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!recoveryEmail) {
                      setRecoveryMessage('Operative email is required.');
                      return;
                    }
                    setRecoveryLoading(true);
                    setRecoveryMessage('');
                    setRecoveredPasskey('');

                    fetch('/api/auth/forgot-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: recoveryEmail })
                    })
                    .then(async res => {
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Identity not located.');
                      return data;
                    })
                    .then(data => {
                      if (data.success) {
                        setRecoveryMessage(data.message);
                        setRecoveredPasskey(data.tempPassword);
                      }
                      setRecoveryLoading(false);
                    })
                    .catch(err => {
                      setRecoveryMessage(err.message || 'Identity verification timeout.');
                      setRecoveryLoading(false);
                    });
                  }}
                >
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">RECOVER PASS KEY ACCESS</h3>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                      Enter your operator email. The system resets your security clearance and returns a temporary bypass passphrase coordinate.
                    </p>
                  </div>

                  {recoveryMessage && (
                    <div className={`p-3 rounded border text-xs font-mono leading-relaxed ${
                      recoveredPasskey 
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-950/20 border-[#C1121F]/20 text-[#C1121F]'
                    }`}>
                      {recoveryMessage}
                    </div>
                  )}

                  {recoveredPasskey && (
                    <div className="p-3 bg-neutral-900 border border-gray-800 rounded-lg space-y-2">
                      <div className="text-[10px] text-gray-500 uppercase font-mono">Simulated Dispatched credentials code:</div>
                      <div className="flex items-center justify-between bg-black p-2 rounded border border-gray-850">
                        <span className="text-xs font-mono font-bold text-white tracking-widest">{recoveredPasskey}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(recoveredPasskey);
                            alert('Passkey coordinates copied to clipboard!');
                          }}
                          className="text-[9px] text-[#C1121F] uppercase font-mono hover:underline"
                        >
                          Copy key
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-500 font-mono leading-tight">
                        Use this temporary bypass passphrase directly on the main terminal login screen to log in immediately.
                      </p>
                    </div>
                  )}

                  {!recoveredPasskey && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase font-mono">Operative Email Pointer</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g., billing.staff@zeco.co.tz"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#C1121F]"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 gap-2">
                    <button 
                      type="button" 
                      id="forgot-password-cancel"
                      onClick={() => {
                        setShowForgot(false);
                        setRecoveryEmail('');
                        setRecoveryMessage('');
                        setRecoveredPasskey('');
                      }} 
                      className="text-xs text-gray-500 hover:text-white cursor-pointer"
                    >
                      Back to operator login
                    </button>
                    
                    {!recoveredPasskey && (
                      <button
                        type="submit"
                        id="forgot-password-submit"
                        disabled={recoveryLoading}
                        className="px-4 py-2 bg-[#C1121F] hover:bg-red-700 text-xs font-bold text-white rounded transition-colors cursor-pointer"
                      >
                        {recoveryLoading ? 'Cycling relays...' : 'Dispatch coordinates'}
                      </button>
                    )}
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* Minimal visual footnote */}
          <footer className="w-full max-w-7xl mx-auto border-t border-gray-950 pt-5 mt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-gray-600 gap-2">
            <span>© 2026 ZANZIBAR ELECTRICITY CORPORATION (ZECO). SYSTEM PROTECTED BY JWT-HS256 METADATA CONTROLLERS.</span>
            <span className="text-[#C1121F] uppercase font-bold tracking-wider">Restricted command center</span>
          </footer>
        </div>
      ) : (
        
        /* 2. AUTHENTICATED COMMAND PLATFORM GATEWAY */
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Main vertical sidebar control rails */}
          <aside className="w-64 bg-[#151515] border-r border-gray-800 hidden md:flex flex-col justify-between" id="sidebar-navigation">
            <div className="p-4 space-y-5">
              
              {/* Logo banner */}
              <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
                <ZecoLogo size={32} />
                <div>
                  <span className="font-sans font-extrabold text-xs text-white tracking-wider block leading-none">ZECO PLATFORM</span>
                  <span className="text-[9px] text-[#C1121F] font-mono tracking-widest font-black uppercase">Grid Command AI</span>
                </div>
              </div>

              {/* Sidebar Tabs control loops */}
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard Control', icon: Activity, desc: 'Executive grid commands' },
                  { id: 'gis-map', label: 'Zanzibar GIS map', icon: Globe, desc: 'GIS layering mapping' },
                  { id: 'predictive', label: 'Predictive center', icon: Zap, desc: 'LSTM / XGBoost forecasts' },
                  { id: 'upload', label: 'Upload center', icon: Cpu, desc: 'Ingest SCADA spreadsheets' },
                  { id: 'reports', label: 'Intelligence reports', icon: FileText, desc: 'Markdown AI synthesis' },
                  { id: 'users', label: 'Team credentials', icon: Users, desc: 'Operator access levels' },
                  { id: 'settings', label: 'Calibration values', icon: Settings, desc: 'Tuning parameters & keys' },
                ].map(item => {
                  const Icon = item.icon;
                  const isAccessible = hasTabPermission(item.id);
                  const isSelected = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      disabled={!isAccessible}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left p-2.5 rounded-lg border flex items-center gap-3 group transition-all duration-200 relative overflow-hidden cursor-pointer ${
                        !isAccessible ? 'opacity-30 cursor-not-allowed bg-transparent' : ''
                      } ${
                        isSelected 
                          ? 'bg-[#C1121F]/10 border-[#C1121F]/30 text-white shadow-sm' 
                          : 'bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-[#1E1E1E] hover:border-gray-800'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 transition-all ${isSelected ? 'text-[#C1121F]' : 'text-gray-500 group-hover:text-white'}`} />
                      
                      <div className="flex-1 select-none">
                        <div className="text-xs font-semibold">{item.label}</div>
                        <div className="text-[8px] text-gray-500 font-mono tracking-wide mt-0.5">{item.desc}</div>
                      </div>

                      {isSelected && (
                        <motion.div
                          layoutId="activeTabGlow"
                          className="absolute right-0 top-0 bottom-0 w-1 bg-[#C1121F]"
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>

            </div>

            {/* Operator Active profiles summary */}
            <div className="p-3 border-t border-gray-800 bg-[#151515] flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-gray-800 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-[#C1121F]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate leading-none">{currentUser.name}</div>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#C1121F]/15 text-[#C1121F] border border-[#C1121F]/20 font-bold uppercase mt-1 inline-block">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                id="btn-sidebar-logout"
                onClick={handleLogout}
                className="w-full mt-1 py-1 px-2 border border-gray-800 rounded bg-[#111] hover:bg-neutral-800 text-[10px] font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign off Terminal</span>
              </button>
            </div>
          </aside>

          {/* Core content wrapper */}
          <main className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Horizontal Command Top bar */}
            <header className="h-14 bg-[#151515] border-b border-gray-800 px-5 flex items-center justify-between z-20">
              
              {/* Left region status bar */}
              <div className="flex items-center gap-3">
                <div className="md:hidden"><ZecoLogo size={28} /></div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-400 capitalize">Active View:</span>
                  <span className="text-white font-mono font-bold bg-[#111] px-2 py-0.5 rounded border border-gray-800 uppercase text-[9px]">
                    {activeTab.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Right panel integrations */}
              <div className="flex items-center gap-4">
                
                {/* Notification alert counter Bell icon */}
                <div className="relative">
                  <button
                    id="btn-trigger-notification-drawer"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded bg-gray-950 hover:bg-[#1A1A1A] border border-gray-850 text-gray-300 hover:text-white transition-all scale-95 cursor-pointer relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C1121F] text-white text-[8px] font-bold flex items-center justify-center animation-pulse animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* SCADA Notifications drop down drawer */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2.5 w-80 bg-[#111] border border-gray-850 rounded-xl shadow-2xl p-4 space-y-3 z-50 text-left cursor-default"
                        id="scada-bell-notifications-drawer"
                      >
                        <div className="flex justify-between items-center border-b border-gray-900 pb-2">
                          <span className="text-xs font-bold text-white uppercase font-mono tracking-wide">SCADA ALARM REGISTERS</span>
                          <button 
                            id="btn-bell-read-all"
                            onClick={markAllNotificationsRead} 
                            className="text-[9px] text-[#C1121F] hover:text-[#E63946] font-mono uppercase"
                          >
                            Mark read
                          </button>
                        </div>

                        <div className="space-y-2 mb-2 max-h-[310px] overflow-y-auto">
                          {notifications.map(item => (
                            <div key={item.id} className={`p-2.5 rounded border text-xs ${
                              item.read ? 'bg-black/30 border-gray-950 opacity-60' : 'bg-[#1E1E1E]/80 border-gray-850'
                            }`}>
                              <div className="flex justify-between items-start gap-2">
                                <span className={`font-bold ${
                                  item.type === 'error' ? 'text-[#C1121F]' : item.type === 'warning' ? 'text-yellow-500' : 'text-emerald-500'
                                }`}>
                                  {item.title}
                                </span>
                                <span className="text-[8px] font-mono text-gray-500 tracking-wide mt-0.5 block shrink-0">{item.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-gray-300 leading-tight mt-1 font-sans">{item.message}</p>
                            </div>
                          ))}
                        </div>

                        <div className="text-center pt-1 border-t border-gray-900">
                          <span className="text-[9px] font-mono text-gray-500 uppercase">Zeco automated alarms telemetry</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Operator Profile dropdown */}
                <div className="relative">
                  <button
                    id="btn-profile-terminal-trigger"
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-1.5 p-1 px-2.5 rounded hover:bg-[#111] transition-all cursor-pointer select-none"
                  >
                    <div className="w-6.5 h-6.5 rounded-full bg-[#1e1e1e] border border-gray-800 flex items-center justify-center shrink-0">
                      <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2.5 w-60 bg-[#111] border border-gray-850 rounded-xl shadow-2xl p-4 z-50 text-left"
                        id="profile-dropdown-sandbox"
                      >
                        <div className="space-y-1 pb-3 border-b border-gray-900 text-xs">
                          <div className="font-extrabold text-white">{currentUser.name}</div>
                          <div className="text-[10px] font-mono text-[#C1121F] uppercase font-bold">{currentUser.role}</div>
                          <div className="text-[9px] text-gray-500 truncate mt-0.5">{currentUser.email}</div>
                        </div>

                        <div className="py-2.5 border-b border-gray-900 space-y-1">
                          <div className="text-[9px] text-gray-500 uppercase font-mono mb-1.5 font-bold">Privilege Bounds</div>
                          {(currentUser.permissions || []).map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-mono text-[10px] uppercase">{p.replace('_', ' ')}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          id="btn-dropdown-logout"
                          onClick={handleLogout}
                          className="w-full mt-2.5 py-1.5 bg-[#C1121F] hover:bg-opacity-90 text-white font-bold text-xs rounded uppercase tracking-wider transition-opacity text-center block cursor-pointer"
                        >
                          De-authorize Terminal
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </header>

            {/* Scrollable primary sandboxed module viewport panel */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-[#111111] to-black text-left scrollbar-thin">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-7xl mx-auto"
                >
                  
                  {activeTab === 'dashboard' && <DashboardView onNavigateToTab={setActiveTab} />}
                  {activeTab === 'gis-map' && <GisMapView />}
                  {activeTab === 'predictive' && <PredictiveCenter />}
                  {activeTab === 'upload' && <UploadView />}
                  {activeTab === 'reports' && <ReportsView />}
                  {activeTab === 'users' && <UserManagementView />}
                  {activeTab === 'settings' && <SettingsView />}

                </motion.div>
              </AnimatePresence>

            </div>

            {/* Platform bottom tiny status ribbon */}
            <footer className="h-8 bg-[#151515] border-t border-gray-800 px-5 flex justify-between items-center text-[9px] font-mono text-gray-500">
              <span className="uppercase">Zeco command cluster: un-scada-ring-01 connected</span>
              <span className="text-[#C1121F] font-semibold uppercase">Restricted operational viewport</span>
            </footer>

          </main>

        </div>
      )}

    </div>
  );
}
