// Utility functions for formatting invoice/estimate data

/**
 * Convert number to words in Indian format
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
  };
  
  const convertIndianStyle = (n: number): string => {
    if (n < 1000) return convertLessThanThousand(n);
    if (n < 100000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      return convertLessThanThousand(thousands) + ' Thousand' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '');
    }
    if (n < 10000000) {
      const lakhs = Math.floor(n / 100000);
      const remainder = n % 100000;
      return convertLessThanThousand(lakhs) + ' Lakh' + (remainder > 0 ? ' ' + convertIndianStyle(remainder) : '');
    }
    const crores = Math.floor(n / 10000000);
    const remainder = n % 10000000;
    return convertLessThanThousand(crores) + ' Crore' + (remainder > 0 ? ' ' + convertIndianStyle(remainder) : '');
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = convertIndianStyle(rupees);
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }
  return result + ' Only';
};

/**
 * Format date in Indian format (DD/MM/YYYY)
 */
export const formatIndianDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Format currency in Indian format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date formatting utilities for dd/mm/yyyy format
export const formatDateToDDMMYYYY = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Convert dd/mm/yyyy string to yyyy-mm-dd for input[type="date"]
export const convertDDMMYYYYToISO = (ddmmyyyy: string): string => {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('/');
  if (parts.length !== 3) return '';
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Convert yyyy-mm-dd to dd/mm/yyyy for display
export const convertISOToDDMMYYYY = (iso: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  return formatDateToDDMMYYYY(date);
};

// Get today's date in yyyy-mm-dd format for input[type="date"]
export const getTodayISO = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get today's date in dd/mm/yyyy format
export const getTodayDDMMYYYY = (): string => {
  return formatDateToDDMMYYYY(new Date());
};

/**
 * Format number in Indian format with commas
 */
export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Validate required invoice/estimate fields
 */
export const validateDocumentData = (data: {
  invoiceNumber?: string;
  customerName?: string;
  phoneNumber?: string;
  amount?: number;
  jobId?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.invoiceNumber) errors.push('Invoice/Estimate number is required');
  if (!data.customerName) errors.push('Customer name is required');
  if (!data.phoneNumber) errors.push('Phone number is required');
  if (!data.amount || data.amount <= 0) errors.push('Amount must be greater than zero');
  if (!data.jobId) errors.push('Job ID is required');
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
