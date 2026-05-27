/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  UserCheck, 
  ShieldAlert, 
  KeyRound, 
  Clock, 
  Edit3, 
  Trash2, 
  Check, 
  UserPlus, 
  Search, 
  RefreshCw, 
  X, 
  Lock, 
  UserX, 
  Sliders, 
  Activity, 
  Shield, 
  AlertCircle,
  User as UserIcon
} from 'lucide-react';
import { User, UserRole } from '../types';

const METRIC_MODULES = [
  'All',
  'Authentication',
  'Identity Management',
  'Outage Engine',
  'SCADA Alert Agent',
  'Theft Detection',
  'Data Ingestion'
];

const AVAILABLE_ROLES: UserRole[] = [
  'Super Admin',
  'Data Analyst',
  'Technical Staff',
  'Billing Team'
];

const PERMISSIONS_LIST = [
  { id: 'all_access', name: 'Administrative Override Clearance (all_access)', cat: 'System' },
  { id: 'user_management', name: 'Personnel Credentials Directory CRUDS (user_management)', cat: 'Identity' },
  { id: 'upload_datasets', name: 'Import Regional Grid Consumption Sheets (upload_datasets)', cat: 'Ingestion' },
  { id: 'analytics_read', name: 'Observe Grid Performance Telemetry Indexes (analytics_read)', cat: 'Analytics' },
  { id: 'forecast_run', name: 'Retrain Power Demand Predictions (forecast_run)', cat: 'Analytics' },
  { id: 'generate_reports', name: 'Generate Professional Operational Briefs (generate_reports)', cat: 'Reporting' },
  { id: 'view_grids', name: 'Inspect Reactive GIS Substation Outlay (view_grids)', cat: 'GIS Map' },
  { id: 'outage_prediction_access', name: 'Forecast Transformer Trip Hazards (outage_prediction_access)', cat: 'Substations' },
  { id: 'transformer_remedial', name: 'Trigger Smart SCADA Line Remediations (transformer_remedial)', cat: 'Substations' },
  { id: 'theft_investigate', name: 'Audit Discrepancies and Loss Suspects (theft_investigate)', cat: 'Revenue' },
  { id: 'billing_prediction_access', name: 'Map billing anomalies models (billing_prediction_access)', cat: 'Revenue' }
];

export default function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [securityAccessSuspended, setSecurityAccessSuspended] = useState(false);

  // Filters for User Directory list
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | UserRole>('All');

  // Filters for Audit Log console
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('All');

  // Multi-state modals
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Technical Staff');
  const [newDept, setNewDept] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSelectedPerms, setNewSelectedPerms] = useState<string[]>([]);

  // Password Reset Output overlay Modal
  const [resetCompletedUser, setResetCompletedUser] = useState<User | null>(null);
  const [resetCompletedPasskey, setResetCompletedPasskey] = useState('');
  const [resetCompletedLink, setResetCompletedLink] = useState('');

  // Delete Double Confirmation Dialog State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Local user identity session copy to disable core self deletions
  const activeOperatorId = (() => {
    try {
      const uStr = localStorage.getItem('zeco_user');
      if (uStr) {
        return JSON.parse(uStr).id;
      }
    } catch {}
    return '';
  })();

  const fetchWithAuth = async (url: string, options: any = {}) => {
    const token = localStorage.getItem('zeco_auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMessage = data.error || `Command terminal failure (Status ${res.status})`;
      if (res.status === 403 || res.status === 401) {
        setSecurityAccessSuspended(true);
      }
      throw new Error(errMessage);
    }
    return data;
  };

  const loadOperationalData = () => {
    setLoadingUsers(true);
    setErrorBanner('');
    fetchWithAuth('/api/users')
      .then(data => {
        setUsers(data.users || []);
        setSecurityAccessSuspended(false);
        setLoadingUsers(false);
      })
      .catch(err => {
        console.error(err);
        const isFetchError = err.message === 'Failed to fetch' || err.name === 'TypeError';
        setErrorBanner(isFetchError ? 'Zeco platform terminal connection offline. Ensure the backend server is fully initialized and active.' : err.message);
        setLoadingUsers(false);
      });

    loadAuditHistory();
  };

  const loadAuditHistory = () => {
    setLoadingLogs(true);
    const qSearch = encodeURIComponent(logSearchQuery);
    const qModule = encodeURIComponent(logModuleFilter);
    fetchWithAuth(`/api/audit-logs?search=${qSearch}&module_filter=${qModule}`)
      .then(data => {
        setLogs(data.logs || []);
        setLoadingLogs(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingLogs(false);
      });
  };

  useEffect(() => {
    loadOperationalData();
  }, []);

  // Sync log filters
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAuditHistory();
    }, 400);
    return () => clearTimeout(timeout);
  }, [logSearchQuery, logModuleFilter]);

  // Handle addition
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');
    if (!newName || !newEmail || !newRole) {
      setErrorBanner('Operative properties are required.');
      return;
    }

    const payload = {
      name: newName,
      email: newEmail,
      role: newRole,
      department: newDept,
      permissions: newSelectedPerms.length > 0 ? newSelectedPerms : null,
      customPassword: newPassword || 'password'
    };

    fetchWithAuth('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(data => {
        if (data.success) {
          setNewUserOpen(false);
          // clear forms
          setNewName('');
          setNewEmail('');
          setNewRole('Technical Staff');
          setNewDept('');
          setNewPassword('');
          setNewSelectedPerms([]);
          // re-trigger loading
          loadOperationalData();
        }
      })
      .catch(err => {
        setErrorBanner(err.message);
      });
  };

  // Trigger password reset API
  const triggerResetPasskey = (user: User) => {
    setErrorBanner('');
    fetchWithAuth(`/api/users/${user.id}/reset-password`, {
      method: 'POST'
    })
      .then(data => {
        if (data.success) {
          setResetCompletedUser(user);
          setResetCompletedPasskey(data.tempPasskey);
          setResetCompletedLink(data.resetLink);
          loadAuditHistory();
        }
      })
      .catch(err => {
        setErrorBanner('Passkey Reset Denied: ' + err.message);
      });
  };

  // Trigger update user
  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorBanner('');

    const payload = {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
      department: editingUser.department,
      permissions: editingUser.permissions
    };

    fetchWithAuth(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
      .then(data => {
        if (data.success) {
          setEditingUser(null);
          loadOperationalData();
        }
      })
      .catch(err => {
        setErrorBanner('Update Failed: ' + err.message);
      });
  };

  // Trigger deletion
  const handleDeleteUserSubmit = () => {
    if (!userToDelete) return;
    if (deleteConfirmationText.toLowerCase() !== 'confirm') {
      setErrorBanner('De-authorization failed: Must explicitly type "confirm".');
      return;
    }

    setErrorBanner('');
    fetchWithAuth(`/api/users/${userToDelete.id}`, {
      method: 'DELETE'
    })
      .then(data => {
        if (data.success) {
          setUserToDelete(null);
          setDeleteConfirmationText('');
          loadOperationalData();
        }
      })
      .catch(err => {
        setErrorBanner('Deletion Rejected: ' + err.message);
        setUserToDelete(null);
        setDeleteConfirmationText('');
      });
  };

  const togglePermissionForNewUser = (permId: string) => {
    setNewSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const togglePermissionForEditingUser = (permId: string) => {
    if (!editingUser) return;
    const currentPerms = editingUser.permissions || [];
    const updated = currentPerms.includes(permId)
      ? currentPerms.filter(p => p !== permId)
      : [...currentPerms, permId];
    setEditingUser({ ...editingUser, permissions: updated });
  };

  // Autosearch listing filters
  const filteredUsers = users.filter(u => {
    const textMatch = u.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
                      u.email.toLowerCase().includes(userSearchText.toLowerCase());
    const roleMatch = userRoleFilter === 'All' || u.role === userRoleFilter;
    return textMatch && roleMatch;
  });

  // UI block for role clearances
  if (securityAccessSuspended) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#151515]/45 border border-red-950/20 rounded-xl" id="lockout-screen">
        <div className="w-16 h-16 bg-[#C1121F]/10 border border-[#C1121F]/30 rounded-full flex items-center justify-center text-[#C1121F] mb-5 shadow-lg animate-pulse">
          <Lock className="w-7 h-7" />
        </div>
        
        <div className="text-center max-w-md space-y-3">
          <span className="text-[10px] font-mono uppercase bg-[#C1121F]/15 text-[#C1121F] border border-[#C1121F]/20 px-3 py-1 rounded-full font-bold">
            Access Verification Denied
          </span>
          <h3 className="text-base font-extrabold text-white tracking-wide uppercase font-mono">SCADA Terminal Directory Locked</h3>
          <p className="text-xs text-gray-400 font-sans leading-relaxed">
            Your authenticated operator credentials or role assignment lacks the <code className="text-[#C1121F] font-mono font-bold bg-neutral-900/40 px-1 py-0.5 rounded">"user_management"</code> privilege required to inspect and register system team security clearance parameters.
          </p>
          
          <div className="border border-gray-850 bg-black/30 p-4 rounded-lg text-left mt-6 space-y-2">
            <span className="text-[9px] font-mono text-gray-500 uppercase block">Terminal Security Coordinates:</span>
            <p className="text-[10px] text-gray-400 font-mono leading-tight">
              To evaluate personnel directory management features, please logout from the command rail and log in using the pre-mapped <strong className="text-white">"Ali"</strong> shortcut (Super Admin clearance).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="zeco-personnel-command">
      
      {/* 1. TOP DISSOLVABLE ERROR BAR */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-950/40 border border-[#C1121F]/40 rounded-lg flex items-start gap-2.5 text-xs text-[#E63946] font-mono"
            id="user-error-banner"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold block uppercase tracking-wide text-[10px]">Security Clearance Directive Interrupted</span>
              <p className="mt-0.5">{errorBanner}</p>
              {errorBanner.includes('connection offline') && (
                <div className="mt-2.5">
                  <button 
                    onClick={() => {
                      setErrorBanner('');
                      loadOperationalData();
                    }}
                    className="px-2 py-1 rounded bg-[#C1121F] text-white hover:bg-[#E63946] transition-colors cursor-pointer font-sans text-[10px] font-bold uppercase tracking-wider block"
                  >
                    Retry Link Calibration
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setErrorBanner('')} className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: ACTIVE USER REGISTRIES (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col bg-[#1e1e1e] border border-gray-850 rounded-lg p-4 shadow-sm" id="personnel-registry-panel">
          
          {/* Section head */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-gray-850 gap-3">
            <div>
              <span className="text-[10px] text-[#C1121F] font-bold font-mono uppercase tracking-widest block font-black">ZECO Personnel Security Keys</span>
              <h4 className="text-sm font-bold text-white mt-1 font-mono">Clearance Directories & Operational Access Matrix</h4>
            </div>

            <button
              id="btn-add-team-user-scada"
              onClick={() => {
                setErrorBanner('');
                setNewUserOpen(!newUserOpen);
                setEditingUser(null);
              }}
              className="px-3 py-1.5 bg-[#C1121F] hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer flex-shrink-0 font-mono shadow-inner"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>REGISTRY NEW OPERATIVE</span>
            </button>
          </div>

          {/* Filtering row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 my-3">
            <div className="md:col-span-8 relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search team operators by name, department, or email..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-black border border-gray-850 rounded text-xs text-white focus:outline-none focus:border-[#C1121F] font-mono placeholder:text-gray-650"
              />
            </div>
            <div className="md:col-span-4 flex items-center gap-1.5">
              <label className="text-[9px] text-gray-500 font-mono uppercase">Role:</label>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="flex-1 px-2.5 py-1.5 bg-black border border-gray-850 rounded text-xs text-gray-300 focus:outline-none focus:border-[#C1121F]"
              >
                <option value="All">All Roles</option>
                {AVAILABLE_ROLES.map(rl => (
                  <option key={rl} value={rl}>{rl}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ADD OPERATOR EXPANDABLE DRAWER */}
          <AnimatePresence>
            {newUserOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-gray-850 bg-black/40 rounded p-4 mb-4 space-y-4 overflow-hidden text-left"
                onSubmit={handleCreateUserSubmit}
                id="drawer-add-operator"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-900">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5 text-[#C1121F]">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Generate Operational Credentials File</span>
                  </span>
                  <button onClick={() => setNewUserOpen(false)} type="button" className="text-gray-500 hover:text-white cursor-pointer select-none">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-mono uppercase font-bold block">Operator Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Mhandisi Haji Bakari"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-850 rounded bg-[#111] text-xs text-white focus:border-[#C1121F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-mono uppercase font-bold block">Terminal Email (Login ID)</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., haji.bakari@zeco.co.tz"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-850 rounded bg-[#111] text-xs text-white focus:border-[#C1121F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-mono uppercase font-bold block">Core Operational Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-gray-850 rounded bg-[#111] text-xs text-white focus:border-[#C1121F] focus:outline-none"
                    >
                      {AVAILABLE_ROLES.map(rl => (
                        <option key={rl} value={rl}>{rl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-mono uppercase font-bold block">Department Branch (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., West District Telemetry Maintenance"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-850 rounded bg-[#111] text-xs text-white focus:border-[#C1121F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-mono uppercase font-bold block">Initial Security Passkey (Password)</label>
                    <input
                      type="password"
                      placeholder="Leave blank for test value 'password'"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-850 rounded bg-[#111] text-xs text-white focus:border-[#C1121F] focus:outline-none placeholder:text-gray-700"
                    />
                  </div>
                </div>

                {/* Clearances picker checklist */}
                <div className="space-y-2.5 bg-neutral-900 p-3 rounded border border-gray-850">
                  <div className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">Configure Custom Permissions Clearances Blueprint:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-sans">
                    {PERMISSIONS_LIST.map(p => (
                      <label 
                        key={p.id} 
                        className="flex items-start gap-2 p-1.5 rounded hover:bg-black/40 cursor-pointer text-gray-300 font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={newSelectedPerms.includes(p.id)}
                          onChange={() => togglePermissionForNewUser(p.id)}
                          className="mt-0.5 accent-[#C1121F]"
                        />
                        <div className="leading-tight">
                          <span className="text-[8px] bg-red-950/25 text-[#C1121F] font-mono font-bold px-1 rounded mr-1 inline-block">{p.cat}</span>
                          {p.name}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2 border-t border-gray-900">
                  <button
                    type="button"
                    onClick={() => setNewUserOpen(false)}
                    className="px-3 py-1.5 bg-[#151515] border border-gray-850 text-gray-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#C1121F] hover:bg-red-700 text-white font-bold rounded transition-colors cursor-pointer font-mono shadow"
                  >
                    SAVE OPERATIVE AND SYNC LINK
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* EDIT OPERATOR STATE INLINE MODAL WINDOW */}
          <AnimatePresence>
            {editingUser && (
              <motion.form
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="border-2 border-[#C1121F]/20 bg-neutral-900/90 rounded-lg p-4 mb-4 space-y-4 text-left"
                onSubmit={handleUpdateUserSubmit}
                id="edit-operator-modal"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-850">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#C1121F] tracking-widest flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Clearances: {editingUser.name}</span>
                  </span>
                  <button onClick={() => setEditingUser(null)} type="button" className="text-gray-500 hover:text-white cursor-pointer select-none">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-mono uppercase">Full Name</label>
                    <input
                      type="text"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-850 bg-black text-xs text-white rounded focus:outline-none focus:border-[#C1121F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-mono uppercase">Email Identifier</label>
                    <input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-850 bg-black text-xs text-white rounded focus:outline-none focus:border-[#C1121F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-mono uppercase">Operational Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 border border-gray-850 bg-black text-xs text-white rounded focus:outline-none focus:border-[#C1121F]"
                    >
                      {AVAILABLE_ROLES.map(rl => (
                        <option key={rl} value={rl}>{rl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 font-mono uppercase">Departmental assignment</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-850 bg-black text-xs text-white rounded focus:outline-none focus:border-[#C1121F]"
                  />
                </div>

                {/* Edit checklist */}
                <div className="space-y-2 bg-black/40 p-3 rounded border border-gray-850">
                  <div className="text-[9px] text-gray-500 font-mono uppercase font-bold">Configure Clearances Blueprint Checklist:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-sans">
                    {PERMISSIONS_LIST.map(p => (
                      <label 
                        key={p.id} 
                        className="flex items-start gap-2 p-1 rounded hover:bg-neutral-800 cursor-pointer text-gray-300 font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={(editingUser.permissions || []).includes(p.id)}
                          onChange={() => togglePermissionForEditingUser(p.id)}
                          className="mt-0.5 accent-[#C1121F]"
                        />
                        <div className="leading-tight">
                          <span className="text-[8px] bg-red-950/20 text-[#C1121F] font-mono font-bold px-1 rounded mr-1 inline-block">{p.cat}</span>
                          {p.name}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-2 border-t border-gray-850">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3 py-1.5 bg-[#151515] border border-gray-850 text-gray-400 rounded hover:bg-neutral-800 transition-colors cursor-pointer font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded transition-colors cursor-pointer font-mono shadow"
                  >
                    COMPILE CLEARANCE DATA CHANGE
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* LIST OPERATIVE DIRECTORY FILE CARDS */}
          {loadingUsers ? (
            <div className="py-20 text-center space-y-2 text-gray-500" id="dir-users-loader">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#C1121F]" />
              <p className="text-xs font-mono font-medium">Linking with central ZECO grid database system...</p>
            </div>
          ) : (
            <div className="space-y-3" id="operative-cards-list">
              {filteredUsers.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-850 rounded text-center space-y-1.5 text-gray-500 font-mono text-xs">
                  <p>No operatives matched your query filters.</p>
                  <button 
                    onClick={() => { setUserSearchText(''); setUserRoleFilter('All'); }} 
                    className="text-[#C1121F] underline hover:text-white"
                  >
                    Clear search filters
                  </button>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div key={user.id} className="p-3 bg-[#131313] border border-gray-850 hover:border-gray-800 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all">
                    
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full border border-gray-800 bg-[#161616] flex items-center justify-center shadow">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black border border-gray-850 flex items-center justify-center">
                          {user.role === 'Super Admin' ? (
                            <Shield className="w-2.5 h-2.5 text-[#C1121F]" />
                          ) : (
                            <UserCheck className="w-2.5 h-2.5 text-blue-500" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-sans font-bold text-white text-xs tracking-wide">{user.name}</h5>
                          <span className="text-[9px] font-mono font-bold uppercase bg-[#C1121F]/10 border border-[#C1121F]/20 text-[#C1121F] px-1.5 rounded inline-block">
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-mono font-medium leading-none">
                          {user.email} • {user.department || 'Unguja Grid Maintenance'}
                        </p>
                        
                        {/* Selected clearances tags tree */}
                        <div className="pt-2 flex flex-wrap gap-1 leading-none text-[8px] font-mono">
                          {user.permissions && user.permissions.map(perm => {
                            const found = PERMISSIONS_LIST.find(p => p.id === perm);
                            return (
                              <span 
                                key={perm} 
                                className="bg-neutral-900 border border-gray-855 text-gray-400 px-1 py-0.5 rounded leading-none text-[8px]"
                                title={found ? found.name : perm}
                              >
                                {perm}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Operational controls for administrators */}
                    <div className="flex md:flex-col justify-end items-end gap-2 flex-shrink-0">
                      
                      <div className="flex gap-1">
                        {/* Edit Role Clearance */}
                        <button
                          id={`btn-user-edit-scada-${user.id}`}
                          onClick={() => {
                            setErrorBanner('');
                            setEditingUser(user);
                            setNewUserOpen(false);
                          }}
                          className="px-2 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-gray-850 hover:border-gray-700 text-gray-300 rounded font-mono text-[9px] flex items-center gap-1 transition-all cursor-pointer"
                          title="Configure clearances checklist"
                        >
                          <Edit3 className="w-3 h-3 text-blue-500" />
                          <span>EDIT CLEARANCES</span>
                        </button>

                        {/* Force Passkey Reset */}
                        <button
                          id={`btn-user-reset-scada-${user.id}`}
                          onClick={() => triggerResetPasskey(user)}
                          className="px-2 py-1 bg-[#1A1A1A] hover:bg-[#252525] border border-gray-855 hover:border-gray-705 text-gray-300 rounded font-mono text-[9px] flex items-center gap-1 transition-all cursor-pointer"
                          title="Generate forced credentials reset code"
                        >
                          <KeyRound className="w-3 h-3 text-[#C1121F]" />
                          <span>RESET PASS</span>
                        </button>
                      </div>

                      {/* De-register Complete (Disabled for operator self-access session) */}
                      {user.id !== activeOperatorId ? (
                        <button
                          id={`btn-user-delete-scada-${user.id}`}
                          onClick={() => {
                            setErrorBanner('');
                            setUserToDelete(user);
                          }}
                          className="px-2 py-1 bg-red-950/20 hover:bg-[#C1121F]/15 border border-[#C1121F]/20 hover:border-[#C1121F]/40 text-[#C1121F] rounded font-mono text-[9px] flex items-center gap-1 transition-all cursor-pointer self-end block"
                          title="De-authorize and remove account Completely"
                        >
                          <Trash2 className="w-3 h-3 text-[#C1121F]" />
                          <span>DE-AUTHORIZE ACCOUNT</span>
                        </button>
                      ) : (
                        <span className="text-[8px] text-gray-600 font-mono font-bold leading-none select-none uppercase inline-block text-right pr-2">
                          Active Login Session
                        </span>
                      )}

                    </div>

                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: SECURITY AUDIT CONSOLE / REAL-TIME LOGGER */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="bg-[#1e1e1e] border border-gray-850 rounded-lg p-4 shadow-sm flex-1 flex flex-col justify-between" id="auditor-panel">
            
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between pb-2 border-b border-gray-850">
                <div className="flex items-center gap-2 text-white">
                  <Activity className="text-[#C1121F] w-4 h-4 animate-pulse" />
                  <span className="font-mono font-bold uppercase tracking-widest text-xs">Security Auditing Console</span>
                </div>
                
                <span className="text-[10px] font-mono border border-emerald-500/10 rounded px-1.5 bg-emerald-950/10 text-emerald-400 font-semibold animate-pulse">
                  POLLED REAL-TIME
                </span>
              </div>

              <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                Tracks live administrative activity, automated logins, model calibrations, and telemetry file updates mapped from ZECO terminal relays.
              </p>

              {/* Filtering forms for Logs */}
              <div className="space-y-2 bg-black/30 p-2.5 rounded border border-gray-850 text-left">
                <div className="grid grid-cols-1 gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="text"
                      placeholder="Search alerts or operator log trail..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1 bg-black border border-gray-850 rounded text-[11px] text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] text-gray-500 uppercase font-mono">Module:</span>
                    <select
                      value={logModuleFilter}
                      onChange={(e) => setLogModuleFilter(e.target.value)}
                      className="flex-1 px-2 py-1 bg-black border border-gray-850 rounded text-[10px] text-gray-300 focus:outline-none focus:border-[#C1121F]"
                    >
                      {METRIC_MODULES.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Scrolling history panel */}
              {loadingLogs ? (
                <div className="py-20 text-center text-gray-500 text-xs font-mono">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#C1121F] mb-1" />
                  <span>Polling audit records...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 flex flex-col" id="logs-history-scroller">
                  {logs.length === 0 ? (
                    <div className="py-10 text-center text-[10px] text-gray-600 font-mono">
                      No security audit matches localized indices.
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 bg-black/45 border border-gray-900 rounded text-[11px] font-mono leading-relaxed text-left space-y-1"
                      >
                        <div className="flex justify-between text-[8px] text-gray-550 border-b border-gray-900 pb-1 flex-wrap">
                          <span className="flex items-center gap-1 font-bold">
                            <Clock className="w-3 h-3 text-[#C1121F]" />
                            <span>{log.timestamp}</span>
                          </span>
                          <span className="text-[#C1121F] uppercase font-bold text-[8px]">{log.module}</span>
                        </div>
                        <div className="text-white font-medium text-[10px]">{log.action}</div>
                        <div className="text-[9px] text-[#C1121F] font-semibold uppercase">IDENTITY: {log.user}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            <div className="mt-4 border-t border-gray-850 pt-2 flex items-center justify-between text-[9px] font-mono text-gray-500 uppercase font-bold">
              <span>Auditable system telemetry</span>
              <span className="text-emerald-500">Node Sync Connected</span>
            </div>

          </div>

        </div>

      </div>

      {/* =======================================================
          MODAL SINK: PASSWORD RESET SUCCESS OUTPUT 
          ======================================================= */}
      <AnimatePresence>
        {resetCompletedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 text-left font-sans animate-fade-in" id="password-reset-success-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[#1e1e1e] border-2 border-[#C1121F]/30 rounded-lg p-5 space-y-4 shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-[#C1121F]/10 border border-[#C1121F]/20 rounded-full flex items-center justify-center text-[#C1121F] mx-auto animate-pulse">
                <Lock className="w-5 h-5" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">Passkey Credentials Cycled</h3>
                <p className="text-[11px] text-gray-400">
                  A forced terminal pass code update was successfully compiled for operative <strong className="text-white">{resetCompletedUser.name}</strong>.
                </p>
              </div>

              <div className="space-y-3 bg-black p-3 rounded-lg border border-gray-850">
                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase font-mono block">Simulated Dispatched Temp Passkey:</span>
                  <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-gray-850">
                    <span className="text-xs font-mono font-bold text-white tracking-widest">{resetCompletedPasskey}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetCompletedPasskey);
                        alert('Dispatched code copied to clipboard!');
                      }}
                      className="text-[9px] text-[#C1121F] uppercase font-mono hover:underline"
                    >
                      Copy code
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-gray-500 uppercase font-mono block">Encrypted Authorization Dispatch Link:</span>
                  <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-gray-850">
                    <span className="text-[9px] font-mono text-gray-400 truncate max-w-[280px]">{resetCompletedLink}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetCompletedLink);
                        alert('Encrypted token reset link copied to clipboard!');
                      }}
                      className="text-[9px] text-[#C1121F] uppercase font-mono hover:underline whitespace-nowrap"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-950/15 border border-[#C1121F]/30 rounded text-[10px] text-gray-300 font-mono leading-normal flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white uppercase text-[9px]">Administrative Directive Notice:</strong>
                  <p className="mt-0.5">
                    Share this bypass coordinate key with the operator via secured internal channels. The previous passkey coordinates have been invalidated on the SCADA server database tree.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetCompletedUser(null);
                  setResetCompletedPasskey('');
                  setResetCompletedLink('');
                }}
                className="w-full py-2 bg-[#C1121F] hover:bg-red-700 text-white font-mono font-bold text-xs uppercase rounded cursor-pointer transition-colors shadow-inner"
              >
                CLOSE SECURED OVERLAY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =======================================================
          MODAL SINK: DELETE ACCOUNT DOUBLE CONFIRMS
          ======================================================= */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 text-left font-sans animate-fade-in" id="account-delete-confirm-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md bg-[#1d1d1d] border border-[#C1121F]/40 rounded-lg p-5 space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center text-[#C1121F] mx-auto animate-bounce">
                <UserX className="w-5 h-5 animate-pulse" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-[#E63946] uppercase font-mono tracking-wider">De-authorization Directive</h3>
                <p className="text-xs text-gray-300 leading-normal font-medium">
                  You are preparing to completely de-authorize, delete, and invalidate team operator credentials profiles for <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.role}).
                </p>
              </div>

              <div className="space-y-1 bg-black p-3 border border-gray-850 rounded">
                <label className="text-[10px] text-gray-500 uppercase font-mono block">Type "confirm" to enforce de-registration:</label>
                <input
                  type="text"
                  placeholder="Type 'confirm' explicitly here..."
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-gray-850 rounded text-xs text-white uppercase tracking-wider text-center font-mono focus:outline-none focus:border-[#C1121F] placeholder:text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(null);
                    setDeleteConfirmationText('');
                  }}
                  className="w-full py-2 bg-[#1C1C1C] text-gray-400 font-bold uppercase rounded border border-gray-850 hover:bg-neutral-800 cursor-pointer"
                >
                  ABORT SESSION
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUserSubmit}
                  disabled={deleteConfirmationText.toLowerCase() !== 'confirm'}
                  className="w-full py-2 bg-[#C1121F] disabled:opacity-40 hover:bg-red-800 text-white font-bold uppercase rounded cursor-pointer transition-colors shadow-lg"
                >
                  DE-REGISTER OPERATOR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
