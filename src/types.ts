export type UserRole = 'Admin' | 'Seller' | 'Warehouse';
export type ThemeType = 'light' | 'dark' | 'celeste' | 'slate' | 'emerald' | 'rose' | 'amber';

export interface Category {
  id: string;
  name: string;
  prefix: string; // e.g., 'SV' for Services
  managesStock?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface Partner {
  id: string;
  name: string;
  percentage: number;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  category: string; // Keeping this for display, but could link to Category ID
  categoryId?: string;
  stock: number;
  isService: boolean;
  minStock: number;
  image?: string;
  isCombo?: boolean;
  comboType?: 'Fixed' | 'Configurable';
  comboItems?: string[]; // IDs of products in combo (for Fixed)
  configurableOptions?: { categoryId: string; quantity: number }[]; // Rules for Configurable
  availableForCombo?: boolean;
  comboStartDate?: string;
  comboEndDate?: string;
  comboDiscountPercentage?: number;
  isMonthlyFee?: boolean;
}

export interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedComboItems?: string[]; // For Configurable combos: IDs of selected products
  feeDetails?: {
    month: string;
    year: number;
    type: 'Current' | 'Past' | 'Advanced';
  };
}

export interface Sale {
  id: string;
  date: string;
  clientId?: string;
  clientName: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Mobile';
  sellerId: string;
}

export interface BusinessConfig {
  name: string;
  ruc: string;
  address: string;
  phone: string;
  currency: string;
  logo?: string;
  enableTax: boolean;
  ticketSettings?: {
    logoSize: number;
    footerText: string;
    headerText: string;
    showLogo: boolean;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  system?: boolean;
  toastDismissed?: boolean;
}

export interface ActivationStatus {
  isActivated: boolean;
  productKey?: string;
  firstRunDate?: string;
  dailyReceiptsCount: number;
  lastReceiptResetDate?: string;
  mode: 'Demo' | 'Full' | 'None';
}
