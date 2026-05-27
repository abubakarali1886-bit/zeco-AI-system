/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZanzibarLocation, Substation, Feeder, Transformer, User } from './types';

export const ZANZIBAR_LOCATIONS: ZanzibarLocation[] = [
  // Unguja North
  { id: 'loc-nungwi', name: 'Nungwi', region: 'Unguja North', lat: -5.72, lng: 39.30, baseDemandMW: 12.5, activeCustomers: 4200, outageRiskScore: 78, theftIndex: 45 },
  { id: 'loc-kendwa', name: 'Kendwa', region: 'Unguja North', lat: -5.75, lng: 39.29, baseDemandMW: 8.2, activeCustomers: 2500, outageRiskScore: 64, theftIndex: 30 },
  { id: 'loc-matemwe', name: 'Matemwe', region: 'Unguja North', lat: -5.87, lng: 39.35, baseDemandMW: 5.4, activeCustomers: 1800, outageRiskScore: 55, theftIndex: 68 },
  { id: 'loc-kiwengwa', name: 'Kiwengwa', region: 'Unguja North', lat: -5.99, lng: 39.38, baseDemandMW: 9.8, activeCustomers: 3100, outageRiskScore: 48, theftIndex: 25 },
  
  // Unguja Urban West / Stone Town
  { id: 'loc-stonetown', name: 'Stone Town', region: 'Unguja Urban West', lat: -6.16, lng: 39.20, baseDemandMW: 24.5, activeCustomers: 12500, outageRiskScore: 42, theftIndex: 18 },
  { id: 'loc-mtoni', name: 'Mtoni', region: 'Unguja Urban West', lat: -6.13, lng: 39.21, baseDemandMW: 18.0, activeCustomers: 8900, outageRiskScore: 82, theftIndex: 58 },
  { id: 'loc-mwera', name: 'Mwera', region: 'Unguja Urban West', lat: -6.14, lng: 39.26, baseDemandMW: 14.2, activeCustomers: 7400, outageRiskScore: 69, theftIndex: 72 },
  { id: 'loc-fumba', name: 'Fumba', region: 'Unguja South', lat: -6.31, lng: 39.22, baseDemandMW: 16.5, activeCustomers: 5900, outageRiskScore: 35, theftIndex: 12 },
  
  // Unguja South / East Coast
  { id: 'loc-paje', name: 'Paje', region: 'Unguja South', lat: -6.26, lng: 39.54, baseDemandMW: 11.2, activeCustomers: 3800, outageRiskScore: 61, theftIndex: 35 },
  { id: 'loc-jambiani', name: 'Jambiani', region: 'Unguja South', lat: -6.31, lng: 39.54, baseDemandMW: 7.9, activeCustomers: 2900, outageRiskScore: 50, theftIndex: 40 },
  { id: 'loc-kizimkazi', name: 'Kizimkazi', region: 'Unguja South', lat: -6.44, lng: 39.46, baseDemandMW: 4.1, activeCustomers: 1300, outageRiskScore: 38, theftIndex: 15 },
  { id: 'loc-makunduchi', name: 'Makunduchi', region: 'Unguja South', lat: -6.40, lng: 39.55, baseDemandMW: 6.8, activeCustomers: 2200, outageRiskScore: 52, theftIndex: 48 },
  
  // Pemba North
  { id: 'loc-wete', name: 'Wete (Pemba)', region: 'Pemba North', lat: -5.06, lng: 39.72, baseDemandMW: 8.5, activeCustomers: 3400, outageRiskScore: 68, theftIndex: 28 },
  
  // Pemba South
  { id: 'loc-chakechake', name: 'Chake Chake (Pemba)', region: 'Pemba South', lat: -5.24, lng: 39.76, baseDemandMW: 11.8, activeCustomers: 5200, outageRiskScore: 70, theftIndex: 32 },
  { id: 'loc-mkoani', name: 'Mkoani (Pemba)', region: 'Pemba South', lat: -5.36, lng: 39.67, baseDemandMW: 6.2, activeCustomers: 2600, outageRiskScore: 59, theftIndex: 20 },
];

export const SUBSTATIONS: Substation[] = [
  { id: 'sub-mtoni', name: 'Mtoni Grand Substation', locationId: 'loc-mtoni', capacityMVA: 60, currentLoadMW: 41.5, maxLoadMW: 58.0, voltageKV: 33, status: 'Critical', feedersCount: 6 },
  { id: 'sub-stonetown', name: 'Stone Town District Substation', locationId: 'loc-stonetown', capacityMVA: 45, currentLoadMW: 24.5, maxLoadMW: 40.0, voltageKV: 33, status: 'Normal', feedersCount: 5 },
  { id: 'sub-nungwi', name: 'Nungwi Tourism Grid Substation', locationId: 'loc-nungwi', capacityMVA: 30, currentLoadMW: 21.0, maxLoadMW: 29.5, voltageKV: 33, status: 'Overloaded', feedersCount: 4 },
  { id: 'sub-fumba', name: 'Fumba Smart City Substation', locationId: 'loc-fumba', capacityMVA: 40, currentLoadMW: 16.5, maxLoadMW: 38.0, voltageKV: 33, status: 'Normal', feedersCount: 4 },
  { id: 'sub-paje', name: 'Paje Secondary Substation', locationId: 'loc-paje', capacityMVA: 25, currentLoadMW: 14.1, maxLoadMW: 22.0, voltageKV: 33, status: 'Normal', feedersCount: 3 },
  { id: 'sub-chake', name: 'Chake Chake Pemba central Stop', locationId: 'loc-chakechake', capacityMVA: 30, currentLoadMW: 18.2, maxLoadMW: 28.0, voltageKV: 33, status: 'Maintenance', feedersCount: 4 },
];

export const FEEDERS: Feeder[] = [
  // Mtoni grand Feeders
  { id: 'fd-mtoni-01', name: 'Mtoni industrial Feeder F1', substationId: 'sub-mtoni', currentAmps: 340, tripHistoryCount: 14, voltageDropPercentage: 4.8, status: 'Online' },
  { id: 'fd-mtoni-02', name: 'Maruhubi Residential Feeder F2', substationId: 'sub-mtoni', currentAmps: 410, tripHistoryCount: 22, voltageDropPercentage: 8.2, status: 'Online' },
  { id: 'fd-mtoni-03', name: 'Bububu Feeder F3', substationId: 'sub-mtoni', currentAmps: 280, tripHistoryCount: 9, voltageDropPercentage: 3.1, status: 'Online' },
  { id: 'fd-mtoni-04', name: 'Mwera Interconnector F4', substationId: 'sub-mtoni', currentAmps: 490, tripHistoryCount: 29, voltageDropPercentage: 11.4, status: 'Tripped' },

  // Nungwi Feeders
  { id: 'fd-nungwi-01', name: 'Nungwi Beach Hotels Feeder NH1', substationId: 'sub-nungwi', currentAmps: 380, tripHistoryCount: 18, voltageDropPercentage: 9.5, status: 'Online' },
  { id: 'fd-nungwi-02', name: 'Kendwa Village Feeder NH2', substationId: 'sub-nungwi', currentAmps: 220, tripHistoryCount: 8, voltageDropPercentage: 4.2, status: 'Online' },
  
  // Pemba
  { id: 'fd-pemba-01', name: 'Chake Primary Feeder PF1', substationId: 'sub-chake', currentAmps: 290, tripHistoryCount: 15, voltageDropPercentage: 6.7, status: 'Online' },
  { id: 'fd-pemba-02', name: 'Wete Link Feeder PF2', substationId: 'sub-chake', currentAmps: 180, tripHistoryCount: 10, voltageDropPercentage: 5.1, status: 'Online' },
];

export const TRANSFORMERS: Transformer[] = [
  // Mtoni / Mwera Area (Heavy loadings / Theft / outages)
  { id: 'tx-mwera-01', name: 'Mwera Crossing TX-01', feederId: 'fd-mtoni-04', locationName: 'Mwera', kVA: 500, loadPercentage: 94, oilTempCelsius: 82, oilLevelOk: true, ageYears: 14, status: 'Overloaded' },
  { id: 'tx-mwera-02', name: 'Mwera School TX-02', feederId: 'fd-mtoni-04', locationName: 'Mwera', kVA: 315, loadPercentage: 112, oilTempCelsius: 98, oilLevelOk: false, ageYears: 18, status: 'Failed' },
  { id: 'tx-maruhubi-01', name: 'Maruhubi Seaforth TX-01', feederId: 'fd-mtoni-02', locationName: 'Mtoni', kVA: 500, loadPercentage: 88, oilTempCelsius: 75, oilLevelOk: true, ageYears: 8, status: 'Warning' },
  
  // Nungwi Area
  { id: 'tx-nungwi-hotel-01', name: 'Nungwi Reef Resort TX-01', feederId: 'fd-nungwi-01', locationName: 'Nungwi', kVA: 1000, loadPercentage: 91, oilTempCelsius: 78, oilLevelOk: true, ageYears: 4, status: 'Warning' },
  { id: 'tx-nungwi-village-01', name: 'Nungwi Market Square TX-02', feederId: 'fd-nungwi-01', locationName: 'Nungwi', kVA: 500, loadPercentage: 72, oilTempCelsius: 62, oilLevelOk: true, ageYears: 11, status: 'Healthy' },
  
  // Stone Town (Heavy but healthy)
  { id: 'tx-st-darajani-01', name: 'Darajani Market TX-01', feederId: 'fd-mtoni-03', locationName: 'Stone Town', kVA: 800, loadPercentage: 58, oilTempCelsius: 52, oilLevelOk: true, ageYears: 5, status: 'Healthy' },
  { id: 'tx-st-forodhani-01', name: 'Forodhani Gardens TX-02', feederId: 'fd-mtoni-03', locationName: 'Stone Town', kVA: 800, loadPercentage: 66, oilTempCelsius: 57, oilLevelOk: true, ageYears: 7, status: 'Healthy' },

  // Paje
  { id: 'tx-paje-kitere-01', name: 'Paje Kitere Junction TX-01', feederId: 'fd-nungwi-02', locationName: 'Paje', kVA: 315, loadPercentage: 84, oilTempCelsius: 71, oilLevelOk: true, ageYears: 16, status: 'Warning' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-001',
    email: 'abubakarali1886@gmail.com',
    name: 'Mhandisi Abubakar Ali',
    role: 'Super Admin',
    avatar: '',
    department: 'ZECO Grid Operations Command',
    permissions: ['all_access', 'ai_control', 'user_management', 'database_rw', 'generate_reports']
  }
];

export const MOCKED_AUDIT_LOGS = [
  { timestamp: '2026-05-26 08:14:22', user: 'Abubakar Ali', action: 'Triggered Outage Risk Retraining', module: 'Outage Engine' },
  { timestamp: '2026-05-26 05:40:00', user: 'System', action: 'Auto-scanned Mtoni Transformer Oil Temp spike', module: 'SCADA Alert Agent' },
];
