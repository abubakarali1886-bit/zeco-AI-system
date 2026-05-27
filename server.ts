/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { SUBSTATIONS, FEEDERS, TRANSFORMERS, ZANZIBAR_LOCATIONS, INITIAL_USERS, MOCKED_AUDIT_LOGS } from './src/data';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// CENTRAL MEMORY-DATABASE (CRUDS & DEFAULTS)
// ==========================================
let dbUsers = JSON.parse(JSON.stringify(INITIAL_USERS)).map((usr: any) => ({
  ...usr,
  password: 'password' // standard passkey for testing
}));

let dbAuditLogs = JSON.parse(JSON.stringify(MOCKED_AUDIT_LOGS));

// Lazy initialization of Supabase
let supabaseInstance: any = null;
let hasRlsError = false;

function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        supabaseInstance = createClient(url, key);
        console.log('Supabase client successfully initialized.');
      } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
      }
    }
  }
  return supabaseInstance;
}

// ==========================================
// SUPABASE SYNCRONIZATION / QUERY PIPELINE
// ==========================================
async function getDbUsers(): Promise<any[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('zeco_users').select('*');
      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          hasRlsError = true;
        }
        console.error('Supabase getDbUsers error:', error.message);
        return dbUsers;
      }
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          department: u.department,
          permissions: typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions,
          password: u.password || 'password'
        }));
      } else {
        console.log('Supabase zeco_users table is empty. Seeding defaults...');
        for (const u of dbUsers) {
          await sb.from('zeco_users').insert({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            department: u.department,
            permissions: JSON.stringify(u.permissions),
            password: u.password
          });
          
          try {
            await sb.auth.admin.createUser({
              email: u.email,
              password: u.password,
              email_confirm: true,
              user_metadata: { name: u.name, role: u.role }
            });
            console.log(`Seeded Auth credentials successfully for: ${u.email}`);
          } catch (authSeedErr: any) {
            console.warn(`Auth seed skipped or already registered for: ${u.email}`, authSeedErr.message);
          }
        }
        return dbUsers;
      }
    } catch (err: any) {
      if (err.message?.includes('row-level security') || err.message?.includes('RLS')) {
        hasRlsError = true;
      }
      console.error('Supabase query error, falling back to local DB:', err.message);
      return dbUsers;
    }
  }
  return dbUsers;
}

async function writeDbUser(user: any): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const dbFormat = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        permissions: JSON.stringify(user.permissions),
        password: user.password
      };
      const { error } = await sb.from('zeco_users').upsert(dbFormat);
      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          hasRlsError = true;
        }
        console.error('Supabase writeDbUser error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      if (e?.message?.includes('row-level security') || e?.message?.includes('RLS')) {
        hasRlsError = true;
      }
      console.error('Supabase write user anomaly:', e);
    }
  }
  return false;
}

async function deleteDbUser(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('zeco_users').delete().eq('id', id);
      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          hasRlsError = true;
        }
        console.error('Supabase deleteDbUser error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      if (e?.message?.includes('row-level security') || e?.message?.includes('RLS')) {
        hasRlsError = true;
      }
      console.error('Supabase delete user anomaly:', e);
    }
  }
  return false;
}

async function getDbAuditLogs(): Promise<any[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('zeco_audit_logs').select('*').order('timestamp', { ascending: false });
      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          hasRlsError = true;
        }
        console.error('Supabase getDbAuditLogs error:', error.message);
        return dbAuditLogs;
      }
      if (data && data.length > 0) {
        return data.map((log: any) => ({
          timestamp: log.timestamp,
          user: log.user,
          action: log.action,
          module: log.module
        }));
      } else {
        console.log('Supabase zeco_audit_logs table empty. Seeding defaults...');
        for (const log of dbAuditLogs) {
          await sb.from('zeco_audit_logs').insert({
            timestamp: log.timestamp,
            user: log.user,
            action: log.action,
            module: log.module
          });
        }
        return dbAuditLogs;
      }
    } catch (err: any) {
      if (err.message?.includes('row-level security') || err.message?.includes('RLS')) {
        hasRlsError = true;
      }
      console.error('Supabase logs query error, falling back to local logs:', err.message);
      return dbAuditLogs;
    }
  }
  return dbAuditLogs;
}

async function writeDbAuditLog(log: any): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('zeco_audit_logs').insert({
        timestamp: log.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: log.user,
        action: log.action,
        module: log.module
      });
      if (error) {
        if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          hasRlsError = true;
        }
        console.error('Supabase writeDbAuditLog error:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      if (e?.message?.includes('row-level security') || e?.message?.includes('RLS')) {
        hasRlsError = true;
      }
      console.error('Supabase write audit anomaly:', e);
    }
  }
  return false;
}

const app = express();
app.use(express.json({ limit: '50mb' }));
const PORT = 3000;

// Lazy initialization of GoogleGenAI
let isGeminiKeyLeaked = false;
let geminiLastErrorStr = '';

let aiInstance: GoogleGenAI | null = null;
function getAi() {
  if (isGeminiKeyLeaked) {
    return null;
  }
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiInstance;
}

function handleGeminiError(e: any, context: string) {
  const errStr = e?.message || (typeof e === 'string' ? e : JSON.stringify(e)) || '';
  if (errStr.includes('leaked') || errStr.includes('403') || errStr.includes('PERMISSION_DENIED')) {
    isGeminiKeyLeaked = true;
    geminiLastErrorStr = 'Your API key was reported as leaked by Google Cloud. Please issue and set a new API key in setting secrets.';
    console.warn(`[GEMINI SEVERE KEY ALARM] Gemini is disabled because the key was reported leaked / invalid during ${context}. Safe automatic fallback mode enabled.`);
  } else {
    geminiLastErrorStr = errStr;
    console.error(`Gemini connection issue during ${context}:`, errStr);
  }
}

// ==========================================
// PARSERS, ROLES & ENFORCEMENT UTILITIES
// ==========================================
async function parseAuthUser(req: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  if (token.startsWith('mock-jwt-token-')) {
    const key = token.replace('mock-jwt-token-', '');
    
    const users = await getDbUsers();
    // Find directly by ID
    let user = users.find((u: any) => u.id === key);
    
    // Fallbacks for pre-defined role templates
    if (!user) {
      if (key === 'superadmin' || key === 'usr-001') {
        user = users.find((u: any) => u.id === 'usr-001' || u.role === 'Super Admin');
      } else if (key === 'dataanalyst' || key === 'usr-002') {
        user = users.find((u: any) => u.id === 'usr-002' || u.role === 'Data Analyst');
      } else if (key === 'technicalstaff' || key === 'usr-003') {
        user = users.find((u: any) => u.id === 'usr-003' || u.role === 'Technical Staff');
      } else if (key === 'billingteam' || key === 'usr-004') {
        user = users.find((u: any) => u.id === 'usr-004' || u.role === 'Billing Team');
      }
    }
    return user || null;
  }
  return null;
}

async function enforcePermission(req: any, res: any, permission: string, callback: () => void) {
  const user = await parseAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Access token required. Please authenticate at the grid terminal.' });
  }

  const hasAccess = 
    user.role === 'Super Admin' || 
    user.permissions.includes('all_access') || 
    user.permissions.includes(permission);

  if (!hasAccess) {
    return res.status(403).json({
      error: `Access Denied: Operating Account '${user.name}' (${user.role}) lacks '${permission}' permission capability.`
    });
  }

  req.user = user;
  callback();
}

// ==========================================
// SECURITY & AUTH ENDPOINTS
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const sb = getSupabase();
  let user: any = null;
  let token: string = '';

  if (sb) {
    try {
      // 1. Attempt credentials sign-in using Supabase Auth (auth.users schema)
      const { data: authData, error: authError } = await sb.auth.signInWithPassword({
        email,
        password
      });

      if (!authError && authData?.user) {
        console.log('Supabase Auth verification direct success:', email);
        // Match the profile in zeco_users table
        const { data: profile } = await sb.from('zeco_users').select('*').eq('email', email).single();
        if (profile) {
          user = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
            department: profile.department,
            permissions: typeof profile.permissions === 'string' ? JSON.parse(profile.permissions) : profile.permissions
          };
        } else {
          // Fallback if the raw auth account exists but missing a zeco_users public profile
          user = {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.name || email.split('@')[0],
            role: authData.user.user_metadata?.role || 'Technical Staff',
            department: 'ZECO Grid Operations Command',
            permissions: ['read_access']
          };
          await writeDbUser(user);
        }
        token = authData.session?.access_token || `jwt-auth-${user.id}`;
      } else {
        console.log('User not validated in Supabase Auth directly. Checking seeded zeco_users table...');
        
        // 2. Direct database validation fallback in case user is seeded in the zeco_users table but not in auth yet
        const users = await getDbUsers();
        const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

        if (existingUser) {
          if (password === existingUser.password) {
            console.log('Password verified successfully in public.zeco_users. Auto-provisioning the user inside Supabase Auth...');
            user = existingUser;
            token = `jwt-auth-fallback-${user.id}`;

            // Fast-register the user in Supabase Auth to enable official Auth login next time
            try {
              const { error: signUpError } = await sb.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name: user.name, role: user.role }
              });
              if (signUpError) {
                console.log('Auto-provisioning Supabase Auth skipped (it might already exist):', signUpError.message);
                if (signUpError.message.includes('already registered') || signUpError.status === 422) {
                  // If the user already exists in auth, keep their password synced to the directory database state
                  const { data: listData } = await sb.auth.admin.listUsers();
                  const targetUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
                  if (targetUser) {
                    await sb.auth.admin.updateUserById(targetUser.id, { password });
                    console.log('Synchronized auth passkey to match table database passkey.');
                  }
                }
              } else {
                console.log('User successfully registered on-the-fly inside Supabase Auth:', email);
              }
            } catch (syncErr) {
              console.warn('Silent fallback signup skip:', syncErr);
            }
          } else {
            return res.status(401).json({ error: 'Invalid security pass phrase. Credentials verification failed.' });
          }
        } else {
          return res.status(401).json({ error: 'Access denied: Operative identity not registered in ZECO Personnel Directory.' });
        }
      }
    } catch (sbException: any) {
      console.error('Supabase authentication pipeline failure:', sbException.message);
    }
  }

  // Pure fallback if database has not resolved a user yet
  if (!user) {
    const users = await getDbUsers();
    const localUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!localUser) {
      return res.status(401).json({ error: 'Access denied: Operative identity not registered in ZECO Personnel Directory.' });
    }
    if (password !== localUser.password) {
      return res.status(401).json({ error: 'Invalid security pass phrase. Credentials verification failed.' });
    }
    user = localUser;
    token = `jwt-local-bypass-${localUser.id}`;
  }

  // Log logon success into centralized logs
  await writeDbAuditLog({
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user.name,
    action: `Operator authenticated session created (${user.role})`,
    module: 'Authentication'
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      permissions: user.permissions
    },
    token
  });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Operative email address is required.' });
  }

  const users = await getDbUsers();
  const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Operator email address not located in directory registries.' });
  }

  // Set randomized secure temp token
  const tempPass = 'zeco-temp-' + Math.random().toString(36).substring(2, 7);
  user.password = tempPass;
  await writeDbUser(user);

  await writeDbAuditLog({
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user.name,
    action: `Initiated self-service password bypass credentials reset`,
    module: 'Authentication'
  });

  return res.json({
    success: true,
    message: `Secure terminal passphrase bypass instructions dispatched route trace for ${user.email}.`,
    tempPassword: tempPass
  });
});

// ==========================================
// ACTIVE SECURE USER CRUD & PERMISSION APIs
// ==========================================

// GET /api/users - Fetch active directory, secure to user_management
app.get('/api/users', async (req, res) => {
  await enforcePermission(req, res, 'user_management', async () => {
    const users = await getDbUsers();
    // Return sanitized users list (do not send real passwords in standard listing for compliance)
    const sanitized = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      department: u.department,
      permissions: u.permissions
    }));
    return res.json({ users: sanitized });
  });
});

// POST /api/users - Create new team operative credentials
app.post('/api/users', async (req, res) => {
  await enforcePermission(req, res, 'user_management', async () => {
    const { name, email, role, department, permissions, customPassword } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required properties.' });
    }

    const users = await getDbUsers();
    const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'Operative with this email already registered in ZECO system.' });
    }

    const defaultPerms = ['read_access'];
    let assignedPerms = permissions || defaultPerms;
    if (!permissions) {
      if (role === 'Super Admin') {
        assignedPerms = ['all_access', 'ai_control', 'user_management', 'database_rw', 'generate_reports'];
      } else if (role === 'Data Analyst') {
        assignedPerms = ['upload_datasets', 'analytics_read', 'forecast_run', 'generate_reports'];
      } else if (role === 'Technical Staff') {
        assignedPerms = ['view_grids', 'outage_prediction_access', 'transformer_remedial', 'maintenance_control'];
      } else if (role === 'Billing Team') {
        assignedPerms = ['billing_prediction_access', 'theft_investigate', 'customer_consumption_view'];
      }
    }

    const newUsr = {
      id: `usr-00${users.length + 1}_${Math.random().toString(36).substring(2, 5)}`,
      name,
      email,
      role,
      department: department || (role === 'Billing Team' ? 'ZECO Revenue Protection' : role === 'Data Analyst' ? 'ZECO Planning & Analytics' : 'Unguja Grid Maintenance'),
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&q=80&w=200`,
      permissions: assignedPerms,
      password: customPassword || 'password'
    };

    dbUsers.push(newUsr);
    await writeDbUser(newUsr);

    // Dynamic Supabase Auth provisioning
    const sb = getSupabase();
    if (sb) {
      try {
        const { error: authErr } = await sb.auth.admin.createUser({
          email,
          password: customPassword || 'password',
          email_confirm: true,
          user_metadata: { name, role }
        });
        if (authErr) {
          console.warn('Manual user creation did not register in Supabase Auth (already exists or no privilege):', authErr.message);
        } else {
          console.log(`Successfully registered user ${email} in Supabase Auth schema during creation.`);
        }
      } catch (authErr: any) {
        console.error('Error during automatic Supabase Auth provisioning:', authErr.message);
      }
    }

    // Audit Log entry
    await writeDbAuditLog({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: (req as any).user.name,
      action: `Created team credential operative: ${name} as ${role}`,
      module: 'Identity Management'
    });

    return res.status(201).json({
      success: true,
      user: {
        id: newUsr.id,
        name: newUsr.name,
        email: newUsr.email,
        role: newUsr.role,
        department: newUsr.department,
        avatar: newUsr.avatar,
        permissions: newUsr.permissions
      }
    });
  });
});

// PUT /api/users/:id - Update operative roles and clearance permissions
app.put('/api/users/:id', async (req, res) => {
  await enforcePermission(req, res, 'user_management', async () => {
    const { id } = req.params;
    const { name, email, role, department, permissions } = req.body;

    const users = await getDbUsers();
    const usr = users.find((u: any) => u.id === id);
    if (!usr) {
      return res.status(404).json({ error: 'Operative account not found' });
    }

    // Capture values
    if (name) usr.name = name;
    if (email) usr.email = email;
    if (role) {
      usr.role = role;
      // Auto upgrade basic permission structure corresponding to roles if permissions not explicitly modified in tree
      if (!permissions) {
        if (role === 'Super Admin') {
          usr.permissions = ['all_access', 'ai_control', 'user_management', 'database_rw', 'generate_reports'];
        } else if (role === 'Data Analyst') {
          usr.permissions = ['upload_datasets', 'analytics_read', 'forecast_run', 'generate_reports'];
        } else if (role === 'Technical Staff') {
          usr.permissions = ['view_grids', 'outage_prediction_access', 'transformer_remedial', 'maintenance_control'];
        } else if (role === 'Billing Team') {
          usr.permissions = ['billing_prediction_access', 'theft_investigate', 'customer_consumption_view'];
        }
      }
    }
    if (department) usr.department = department;
    if (permissions) usr.permissions = permissions;

    const lIdx = dbUsers.findIndex((u: any) => u.id === id);
    if (lIdx !== -1) {
      dbUsers[lIdx] = usr;
    }
    await writeDbUser(usr);

    // Synchronize to Supabase Auth
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: listData } = await sb.auth.admin.listUsers();
        const targetUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === usr.email.toLowerCase());
        if (targetUser) {
          const { error: updErr } = await sb.auth.admin.updateUserById(targetUser.id, {
            email: usr.email,
            user_metadata: { name: usr.name, role: usr.role }
          });
          if (updErr) {
            console.warn('Failed to update metadata in Supabase Auth backend:', updErr.message);
          } else {
            console.log('Successfully synchronized updated profile to Supabase Auth scheme.');
          }
        }
      } catch (authUpdErr: any) {
        console.error('Error synchronizing profile details to Supabase Auth:', authUpdErr.message);
      }
    }

    // Log update audit trail
    await writeDbAuditLog({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: (req as any).user.name,
      action: `Updated credentials parameters for operative ${usr.name} (${usr.role})`,
      module: 'Identity Management'
    });

    return res.json({
      success: true,
      user: {
        id: usr.id,
        name: usr.name,
        email: usr.email,
        role: usr.role,
        department: usr.department,
        avatar: usr.avatar,
        permissions: usr.permissions
      }
    });
  });
});

// POST /api/users/:id/reset - Super Admin forced passkey reset trigger
app.post('/api/users/:id/reset-password', async (req, res) => {
  await enforcePermission(req, res, 'user_management', async () => {
    const { id } = req.params;
    const { customPassword } = req.body;

    const users = await getDbUsers();
    const usr = users.find((u: any) => u.id === id);
    if (!usr) {
      return res.status(404).json({ error: 'Operative account not located.' });
    }

    const tempCode = customPassword || 'zecotext-' + Math.floor(100000 + Math.random() * 900000);
    usr.password = tempCode;

    const lIdx = dbUsers.findIndex((u: any) => u.id === id);
    if (lIdx !== -1) {
      dbUsers[lIdx].password = tempCode;
    }
    await writeDbUser(usr);

    // Synchronize password to Supabase Auth
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: listData } = await sb.auth.admin.listUsers();
        const targetUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === usr.email.toLowerCase());
        if (targetUser) {
          const { error: updErr } = await sb.auth.admin.updateUserById(targetUser.id, {
            password: tempCode
          });
          if (updErr) {
            console.warn('Failed to update password in Supabase Auth:', updErr.message);
          } else {
            console.log('Successfully synchronized passkey reset to Supabase Auth.');
          }
        }
      } catch (authResetErr: any) {
        console.error('Error synchronizing password update to Supabase Auth:', authResetErr.message);
      }
    }

    await writeDbAuditLog({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: (req as any).user.name,
      action: `Forced security passkey cycle reset on user ${usr.name}`,
      module: 'Identity Management'
    });

    return res.json({
      success: true,
      message: `Forced passkey reset complete for operative ${usr.name}.`,
      tempPasskey: tempCode,
      resetLink: `https://ais-pre-qfj6nssbrfka4u5hbmqoxb-486143428368.europe-west1.run.app/reset-confirm?token=zeco_reset_sig_${usr.id}_${Math.random().toString(36).substring(2,6)}`
    });
  });
});

// DELETE /api/users/:id - De-register operator completely (Super Admin exclusive)
app.delete('/api/users/:id', async (req, res) => {
  await enforcePermission(req, res, 'user_management', async () => {
    const { id } = req.params;
    
    // Prevent self clearance deletion
    if (id === (req as any).user.id) {
      return res.status(400).json({ error: 'De-authorization violation: Super Admin cannot self-delete active session.' });
    }

    const users = await getDbUsers();
    const usr = users.find((u: any) => u.id === id);
    if (!usr) {
      return res.status(404).json({ error: 'Operative account record not found.' });
    }

    const removedName = usr.name;
    const removedRole = usr.role;
    
    const lIdx = dbUsers.findIndex((u: any) => u.id === id);
    if (lIdx !== -1) {
      dbUsers.splice(lIdx, 1);
    }
    await deleteDbUser(id);

    // Synchronize deletion to Supabase Auth
    const sb = getSupabase();
    if (sb) {
      try {
        const { data: listData } = await sb.auth.admin.listUsers();
        const targetUser = listData?.users?.find((u: any) => u.email?.toLowerCase() === usr.email.toLowerCase());
        if (targetUser) {
          const { error: delErr } = await sb.auth.admin.deleteUser(targetUser.id);
          if (delErr) {
            console.warn('Failed to delete user in Supabase Auth:', delErr.message);
          } else {
            console.log('Successfully de-authorized user in Supabase Auth schema.');
          }
        }
      } catch (authDelErr: any) {
        console.error('Error synchronizing user deletion to Supabase Auth:', authDelErr.message);
      }
    }

    await writeDbAuditLog({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: (req as any).user.name,
      action: `DELETED OPERATIVE ACCOUNT: ${removedName} (Former ${removedRole})`,
      module: 'Identity Management'
    });

    return res.json({
      success: true,
      message: `Successfully de-authorized and deleted operative account ${removedName}.`
    });
  });
});

// GET /api/audit-logs - Query audit history, supports filtering
app.get('/api/audit-logs', async (req, res) => {
  const user = await parseAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated.' });
  }

  const { search, module_filter } = req.query;
  const auditLogs = await getDbAuditLogs();
  let filtered = [...auditLogs];

  if (module_filter && module_filter !== 'All') {
    filtered = filtered.filter((log: any) => log.module.toLowerCase() === String(module_filter).toLowerCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter((log: any) => 
      log.user.toLowerCase().includes(q) || 
      log.action.toLowerCase().includes(q) || 
      log.module.toLowerCase().includes(q)
    );
  }

  return res.json({ logs: filtered });
});

// POST /api/audit-logs - Log custom manual activities (all authentics can log)
app.post('/api/audit-logs', async (req, res) => {
  const user = await parseAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const { action, module } = req.body;
  if (!action || !module) {
    return res.status(400).json({ error: 'Action and module attributes needed.' });
  }

  const newLog = {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    user: user.name,
    action,
    module
  };

  dbAuditLogs.unshift(newLog);
  await writeDbAuditLog(newLog);
  return res.status(201).json({ success: true, log: newLog });
});

// GET /api/supabase/status - Query Supabase credentials & table state
app.get('/api/supabase/status', async (req, res) => {
  const isConfigured = !!process.env.SUPABASE_URL && (!!process.env.SUPABASE_ANON_KEY || !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  if (!isConfigured) {
    return res.json({
      configured: false,
      url: null,
      error: 'SUPABASE_URL and SUPABASE_ANON_KEY environment variables are not set in setting Secrets.',
      usersCount: 0,
      logsCount: 0
    });
  }

  const sb = getSupabase();
  if (!sb) {
    return res.json({
      configured: false,
      url: process.env.SUPABASE_URL,
      error: 'Supabase client failed to initialize with provided config.',
      usersCount: 0,
      logsCount: 0
    });
  }

  try {
    // Check tables. In case table missing or error, return informative message to help user create tables
    const { count: usersCount, error: usersErr } = await sb.from('zeco_users').select('*', { count: 'exact', head: true });
    const { count: logsCount, error: logsErr } = await sb.from('zeco_audit_logs').select('*', { count: 'exact', head: true });
    
    let isRlsError = hasRlsError;
    let errorMsg = '';
    if (usersErr) {
      errorMsg = usersErr.message;
      if (usersErr.message.includes('row-level security') || usersErr.message.includes('RLS') || usersErr.message.includes('policy')) {
        isRlsError = true;
      }
    }
    if (logsErr) {
      errorMsg = logsErr.message;
      if (logsErr.message.includes('row-level security') || logsErr.message.includes('RLS') || logsErr.message.includes('policy')) {
        isRlsError = true;
      }
    }

    if (usersErr || logsErr || isRlsError) {
      let friendlyError = '';
      if (isRlsError) {
        friendlyError = `Row-Level Security (RLS) is active on your Supabase tables and blocking write operations. To fix this, copy the SQL Schema script below, open your Supabase SQL Editor dashboard, run the SQL script to disable policy checks, and then click Refresh.`;
      } else {
        friendlyError = `Supabase database tables are not setup. Please ensure you create tables 'zeco_users' and 'zeco_audit_logs' in Supabase SQL Editor. Error details: ${errorMsg}`;
      }

      return res.json({
        configured: true,
        url: process.env.SUPABASE_URL,
        error: friendlyError,
        isRlsError: true,
        usersCount: 0,
        logsCount: 0
      });
    }

    return res.json({
      configured: true,
      url: process.env.SUPABASE_URL,
      error: null,
      isRlsError: false,
      usersCount: usersCount || 0,
      logsCount: logsCount || 0
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      url: process.env.SUPABASE_URL,
      error: `Network warning: Unable to pull table schema stats (${err.message})`,
      isRlsError: false,
      usersCount: 0,
      logsCount: 0
    });
  }
});

// GET /api/gemini/status - Check Gemini AI service and API key diagnostics
app.get('/api/gemini/status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  return res.json({
    configured: hasKey,
    leaked: isGeminiKeyLeaked,
    error: isGeminiKeyLeaked ? (geminiLastErrorStr || 'Your API key was flagged as leaked by Google Cloud.') : geminiLastErrorStr,
    fallbackActive: !hasKey || isGeminiKeyLeaked
  });
});

// ==========================================
// OUTAGE PREDICTION PIPELINE (XGBoost Simulated / LLM Enriched)
// ==========================================
app.post('/api/predict/outage', (req, res) => {
  enforcePermission(req, res, 'outage_prediction_access', async () => {
    const { transformerId } = req.body;
    const tx = TRANSFORMERS.find(t => t.id === transformerId) || TRANSFORMERS[0];
    
    // Logical hazard calculation
    let probability = Math.round(tx.loadPercentage * 0.7 + tx.ageYears * 1.5 + (tx.oilLevelOk ? 0 : 20));
    if (tx.status === 'Failed') probability = 100;
    if (probability > 99) probability = 98; // keep active risk levels for preview

    let riskLevel = 'Low';
    if (probability >= 85) riskLevel = 'Critical';
    else if (probability >= 65) riskLevel = 'High';
    else if (probability >= 40) riskLevel = 'Medium';

    const factors = [];
    if (tx.loadPercentage > 85) factors.push(`Overload running at ${tx.loadPercentage}% capacity`);
    if (tx.oilTempCelsius > 80) factors.push(`Elevated core oil temperature (${tx.oilTempCelsius}°C)`);
    if (!tx.oilLevelOk) factors.push('Low transformer oil isolation level flagged');
    if (tx.ageYears > 15) factors.push(`Transformer thermal aging asset boundary model exceeded (${tx.ageYears} yrs)`);
    if (factors.length === 0) factors.push('Mild operational grid load fluctuations');

    let recommendedAction = 'Continue automated Scada load monitoring.';
    if (riskLevel === 'Critical' || riskLevel === 'High') {
      recommendedAction = 'Dispatch maintenance unit immediately to cool substation oil containment and adjust low-side feeder loads.';
    } else if (riskLevel === 'Medium') {
      recommendedAction = 'Schedule load-cleansing filtration tap adjustment within the next 48 hours.';
    }

    const ai = getAi();
    if (ai) {
      try {
        const prompt = `You are ZECO's AI SCADA grid prediction engine. Analyze this active transformer telemetry for outage forecasting:
        Transformer: ${tx.name}
        Location: ${tx.locationName}
        Rating: ${tx.kVA} kVA
        Current Load: ${tx.loadPercentage}% 
        Oil Temperature: ${tx.oilTempCelsius}°C
        Oil Level: ${tx.oilLevelOk ? 'Adequate' : 'CRITICAL LOW LEVEL'}
        Asset Age: ${tx.ageYears} years
        Status: ${tx.status}

        Provide a high-fidelity brief analysis of failure root cause probability and a precise enterprise-level resolution for Unguja/Pemba regional engineers in 2-3 sentences. Return it in JSON format conforming to schema.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                analysis: { type: Type.STRING, description: 'Failure analysis prediction description.' },
                resolution: { type: Type.STRING, description: 'Direct field operational engineering instructions.' }
              },
              required: ['analysis', 'resolution']
            }
          }
        });
        
        const details = JSON.parse(response.text || '{}');
        if (details.analysis && details.resolution) {
          return res.json({
            transformerId: tx.id,
            transformerName: tx.name,
            locationName: tx.locationName,
            probability,
            riskLevel,
            factors,
            recommendedAction: `${details.analysis} Action Required: ${details.resolution}`
          });
        }
      } catch (e) {
        handleGeminiError(e, 'outage forecasting analytics');
      }
    }

    return res.json({
      transformerId: tx.id,
      transformerName: tx.name,
      locationName: tx.locationName,
      probability,
      riskLevel,
      factors,
      recommendedAction
    });
  });
});

// ==========================================
// POWER DEMAND PREDICTION PIPELINE (LSTM Simulation)
// ==========================================
app.post('/api/predict/demand', (req, res) => {
  enforcePermission(req, res, 'forecast_run', () => {
    const { locationId, periodDays = 7 } = req.body;
    const loc = ZANZIBAR_LOCATIONS.find(l => l.id === locationId) || ZANZIBAR_LOCATIONS[0];
    
    const baseValue = loc.baseDemandMW;
    const predictions = [];
    
    for (let i = 0; i < periodDays * 24; i += 4) {
      const date = new Date();
      date.setHours(date.getHours() + i);
      const hour = date.getHours();
      
      // Calculate realistic demand curve with diurnal peak at 19:00 (7 PM Zanzibar tourism rush)
      let timeFactor = 1.0;
      if (hour >= 18 && hour <= 21) timeFactor = 1.45; // early evening peak
      else if (hour >= 11 && hour <= 15) timeFactor = 1.25; // midday aircon peak
      else if (hour >= 2 && hour <= 5) timeFactor = 0.55; // overnight minimum
      
      // Add weather / temperature simulation (warmer days have aircon demand)
      const tempInZanzibar = 29 + Math.sin(i / 12) * 3;
      const tempFactor = 1.0 + (tempInZanzibar - 29) * 0.04;

      const noise = (Math.sin(i * 0.45) * 0.05) + (Math.cos(i * 1.2) * 0.03);
      const predictedVal = parseFloat((baseValue * timeFactor * tempFactor * (1 + noise)).toFixed(2));
      const historicalVal = parseFloat((baseValue * timeFactor * (1 + (Math.cos(i * 0.2) * 0.06))).toFixed(2));
      const overloadPerc = Math.round(Math.max(0, Math.min(100, (predictedVal / (baseValue * 1.25)) * 100)));

      predictions.push({
        timestamp: date.toISOString(),
        hour,
        predictedDemandMW: predictedVal,
        capacityAvailableMW: parseFloat((baseValue * 1.5).toFixed(1)),
        historicalDemandMW: historicalVal,
        overloadRiskPercentage: overloadPerc
      });
    }

    return res.json({
      locationName: loc.name,
      region: loc.region,
      baseMW: loc.baseDemandMW,
      predictions
    });
  });
});

// ==========================================
// ELECTRICITY THEFT DEVIATION DETECTOR (Isolation Forest Simulation)
// ==========================================
app.post('/api/predict/theft', (req, res) => {
  enforcePermission(req, res, 'theft_investigate', () => {
    const { locationId } = req.body;
    const loc = ZANZIBAR_LOCATIONS.find(l => l.id === locationId) || ZANZIBAR_LOCATIONS[0];
    
    // Custom list of anomalies optimized for Stone Town, Nungwi, Mwera, Matemwe, etc.
    const sampleThefts = [
      { customerId: 'CUST-0941', customerName: 'Island Palm Iceplant Ltd.', meterId: 'M-ST-9942', rawUsage: [450, 480, 420, 20, 15, 10, 12, 490], status: 'Suspected', anomalyPattern: 'Violent multi-day supply dropdown while ice production is active' },
      { customerId: 'CUST-2022', customerName: 'Mtoni Woodmill Workshop', meterId: 'M-NW-2022', rawUsage: [310, 305, 320, 301, 80, 75, 78, 81], status: 'Suspected', anomalyPattern: 'Phase-bypassing signature detected during midnight operating hours' },
      { customerId: 'CUST-1194', customerName: 'Fumba Cove Lodges Complex', meterId: 'M-FU-1194', rawUsage: [950, 930, 960, 12, 10, 14, 980, 940], status: 'Investigating', anomalyPattern: 'SCADA discrepancy showing power intake with bypassed local telemetry meter' },
      { customerId: 'CUST-5012', customerName: 'Nungwi Center Retail Complex', meterId: 'M-NU-5012', rawUsage: [120, 115, 125, 130, 3, 2, 4, 118], status: 'Confirmed', anomalyPattern: 'Underground main tap bypass verified by local patrol line inspection' },
      { customerId: 'CUST-1772', customerName: 'Matemwe Coral View Guesthouse', meterId: 'M-MA-1772', rawUsage: [240, 235, 250, 245, 15, 10, 8, 248], status: 'Suspected', anomalyPattern: 'Current imbalance pattern indicating neutral wire disconnect cheat' }
    ];

    const filtered = sampleThefts.map((t, idx) => {
      // Make theft score match ZanzibarLocation theft index loosely
      const lossMultiplier = (loc.theftIndex / 50);
      const computedLoss = Math.round((idx + 1) * 140 * lossMultiplier);
      const theftScore = Math.round(Math.min(98, Math.max(20, (t.rawUsage[0] - t.rawUsage[4]) / t.rawUsage[0] * 100 + loc.theftIndex * 0.15)));
      
      return {
        id: `thf-00${idx + 1}`,
        customerId: t.customerId,
        customerName: t.customerName,
        locationName: loc.name,
        theftScore,
        anomalyPattern: t.anomalyPattern,
        meterId: t.meterId,
        reportedLossKWh: computedLoss,
        status: t.status as any
      };
    });

    return res.json({
      locationName: loc.name,
      theftHotspotRank: loc.theftIndex > 60 ? 'HIGH HAZARD' : 'MODERATE',
      activeCasesModelCount: filtered.length,
      cases: filtered
    });
  });
});

// ==========================================
// BILLING & UNIT DEPLETION FORECASTER
// ==========================================
app.post('/api/predict/billing', (req, res) => {
  enforcePermission(req, res, 'billing_prediction_access', () => {
    const { customerKWh = 450 } = req.body;
    
    // Predict forward consumption
    const predictedKWh = Math.round(customerKWh * 1.15); // season temperature modifier
    const currentBillUSD = parseFloat((customerKWh * 0.18).toFixed(2)); // rate is $0.18 per kWh
    const predictedBillUSD = parseFloat((predictedKWh * 0.18).toFixed(2));
    
    // Simulate continuous units drop-off
    const daysDepletion = Math.max(1, Math.round(150 / (customerKWh / 30)));
    const spikeRisk = customerKWh > 600 ? 'High' : customerKWh > 300 ? 'Medium' : 'Low';

    return res.json({
      currentMonthlyKWh: customerKWh,
      predictedKWh,
      currentBillUSD,
      predictedBillUSD,
      unitExhaustionDays: daysDepletion,
      spikeRisk
    });
  });
});

// ==========================================
// INTELLIGENT DATA DESTRUCTURING & SCANNING ENGINE
// ==========================================
app.post('/api/upload-dataset', (req, res) => {
  enforcePermission(req, res, 'upload_datasets', async () => {
    const { fileName, fileContentJson } = req.body;
    if (!fileName || !fileContentJson || !Array.isArray(fileContentJson) || fileContentJson.length === 0) {
      return res.status(400).json({ error: 'Valid fileName and spreadsheet file arrays are required.' });
    }

    const sampleRow = fileContentJson[0];
    const columns = Object.keys(sampleRow);
    
    // Automatically identify locations and metrics in rows
    const locationsFound: string[] = [];
    let detectedMetric = 'Energy Consumption (KWh)';
    let cleanPercentage = 100;

    fileContentJson.forEach((row: any) => {
      Object.values(row).forEach((v: any) => {
        if (typeof v === 'string') {
          const standardLoc = ZANZIBAR_LOCATIONS.find(l => l.name.toLowerCase() === v.toLowerCase());
          if (standardLoc && !locationsFound.includes(standardLoc.name)) {
            locationsFound.push(standardLoc.name);
          }
        }
      });
    });

    // Look for metric headers
    columns.forEach(col => {
      const cLower = col.toLowerCase();
      if (cLower.includes('volt') || cLower.includes('v_')) {
        detectedMetric = 'Voltage Levels (KV)';
      } else if (cLower.includes('outage') || cLower.includes('fail') || cLower.includes('trip')) {
        detectedMetric = 'Outage Counts';
      } else if (cLower.includes('theft') || cLower.includes('loss') || cLower.includes('leak')) {
        detectedMetric = 'Technical losses / Anomaly Indices';
      } else if (cLower.includes('bill') || cLower.includes('tzs') || cLower.includes('cost')) {
        detectedMetric = 'Customer billing usage profiles';
      }
    });

    // Simulate column data sanitization
    if (columns.length > 1) {
      cleanPercentage = 94; // simulate missing field correction
    }

    const ai = getAi();
    if (ai && locationsFound.length > 0) {
      try {
        const prompt = `You are the core AI dataset parser of the Zeco AI Grid Command.
        We have processed an uploaded spreadsheet: "${fileName}".
        Detected Columns: ${columns.join(', ')}
        Matching Zanzibar Grid Locations: ${locationsFound.join(', ')}
        Matching Core Metric: ${detectedMetric}
        
        Provide a highly creative 3-sentence summary describing what operational insights (weather, grid load, tourism impact) this specific dataset brings to Zanzibar's grid performance, and name the AI cleaning/prediction model that should process this data further. Conform strictly to JSON schema returned.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                insight: { type: Type.STRING, description: 'Insights and prediction recommendation.' },
                algorithmSuggested: { type: Type.STRING, description: 'AI architecture name to train.' }
              },
              required: ['insight', 'algorithmSuggested']
            }
          }
        });

        const details = JSON.parse(response.text || '{}');
        if (details.insight) {
          return res.json({
            status: 'Ready',
            columns,
            detectedLocations: locationsFound.length > 0 ? locationsFound : ['Stone Town', 'Nungwi'],
            detectedMetric,
            cleanSuccessRate: cleanPercentage,
            predictionsCount: fileContentJson.length * 3,
            aiInsightSummary: `${details.insight} Suggested Model Pipeline: ${details.algorithmSuggested}`
          });
        }
      } catch (e) {
        handleGeminiError(e, 'dataset upload scanning');
      }
    }

    // Local fallback response
    return res.json({
      status: 'Ready',
      columns,
      detectedLocations: locationsFound.length > 0 ? locationsFound : ['Stone Town', 'Nungwi'],
      detectedMetric,
      cleanSuccessRate: cleanPercentage,
      predictionsCount: fileContentJson.length * 2,
      aiInsightSummary: `Fully structured and normalized dataset aligned with ZECO grid registries. Locations identified: ${locationsFound.length > 0 ? locationsFound.join(', ') : 'Zanzibar urban centers'}. System suggests XGBoost regression scaling for demand forecasts.`
    });
  });
});

// ==========================================
// ZECO GRAND EXECUTIVE GRID REPORT AGENT
// ==========================================
app.post('/api/ai/report', (req, res) => {
  enforcePermission(req, res, 'generate_reports', async () => {
    const { reportType = 'outage', parameters = {} } = req.body;
    const ai = getAi();
    
    const dateStr = new Date().toISOString().split('T')[0];

    if (ai) {
      try {
        const prompt = `You are the Chief AI Grid Analyst for the Zanzibar Electricity Corporation (ZECO).
        Generate a professional, fully detailed, executive-level technical operation report on Zanzibar Grid Operational Condition.
        Report Theme: ${reportType.toUpperCase()}
        Generation Date: ${dateStr}
        Grid Metadata:
          - Critical substation: Mtoni Grand (Load: 41.5MW, capacity: 60MVA, overloaded)
          - Heavy Outage Area: Mwera (Transformer TX-02 failed, Oil thermal overload)
          - Active customers monitored: Over 55,000 across Unguja & Pemba
          - Main Technical Loss Issue: Neutral cheat in Nungwi hotels & phase bypasses in Matemwe

        Format the entire report in beautiful, well-spaced, production-grade Markdown with clean headers, structured bullet points, and an official ZECO tactical action blueprint for the board. Ensure no placeholders are used. Output Markdown directly.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });

        return res.json({
          success: true,
          reportMarkdown: response.text,
          generatedAt: dateStr,
          author: 'ZECO AI Intelligence Specialist Unit'
        });

      } catch (e) {
        handleGeminiError(e, 'executive grid report generation');
      }
    }

    // Fallback beautiful markdown report
    const fallbackMarkdown = `# ZANZIBAR ELECTRICITY CORPORATION (ZECO)
## GRID INTELLIGENCE & INFRASTRUCTURE REPORT — INTEGRATED AI ASSESSMENT

**Report Type:** Grid Reliability & Predictive Vulnerability Audit
**Generated At:** ${dateStr}
**Author:** Zeco AI Intelligence Specialist Unit
**Classification:** RESTRICTED - INTERNAL ENGINEERING USE ONLY

### 1. EXECUTIVE GRID OVERVIEW
Following the seasonal thermal fluctuations across Unguja and Pemba islands, real-time telemetry inputs indicate localized distribution stress. Peak demand pressures concentrate near tourism complexes in **Nungwi Beach** and deep commercial hubs of the **Mtoni Grand Substation** boundary area.

---

### 2. DETAILED MODULE INVESTIGATION
#### A. Outage Predictive Forecast
- **Mtoni Substation Feeder F4 (Mwera Link):** System modeling displays an active trip profile. The regional **Mwera School TX-02** transformer asset shows rapid thermal degradation.
- **Action Directed:** Schedule immediate load shift balancing and thermal oil refit.

#### B. Revenue Protection & Theft Metrics
- **Hotspot Alert:** High loss ratio identified within coastal zones. Meter bypass signatures correlate with night-shift heavy chilling systems and resort expansion grids.
- **Action Directed:** Dispatch night patrol auditing with smart telemetry bypass checks.

---

### 3. TACTICAL GRID BLUEPRINT FOR ZECO LEADERSHIP
1. **Critical Refitting:** Transition historic substation relays in Stone Town and Mtoni to solid-state digital controllers.
2. **Tourism Corridor Ring:** Construct a dedicated 33KV backup loop connecting Kendwa, Nungwi, and Matemwe of Unguja North to reduce blackout thresholds.
3. **Decentralized Solar Integration:** Prepare auxiliary solar feeder interfaces at Fumba Smart City to offset thermal peak overheads during tourism months.
`;

    return res.json({
      success: true,
      reportMarkdown: fallbackMarkdown,
      generatedAt: dateStr,
      author: 'ZECO Core Rules engine fallback'
    });
  });
});

// Serve frontend build static files in production / use vite in dev
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZECO AI platform running securely on port ${PORT}`);
  });
}

startServer();
