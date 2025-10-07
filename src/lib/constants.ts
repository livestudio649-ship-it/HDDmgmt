/**
 * Centralized Application Constants
 * Single source of truth for delivery modes and other shared values
 */

// Delivery Modes - Standardized across all modules
export const DELIVERY_MODES = {
  HAND_DELIVERY: 'Hand Delivery',
  COURIER: 'Courier',
  POSTAL_SERVICE: 'Postal Service',
  PICKUP: 'Pickup by Customer',
  OTHER: 'Other',
} as const;

export type DeliveryMode = typeof DELIVERY_MODES[keyof typeof DELIVERY_MODES];

// Array of delivery mode values for dropdowns/selects
export const DELIVERY_MODE_OPTIONS: DeliveryMode[] = Object.values(DELIVERY_MODES);

// Record Status Types
export const RECORD_STATUS = {
  PENDING: 'pending',        // In HardDisks, not in Outward yet
  IN_PROGRESS: 'in_progress', // In Outward, not completed
  COMPLETED: 'completed',     // In Outward, marked completed
} as const;

export type RecordStatus = typeof RECORD_STATUS[keyof typeof RECORD_STATUS];

// Status display configuration
export const STATUS_CONFIG = {
  [RECORD_STATUS.PENDING]: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700',
    bgColor: 'bg-gray-50',
  },
  [RECORD_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-yellow-100 text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  [RECORD_STATUS.COMPLETED]: {
    label: 'Completed',
    color: 'bg-green-600 text-white',
    bgColor: 'bg-green-50',
  },
} as const;
