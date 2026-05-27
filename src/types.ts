/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Super Admin' | 'Data Analyst' | 'Technical Staff' | 'Billing Team';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  department: string;
  permissions: string[];
}

export interface ZanzibarLocation {
  id: string;
  name: string;
  region: 'Unguja North' | 'Unguja South' | 'Unguja Urban West' | 'Pemba North' | 'Pemba South';
  lat: number;
  lng: number;
  baseDemandMW: number;
  activeCustomers: number;
  outageRiskScore: number; // 0-100
  theftIndex: number; // 0-100
}

export interface Substation {
  id: string;
  name: string;
  locationId: string;
  capacityMVA: number;
  currentLoadMW: number;
  maxLoadMW: number;
  voltageKV: number; // e.g. 33, 11
  status: 'Normal' | 'Overloaded' | 'Maintenance' | 'Critical';
  feedersCount: number;
}

export interface Feeder {
  id: string;
  name: string;
  substationId: string;
  currentAmps: number;
  tripHistoryCount: number;
  voltageDropPercentage: number;
  status: 'Online' | 'Offline' | 'Tripped';
}

export interface Transformer {
  id: string;
  name: string;
  feederId: string;
  locationName: string; // e.g. "Nungwi Center"
  kVA: number;
  loadPercentage: number;
  oilTempCelsius: number;
  oilLevelOk: boolean;
  ageYears: number;
  status: 'Healthy' | 'Warning' | 'Overloaded' | 'Failed';
}

export interface OutagePredictionResult {
  transformerId: string;
  transformerName: string;
  locationName: string;
  probability: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: string[];
  recommendedAction: string;
}

export interface DemandPredictionResult {
  timestamp: string;
  hour: number;
  predictedDemandMW: number;
  capacityAvailableMW: number;
  historicalDemandMW: number;
  overloadRiskPercentage: number;
}

export interface TheftPredictionResult {
  id: string;
  customerId: string;
  customerName: string;
  locationName: string;
  theftScore: number; // 0-100
  anomalyPattern: string;
  meterId: string;
  reportedLossKWh: number;
  status: 'Suspected' | 'Investigating' | 'Cleared' | 'Confirmed';
}

export interface BillingPredictionResult {
  customerId: string;
  customerName: string;
  meterId: string;
  currentMonthlyKWh: number;
  predictedKWh: number;
  currentBillUSD: number;
  predictedBillUSD: number;
  unitExhaustionDays: number; // Days until current units exhaust
  spikeRisk: 'Low' | 'Medium' | 'High';
}

export interface GridTelemetry {
  timestamp: string;
  totalDemandMW: number;
  totalGenerationMW: number;
  activeOutagesCount: number;
  unresolvedTheftCases: number;
  gridFrequencyHz: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export interface UploadedDataset {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'Processing' | 'Ready' | 'Error';
  columns: string[];
  detectedLocations: string[];
  detectedMetric: string;
  predictionsCount: number;
}
