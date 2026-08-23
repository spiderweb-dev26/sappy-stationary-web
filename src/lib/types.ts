export interface InventoryItem {
  id: string;
  name: string;
  serial: string; // e.g. SL-26-XXXXX
  sku?: string | null;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  purchaseValue?: number; // Alias for costPrice
  costPrice: number;
  sellingPrice: number;
  costUnknown: boolean;
  supplier?: string | null;
  location?: string | null;
  notes?: string | null;
  dupKeptAt?: string | Date | null;
  dupKeptBy?: string | null;
  userId?: string | null;
  userName?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SaleItem {
  id?: string;
  saleId?: string;
  itemId: string;
  itemName?: string;
  serial?: string;
  item?: InventoryItem;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  saleNo?: string;
  receiptNo: string;
  customerName?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  discount: number;
  tax: number;
  paymentMethod: "CASH" | "CARD" | "MOBILE" | "CREDIT" | string;
  status: "COMPLETED" | "REFUNDED" | "CANCELLED" | string;
  refunded?: boolean;
  refundedAt?: string | Date | null;
  isCredit: boolean;
  isBackdated: boolean;
  notes?: string | null;
  userId?: string | null;
  userName?: string | null;
  createdBy?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: SaleItem[];
  credit?: Credit | null;
}

export interface CreditPayment {
  id: string;
  creditId: string;
  amount: number;
  paymentMethod: string;
  note?: string | null;
  createdAt: string | Date;
}

export interface Credit {
  id: string;
  saleId: string;
  sale?: Sale;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  remainingAmount: number;
  dueDate?: string | Date | null;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | string;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  payments?: CreditPayment[];
}

export interface PoItem {
  id?: string;
  purchaseOrderId?: string;
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED" | string;
  totalCost: number;
  orderDate: string | Date;
  expectedDate?: string | Date | null;
  receivedDate?: string | Date | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: PoItem[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string | Date;
  paymentMethod: string;
  createdBy?: string | null;
  receiptRef?: string | null;
  createdAt: string | Date;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  details: string;
  ipAddress?: string | null;
  createdAt: string | Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "CASHIER" | string;
  createdAt: string | Date;
}

export interface Session {
  id: string;
  userId: string;
  user?: User;
  userAgent?: string | null;
  ipAddress?: string | null;
  deviceInfo?: string | null;
  isActive: boolean;
  lastActive: string | Date;
  createdAt: string | Date;
}

export interface BarcodeRenderOptions {
  width?: number;
  height?: number;
  showText?: boolean;
  fontSize?: number;
  fontFamily?: string;
  lineColor?: string;
  background?: string;
  margin?: number;
}

export interface InventoryKpis {
  itemsInView: number;
  totalUnits: number;
  stockValue: number;
  unknownCostCount: number;
}