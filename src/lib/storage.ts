import { defaultLogoUrl } from '@/assets/logo';
import { DeliveryMode, RecordStatus, RECORD_STATUS, DELIVERY_MODES } from './constants';

export interface DeliveryDetails {
  deliveryDate: string;
  deliveryMode: DeliveryMode;
  recipientName: string;
  courierNumber?: string;
  courierCompany?: string;
  notes?: string;
}

export interface HardDiskRecord {
  jobId: string;
  serialNumber: string;
  model: string;
  capacity: string;
  year: number;
  complaint: string;
  customerName: string;
  phoneNumber: string;
  customerGSTIN?: string;
  customerAddress?: string;
  customerState?: string;
  estimatedAmount?: number;
  estimatedDeliveryDate?: string;
  receivedDate: string;
  createdAt: string;
  isClosed?: boolean;
  deliveryDetails?: DeliveryDetails;
  status?: RecordStatus;
}

export interface CompanyDetails {
  companyName: string;
  address: string;
  gstin: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  // Persistent logo support: data URL and optional remote URL
  logoBase64?: string;
  logoUrl?: string;
  // Bank account details
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  bankBranch?: string;
  hsnCode: string;
}

export interface TermsTemplate {
  id: number;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

export interface InwardRecord {
  id: number;
  jobId: string;
  date: string;
  receivedFrom: string;
  notes: string;
  customerName: string;
  phoneNumber: string;
  manualAmount?: number;
  estimatedAmount?: number;
  estimatedDeliveryDate?: string;
  isDelivered?: boolean;
  deliveryDate?: string;
  status?: RecordStatus;
}

export interface OutwardRecord {
  id: number;
  jobId: string;
  date: string;
  deliveredTo: string;
  deliveryMode?: DeliveryMode;
  notes: string;
  customerName: string;
  phoneNumber: string;
  isCompleted?: boolean;
  completedDate?: string;
  estimatedAmount?: number;
  status?: RecordStatus;
}

export interface InvoiceCounter {
  invoice: number;
  estimate: number;
}

export interface GeneratedInvoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  customerName: string;
  phoneNumber: string;
  amount: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  isInterState: boolean;
  generatedDate: string;
  customTerms?: string;
}

export interface GeneratedEstimate {
  id: string;
  estimateNumber: string;
  jobId: string;
  customerName: string;
  phoneNumber: string;
  baseAmount: number;
  diagnosticFee: number;
  manualAmount: number | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  isInterState: boolean;
  validityDays: number;
  validUntilDate: string;
  generatedDate: string;
  customTerms?: string;
}

export interface MasterCustomer {
  id: number;
  name: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  state?: string;
  gstin?: string;
  createdAt: string;
  lastUpdated: string;
}

const STORAGE_KEYS = {
  HARD_DISK_RECORDS: 'hardDiskRecords',
  INWARD_RECORDS: 'inwardRecords',
  OUTWARD_RECORDS: 'outwardRecords',
  INVOICE_COUNTER: 'invoiceCounter',
  JOB_COUNTER: 'jobCounter',
  COMPANY_DETAILS: 'companyDetails',
  TERMS_TEMPLATES: 'termsTemplates',
  GENERATED_INVOICES: 'generatedInvoices',
  GENERATED_ESTIMATES: 'generatedEstimates',
  AUTH_PASSWORD: 'authPassword',
  MASTER_CUSTOMERS: 'masterCustomers',
  COMPANY_MASTER_PASSWORD: 'companyMasterPassword',
  BACKUP_JOB_DATA: 'backupJobData',
};

// Hard Disk Records
export const getHardDiskRecords = (): HardDiskRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.HARD_DISK_RECORDS);
  return data ? JSON.parse(data) : [];
};

export const saveHardDiskRecords = (records: HardDiskRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.HARD_DISK_RECORDS, JSON.stringify(records));
};

// Inward Records
export const getInwardRecords = (): InwardRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.INWARD_RECORDS);
  return data ? JSON.parse(data) : [];
};

export const saveInwardRecords = (records: InwardRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.INWARD_RECORDS, JSON.stringify(records));
};

// Outward Records
export const getOutwardRecords = (): OutwardRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.OUTWARD_RECORDS);
  return data ? JSON.parse(data) : [];
};

export const saveOutwardRecords = (records: OutwardRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.OUTWARD_RECORDS, JSON.stringify(records));
};

// Invoice Counter
export const getInvoiceCounter = (): InvoiceCounter => {
  const data = localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
  return data ? JSON.parse(data) : { invoice: 0, estimate: 0 };
};

export const saveInvoiceCounter = (counter: InvoiceCounter) => {
  localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, JSON.stringify(counter));
};

// Job Counter
export const getJobCounter = (): number => {
  const data = localStorage.getItem(STORAGE_KEYS.JOB_COUNTER);
  return data ? parseInt(data) : 0;
};

export const saveJobCounter = (counter: number) => {
  localStorage.setItem(STORAGE_KEYS.JOB_COUNTER, counter.toString());
};

// Preview next Job ID without incrementing counter
export const previewNextJobId = (): string => {
  const counter = getJobCounter() + 1;
  return `JOB${counter.toString().padStart(3, '0')}`;
};

// Reset Job ID counter to start from 01
export const resetJobIdCounter = () => {
  saveJobCounter(0);
};

// Generate next Job ID and increment counter (only call when record is saved)
export const generateNextJobId = (): string => {
  const counter = getJobCounter() + 1;
  saveJobCounter(counter);
  return `JOB${counter.toString().padStart(3, '0')}`;
};

// Generate next Invoice Number
export const generateNextInvoiceNumber = (): string => {
  const counter = getInvoiceCounter();
  counter.invoice += 1;
  saveInvoiceCounter(counter);
  return `INV${counter.invoice.toString().padStart(4, '0')}`;
};

// Generate next Estimate Number
export const generateNextEstimateNumber = (): string => {
  const counter = getInvoiceCounter();
  counter.estimate += 1;
  saveInvoiceCounter(counter);
  return `EST${counter.estimate.toString().padStart(4, '0')}`;
};

// Export all data
export const exportAllData = () => {
  return {
    hardDiskRecords: getHardDiskRecords(),
    inwardRecords: getInwardRecords(),
    outwardRecords: getOutwardRecords(),
    invoiceCounter: getInvoiceCounter(),
    jobCounter: getJobCounter(),
    exportDate: new Date().toISOString(),
  };
};

// Import data
export const importData = (data: any) => {
  if (data.hardDiskRecords) saveHardDiskRecords(data.hardDiskRecords);
  if (data.inwardRecords) saveInwardRecords(data.inwardRecords);
  if (data.outwardRecords) saveOutwardRecords(data.outwardRecords);
  if (data.invoiceCounter) saveInvoiceCounter(data.invoiceCounter);
  if (data.jobCounter) saveJobCounter(data.jobCounter);
};

// Clear all data
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

// Company Details
export const getCompanyDetails = (): CompanyDetails => {
  const data = localStorage.getItem(STORAGE_KEYS.COMPANY_DETAILS);
  if (data) {
    const parsed = JSON.parse(data);
    // Ensure logo URL is set if not already
    if (!parsed.logoUrl && !parsed.logoBase64) {
      parsed.logoUrl = defaultLogoUrl;
    }
    return parsed;
  }
  return {
    companyName: 'Swaz Data Recovery Lab',
    address: '123 Recovery Street, Tech Park',
    gstin: '29ABCDE1234F1Z5',
    state: 'Karnataka',
    postalCode: '560001',
    phone: '+91 1234567890',
    email: 'info@datarecoverylab.com',
    // default logo
    logoBase64: undefined,
    logoUrl: defaultLogoUrl,
    // bank details - optional
    bankAccountName: '',
    bankAccountNumber: '',
    bankIFSC: '',
    bankName: '',
    bankBranch: '',
    hsnCode: '998314',
  };
};

export const saveCompanyDetails = (details: CompanyDetails) => {
  localStorage.setItem(STORAGE_KEYS.COMPANY_DETAILS, JSON.stringify(details));
};

// Terms Templates
export const getTermsTemplates = (): TermsTemplate[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TERMS_TEMPLATES);
  return data ? JSON.parse(data) : [
    {
      id: 1,
      name: 'Default Invoice Terms',
      content: `1. Payment due upon receipt of invoice
2. Accepted payment methods: Cash, Bank Transfer, UPI
3. Late payments subject to 2% monthly interest
4. All disputes subject to local jurisdiction`,
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Default Estimate Terms',
      content: `1. This is an estimate only. Final charges may vary based on actual recovery complexity
2. 50% advance payment required to begin recovery process
3. No data recovery, no charges policy applies
4. Estimate valid for 30 days from date of issue
5. All disputes subject to local jurisdiction`,
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ];
};

export const saveTermsTemplates = (templates: TermsTemplate[]) => {
  localStorage.setItem(STORAGE_KEYS.TERMS_TEMPLATES, JSON.stringify(templates));
};

// Generated Invoices
export const getGeneratedInvoices = (): GeneratedInvoice[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GENERATED_INVOICES);
  return data ? JSON.parse(data) : [];
};

export const saveGeneratedInvoice = (invoice: GeneratedInvoice) => {
  const invoices = getGeneratedInvoices();
  const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
  
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }
  
  localStorage.setItem(STORAGE_KEYS.GENERATED_INVOICES, JSON.stringify(invoices));
};

export const getInvoiceByJobId = (jobId: string): GeneratedInvoice | undefined => {
  const invoices = getGeneratedInvoices();
  return invoices.find(inv => inv.jobId === jobId);
};

// Generated Estimates
export const getGeneratedEstimates = (): GeneratedEstimate[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GENERATED_ESTIMATES);
  return data ? JSON.parse(data) : [];
};

export const saveGeneratedEstimate = (estimate: GeneratedEstimate) => {
  const estimates = getGeneratedEstimates();
  const existingIndex = estimates.findIndex(est => est.id === estimate.id);
  
  if (existingIndex >= 0) {
    estimates[existingIndex] = estimate;
  } else {
    estimates.push(estimate);
  }
  
  localStorage.setItem(STORAGE_KEYS.GENERATED_ESTIMATES, JSON.stringify(estimates));
};

export const getEstimateByJobId = (jobId: string): GeneratedEstimate | undefined => {
  const estimates = getGeneratedEstimates();
  return estimates.find(est => est.jobId === jobId);
};

// Authentication Password Management
const DEFAULT_PASSWORD = 'admin123';

export const getAuthPassword = (): string => {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH_PASSWORD);
  return data ? JSON.parse(data) : DEFAULT_PASSWORD;
};

export const setAuthPassword = (password: string) => {
  localStorage.setItem(STORAGE_KEYS.AUTH_PASSWORD, JSON.stringify(password));
};

export const resetAuthPassword = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_PASSWORD);
};

// Company Master Password Management (separate from login password)
const DEFAULT_COMPANY_MASTER_PASSWORD = 'Bunny@1979';

export const getCompanyMasterPassword = (): string => {
  const data = localStorage.getItem(STORAGE_KEYS.COMPANY_MASTER_PASSWORD);
  return data ? JSON.parse(data) : DEFAULT_COMPANY_MASTER_PASSWORD;
};

export const setCompanyMasterPassword = (password: string) => {
  localStorage.setItem(STORAGE_KEYS.COMPANY_MASTER_PASSWORD, JSON.stringify(password));
};

export const resetCompanyMasterPassword = () => {
  localStorage.removeItem(STORAGE_KEYS.COMPANY_MASTER_PASSWORD);
};

export const verifyCompanyMasterPassword = (password: string): boolean => {
  return password === getCompanyMasterPassword();
};

// Master Customer Management
export const getMasterCustomers = (): MasterCustomer[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MASTER_CUSTOMERS);
  return data ? JSON.parse(data) : [];
};

export const saveMasterCustomers = (customers: MasterCustomer[]) => {
  localStorage.setItem(STORAGE_KEYS.MASTER_CUSTOMERS, JSON.stringify(customers));
};

export const addOrUpdateMasterCustomer = (customerData: Partial<MasterCustomer>): MasterCustomer => {
  const customers = getMasterCustomers();
  
  // Check if customer exists by phone or name
  const existingIndex = customers.findIndex(
    c => c.phoneNumber === customerData.phoneNumber || 
         (c.name.toLowerCase() === customerData.name?.toLowerCase() && customerData.name)
  );
  
  if (existingIndex >= 0) {
    // Update existing customer
    const updated = {
      ...customers[existingIndex],
      ...customerData,
      lastUpdated: new Date().toISOString(),
    };
    customers[existingIndex] = updated;
    saveMasterCustomers(customers);
    return updated;
  } else {
    // Add new customer
    const newCustomer: MasterCustomer = {
      id: Date.now(),
      name: customerData.name || '',
      phoneNumber: customerData.phoneNumber || '',
      email: customerData.email,
      address: customerData.address,
      state: customerData.state,
      gstin: customerData.gstin,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    customers.push(newCustomer);
    saveMasterCustomers(customers);
    return newCustomer;
  }
};

export const getMasterCustomerByPhone = (phoneNumber: string): MasterCustomer | undefined => {
  const customers = getMasterCustomers();
  return customers.find(c => c.phoneNumber === phoneNumber);
};

export const getMasterCustomerByName = (name: string): MasterCustomer | undefined => {
  const customers = getMasterCustomers();
  return customers.find(c => c.name.toLowerCase() === name.toLowerCase());
};

// Update Hard Disk Record with auto-sync to Inward and Outward
export const saveHardDiskRecordWithSync = (record: HardDiskRecord) => {
  // Save hard disk record
  const hardDisks = getHardDiskRecords();
  const existingIndex = hardDisks.findIndex(hd => hd.jobId === record.jobId);
  
  const isNewRecord = existingIndex < 0;
  
  if (existingIndex >= 0) {
    hardDisks[existingIndex] = record;
  } else {
    hardDisks.push(record);
  }
  saveHardDiskRecords(hardDisks);
  
  // Add/update master customer
  addOrUpdateMasterCustomer({
    name: record.customerName,
    phoneNumber: record.phoneNumber,
    address: record.customerAddress,
    state: record.customerState,
    gstin: record.customerGSTIN,
  });
  
  // Auto-create or update Inward record
  const inwardRecords = getInwardRecords();
  const existingInwardIndex = inwardRecords.findIndex(ir => ir.jobId === record.jobId);
  
  if (isNewRecord) {
    // Only auto-create if it's a new record
    const newInwardRecord: InwardRecord = {
      id: Date.now(),
      jobId: record.jobId,
      date: record.receivedDate || record.createdAt.split('T')[0],
      receivedFrom: record.customerName,
      notes: `Auto-created from dashboard. Complaint: ${record.complaint}`,
      customerName: record.customerName,
      phoneNumber: record.phoneNumber,
      estimatedAmount: record.estimatedAmount,
      estimatedDeliveryDate: record.estimatedDeliveryDate,
      isDelivered: false,
      status: record.status || RECORD_STATUS.PENDING,
    };
    inwardRecords.push(newInwardRecord);
    saveInwardRecords(inwardRecords);
  } else if (existingInwardIndex >= 0) {
    // Update existing inward record with latest estimates
    inwardRecords[existingInwardIndex] = {
      ...inwardRecords[existingInwardIndex],
      estimatedAmount: record.estimatedAmount,
      estimatedDeliveryDate: record.estimatedDeliveryDate,
      date: record.receivedDate || inwardRecords[existingInwardIndex].date,
    };
    saveInwardRecords(inwardRecords);
  }
  
  // Auto-create Outward record for new HDD records
  const outwardRecords = getOutwardRecords();
  const existingOutwardIndex = outwardRecords.findIndex(or => or.jobId === record.jobId);
  
  if (isNewRecord) {
    // Auto-create outward record
    const newOutwardRecord: OutwardRecord = {
      id: Date.now() + 1, // Ensure unique ID
      jobId: record.jobId,
      date: new Date().toISOString().split('T')[0],
      deliveredTo: record.customerName, // Default to customer name
      deliveryMode: DELIVERY_MODES.HAND_DELIVERY, // Default delivery mode
      notes: `Auto-created from Hard Disk record`,
      customerName: record.customerName,
      phoneNumber: record.phoneNumber,
      estimatedAmount: record.estimatedAmount,
      isCompleted: false,
      status: record.status || RECORD_STATUS.IN_PROGRESS,
    };
    outwardRecords.push(newOutwardRecord);
    saveOutwardRecords(outwardRecords);
  } else if (existingOutwardIndex >= 0) {
    // Update existing outward record with latest estimates
    outwardRecords[existingOutwardIndex] = {
      ...outwardRecords[existingOutwardIndex],
      estimatedAmount: record.estimatedAmount,
    };
    saveOutwardRecords(outwardRecords);
  }
};

// Mark item as delivered with delivery details
export const markItemAsDeliveredWithDetails = (jobId: string, deliveryDetails: DeliveryDetails) => {
  // Update Inward record
  const inwardRecords = getInwardRecords();
  const inwardIndex = inwardRecords.findIndex(ir => ir.jobId === jobId);
  
  if (inwardIndex >= 0) {
    inwardRecords[inwardIndex] = {
      ...inwardRecords[inwardIndex],
      isDelivered: true,
      deliveryDate: deliveryDetails.deliveryDate,
    };
    saveInwardRecords(inwardRecords);
  }
  
  // Update Outward record
  const outwardRecords = getOutwardRecords();
  const outwardIndex = outwardRecords.findIndex(or => or.jobId === jobId);
  
  if (outwardIndex >= 0) {
    outwardRecords[outwardIndex] = {
      ...outwardRecords[outwardIndex],
      isCompleted: true,
      completedDate: deliveryDetails.deliveryDate,
      deliveryMode: deliveryDetails.deliveryMode,
      deliveredTo: deliveryDetails.recipientName,
      notes: deliveryDetails.notes || outwardRecords[outwardIndex].notes,
    };
    saveOutwardRecords(outwardRecords);
  }
  
  // Update HardDisk record with delivery details
  const hardDisks = getHardDiskRecords();
  const hardDiskIndex = hardDisks.findIndex(hd => hd.jobId === jobId);
  
  if (hardDiskIndex >= 0) {
    hardDisks[hardDiskIndex] = {
      ...hardDisks[hardDiskIndex],
      isClosed: true,
      deliveryDetails: deliveryDetails,
    };
    saveHardDiskRecords(hardDisks);
  }
};

// Mark item as delivered (legacy function - kept for compatibility)
export const markItemAsDelivered = (jobId: string, deliveryDate: string) => {
  const inwardRecords = getInwardRecords();
  const index = inwardRecords.findIndex(ir => ir.jobId === jobId);
  
  if (index >= 0) {
    inwardRecords[index] = {
      ...inwardRecords[index],
      isDelivered: true,
      deliveryDate,
    };
    saveInwardRecords(inwardRecords);
  }
};

// Update Inward record with estimate details
export const updateInwardWithEstimate = (jobId: string, estimateAmount: number) => {
  const inwardRecords = getInwardRecords();
  const index = inwardRecords.findIndex(ir => ir.jobId === jobId);
  
  if (index >= 0) {
    inwardRecords[index] = {
      ...inwardRecords[index],
      manualAmount: estimateAmount,
      estimatedAmount: estimateAmount,
    };
    saveInwardRecords(inwardRecords);
  }
};

// Update record status across all related records
export const updateRecordStatus = (jobId: string, newStatus: RecordStatus) => {
  // Update HardDisk record
  const hardDisks = getHardDiskRecords();
  const hardDiskIndex = hardDisks.findIndex(hd => hd.jobId === jobId);
  
  if (hardDiskIndex >= 0) {
    hardDisks[hardDiskIndex] = {
      ...hardDisks[hardDiskIndex],
      status: newStatus,
      isClosed: newStatus === RECORD_STATUS.COMPLETED,
    };
    saveHardDiskRecords(hardDisks);
  }
  
  // Update Inward record
  const inwardRecords = getInwardRecords();
  const inwardIndex = inwardRecords.findIndex(ir => ir.jobId === jobId);
  
  if (inwardIndex >= 0) {
    inwardRecords[inwardIndex] = {
      ...inwardRecords[inwardIndex],
      status: newStatus,
      isDelivered: newStatus === RECORD_STATUS.COMPLETED,
    };
    saveInwardRecords(inwardRecords);
  }
  
  // Update Outward record
  const outwardRecords = getOutwardRecords();
  const outwardIndex = outwardRecords.findIndex(or => or.jobId === jobId);
  
  if (outwardIndex >= 0) {
    outwardRecords[outwardIndex] = {
      ...outwardRecords[outwardIndex],
      status: newStatus,
      isCompleted: newStatus === RECORD_STATUS.COMPLETED,
      completedDate: newStatus === RECORD_STATUS.COMPLETED 
        ? (outwardRecords[outwardIndex].completedDate || new Date().toISOString().split('T')[0])
        : undefined,
    };
    saveOutwardRecords(outwardRecords);
  }
};

// Master Record Data Interface
export interface MasterRecordData {
  jobId: string;
  // Base data from HardDisk
  serialNumber: string;
  model: string;
  capacity: string;
  customerName: string;
  phoneNumber: string;
  receivedDate: string;
  complaint: string;
  
  // Estimate data from Inward (has priority)
  estimatedAmount?: number;
  estimatedDeliveryDate?: string;
  inwardDate?: string;
  inwardNotes?: string;
  
  // Delivery data from Outward
  outwardDate?: string;
  deliveredTo?: string;
  deliveryMode?: DeliveryMode;
  deliveryDetails?: DeliveryDetails;
  
  // Status
  status: RecordStatus;
  isClosed: boolean;
  isDelivered: boolean;
  completedDate?: string;
}

// Get master record data - unified view from all sources
export const getMasterRecordData = (jobId: string): MasterRecordData | null => {
  const hardDisks = getHardDiskRecords();
  const inwardRecords = getInwardRecords();
  const outwardRecords = getOutwardRecords();
  
  const hardDisk = hardDisks.find(hd => hd.jobId === jobId);
  if (!hardDisk) return null;
  
  const inward = inwardRecords.find(i => i.jobId === jobId);
  const outward = outwardRecords.find(o => o.jobId === jobId);
  
  // Determine status - use explicit status field, or derive from record state
  let status: RecordStatus;
  if (hardDisk.status) {
    // Use explicit status if set
    status = hardDisk.status;
  } else if (outward?.status) {
    status = outward.status;
  } else if (inward?.status) {
    status = inward.status;
  } else {
    // Fallback to derived status based on record presence and completion
    if (outward?.isCompleted || hardDisk.isClosed) {
      status = RECORD_STATUS.COMPLETED;
    } else if (outward) {
      status = RECORD_STATUS.IN_PROGRESS;
    } else {
      status = RECORD_STATUS.PENDING;
    }
  }
  
  return {
    jobId: hardDisk.jobId,
    serialNumber: hardDisk.serialNumber,
    model: hardDisk.model,
    capacity: hardDisk.capacity,
    customerName: hardDisk.customerName,
    phoneNumber: hardDisk.phoneNumber,
    receivedDate: hardDisk.receivedDate,
    complaint: hardDisk.complaint,
    
    // Priority: Inward estimates > HardDisk estimates
    estimatedAmount: inward?.estimatedAmount || hardDisk.estimatedAmount,
    estimatedDeliveryDate: inward?.estimatedDeliveryDate || hardDisk.estimatedDeliveryDate,
    inwardDate: inward?.date,
    inwardNotes: inward?.notes,
    
    // Outward/delivery data
    outwardDate: outward?.date,
    deliveredTo: outward?.deliveredTo,
    deliveryMode: outward?.deliveryMode || hardDisk.deliveryDetails?.deliveryMode,
    deliveryDetails: hardDisk.deliveryDetails,
    
    // Status
    status,
    isClosed: hardDisk.isClosed || false,
    isDelivered: inward?.isDelivered || outward?.isCompleted || false,
    completedDate: outward?.completedDate,
  };
};

// Get all records with complete data from master database
export const getAllRecordsWithStatus = (): MasterRecordData[] => {
  const hardDisks = getHardDiskRecords();
  return hardDisks
    .map(hd => getMasterRecordData(hd.jobId))
    .filter((record): record is MasterRecordData => record !== null);
};

// Get delivery reports - now includes ALL records with their status
export const getDeliveryReports = () => {
  return getAllRecordsWithStatus().map(record => ({
    id: Date.now() + Math.random(), // Ensure unique IDs for React keys
    jobId: record.jobId,
    date: record.outwardDate || record.receivedDate,
    deliveredTo: record.deliveredTo || 'Not yet delivered',
    deliveryMode: record.deliveryMode,
    customerName: record.customerName,
    phoneNumber: record.phoneNumber,
    isCompleted: record.status === RECORD_STATUS.COMPLETED,
    completedDate: record.completedDate,
    inwardDate: record.inwardDate,
    deviceInfo: `${record.model} ${record.capacity}`,
    serialNumber: record.serialNumber,
    estimatedAmount: record.estimatedAmount,
    status: record.status,
  }));
};

// Backup Job Data Management
export interface BackupJobData {
  id: number;
  jobId: string;
  customerName: string;
  phoneNumber: string;
  deviceInfo: string;
  serialNumber: string;
  complaint: string;
  receivedDate: string;
  estimatedAmount?: number;
  status: RecordStatus;
  createdAt: string;
  notes?: string;
}

// Get backup job data
export const getBackupJobData = (): BackupJobData[] => {
  const data = localStorage.getItem(STORAGE_KEYS.BACKUP_JOB_DATA);
  return data ? JSON.parse(data) : [];
};

// Save backup job data
export const saveBackupJobData = (data: BackupJobData[]) => {
  localStorage.setItem(STORAGE_KEYS.BACKUP_JOB_DATA, JSON.stringify(data));
};

// Add backup job data entry
export const addBackupJobData = (jobData: Omit<BackupJobData, 'id' | 'createdAt'>): BackupJobData => {
  const backupData = getBackupJobData();
  const newEntry: BackupJobData = {
    ...jobData,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  backupData.push(newEntry);
  saveBackupJobData(backupData);
  return newEntry;
};

// Import backup job data from JSON
export const importBackupJobData = (jsonData: any[]): { success: boolean; count: number; error?: string } => {
  try {
    const existingData = getBackupJobData();
    const importedData: BackupJobData[] = jsonData.map((item, index) => ({
      id: Date.now() + index,
      jobId: item.jobId || `IMPORTED-${Date.now()}-${index}`,
      customerName: item.customerName || 'Unknown Customer',
      phoneNumber: item.phoneNumber || '',
      deviceInfo: item.deviceInfo || 'Unknown Device',
      serialNumber: item.serialNumber || '',
      complaint: item.complaint || 'No complaint specified',
      receivedDate: item.receivedDate || new Date().toISOString().split('T')[0],
      estimatedAmount: item.estimatedAmount ? Number(item.estimatedAmount) : undefined,
      status: item.status || RECORD_STATUS.PENDING,
      createdAt: item.createdAt || new Date().toISOString(),
      notes: item.notes || '',
    }));
    
    const combinedData = [...existingData, ...importedData];
    saveBackupJobData(combinedData);
    
    return { success: true, count: importedData.length };
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Export backup job data to JSON
export const exportBackupJobData = () => {
  const data = getBackupJobData();
  return {
    backupJobData: data,
    exportDate: new Date().toISOString(),
    totalRecords: data.length,
  };
};

// Clear all backup job data
export const clearBackupJobData = () => {
  localStorage.removeItem(STORAGE_KEYS.BACKUP_JOB_DATA);
};

// Auto-sync backup job data from existing hard disk records
export const autoSyncBackupJobData = (): { success: boolean; count: number; error?: string } => {
  try {
    const hardDiskRecords = getHardDiskRecords();
    const existingBackupData = getBackupJobData();
    
    // Get existing job IDs to avoid duplicates
    const existingJobIds = new Set(existingBackupData.map(d => d.jobId));
    
    // Convert hard disk records to backup job data format
    const newBackupData: BackupJobData[] = hardDiskRecords
      .filter(record => !existingJobIds.has(record.jobId)) // Only add new records
      .map(record => ({
        id: Date.now() + Math.random(),
        jobId: record.jobId,
        customerName: record.customerName,
        phoneNumber: record.phoneNumber,
        deviceInfo: `${record.model} ${record.capacity}`,
        serialNumber: record.serialNumber,
        complaint: record.complaint,
        receivedDate: record.receivedDate,
        estimatedAmount: record.estimatedAmount,
        status: record.status || RECORD_STATUS.PENDING,
        createdAt: record.createdAt,
        notes: `Auto-synced from hard disk record`,
      }));
    
    // Combine existing and new data
    const combinedData = [...existingBackupData, ...newBackupData];
    saveBackupJobData(combinedData);
    
    return { success: true, count: newBackupData.length };
  } catch (error) {
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Clear all Outward records
export const clearAllOutwardRecords = (): { success: boolean; error?: string } => {
  try {
    saveOutwardRecords([]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete specific Job ID from all records
export const deleteJobIdFromAllRecords = (jobId: string): { success: boolean; error?: string } => {
  try {
    // Remove from Hard Disk Records
    const hardDiskRecords = getHardDiskRecords();
    const updatedHardDiskRecords = hardDiskRecords.filter(record => record.jobId !== jobId);
    saveHardDiskRecords(updatedHardDiskRecords);
    
    // Remove from Inward Records
    const inwardRecords = getInwardRecords();
    const updatedInwardRecords = inwardRecords.filter(record => record.jobId !== jobId);
    saveInwardRecords(updatedInwardRecords);
    
    // Remove from Outward Records
    const outwardRecords = getOutwardRecords();
    const updatedOutwardRecords = outwardRecords.filter(record => record.jobId !== jobId);
    saveOutwardRecords(updatedOutwardRecords);
    
    // Remove from Backup Job Data
    const backupJobData = getBackupJobData();
    const updatedBackupJobData = backupJobData.filter(record => record.jobId !== jobId);
    saveBackupJobData(updatedBackupJobData);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete selected backup job data and corresponding hard disk records
export const deleteSelectedBackupJobData = (selectedIds: number[]): { success: boolean; count: number; deletedJobIds: string[]; error?: string } => {
  try {
    const backupData = getBackupJobData();
    const hardDiskRecords = getHardDiskRecords();
    const inwardRecords = getInwardRecords();
    const outwardRecords = getOutwardRecords();
    
    // Find records to delete and get their job IDs
    const recordsToDelete = backupData.filter(record => selectedIds.includes(record.id));
    const jobIdsToDelete = recordsToDelete.map(record => record.jobId);
    
    // Remove from backup job data
    const updatedBackupData = backupData.filter(record => !selectedIds.includes(record.id));
    saveBackupJobData(updatedBackupData);
    
    // Remove corresponding hard disk records
    const updatedHardDiskRecords = hardDiskRecords.filter(record => !jobIdsToDelete.includes(record.jobId));
    saveHardDiskRecords(updatedHardDiskRecords);
    
    // Remove corresponding inward records
    const updatedInwardRecords = inwardRecords.filter(record => !jobIdsToDelete.includes(record.jobId));
    saveInwardRecords(updatedInwardRecords);
    
    // Remove corresponding outward records
    const updatedOutwardRecords = outwardRecords.filter(record => !jobIdsToDelete.includes(record.jobId));
    saveOutwardRecords(updatedOutwardRecords);
    
    return { 
      success: true, 
      count: recordsToDelete.length, 
      deletedJobIds: jobIdsToDelete 
    };
  } catch (error) {
    return { 
      success: false, 
      count: 0, 
      deletedJobIds: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
