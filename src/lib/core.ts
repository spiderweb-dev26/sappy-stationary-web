import {
  InventoryItem,
  Sale,
  SaleItem,
  Credit,
  CreditPayment,
  PurchaseOrder,
  PoItem,
  Expense,
  ActivityLog,
  User,
  Session,
  InventoryKpis,
} from "./types";
import { normalizeItemName, generateAutoSerial } from "./format";

/**
 * High-quality starter catalog for Sappy Stationary shop
 */
export const INITIAL_STATIONERY_ITEMS: Partial<InventoryItem>[] = [
  // 1. Writing Instruments
  {
    name: "Pilot G2 0.7mm Retractable Gel Pen - Blue",
    serial: "SL-26-P0101",
    sku: "STN-PEN-001",
    category: "Writing Instruments",
    unit: "pcs",
    quantity: 140,
    minStock: 25,
    costPrice: 65.0,
    sellingPrice: 95.0,
    costUnknown: false,
    supplier: "Pilot Stationery Ltd",
    location: "Shelf A-1",
    notes: "Top-selling smooth gel pen",
  },
  {
    name: "Pilot G2 0.7mm Retractable Gel Pen - Black",
    serial: "SL-26-P0102",
    sku: "STN-PEN-002",
    category: "Writing Instruments",
    unit: "pcs",
    quantity: 110,
    minStock: 20,
    costPrice: 65.0,
    sellingPrice: 95.0,
    costUnknown: false,
    supplier: "Pilot Stationery Ltd",
    location: "Shelf A-1",
    notes: "Daily office favorite",
  },
  {
    name: "Faber-Castell 2B Graphite Pencils (Pack of 12)",
    serial: "SL-26-P0103",
    sku: "STN-PNC-003",
    category: "Writing Instruments",
    unit: "pack",
    quantity: 65,
    minStock: 15,
    costPrice: 120.0,
    sellingPrice: 175.0,
    costUnknown: false,
    supplier: "Faber-Castell Distributors",
    location: "Shelf A-2",
    notes: "High break-resistant lead",
  },
  {
    name: "Stabilo Boss Pastel Highlighters (Set of 6)",
    serial: "SL-26-P0104",
    sku: "STN-HLT-004",
    category: "Writing Instruments",
    unit: "set",
    quantity: 40,
    minStock: 10,
    costPrice: 280.0,
    sellingPrice: 390.0,
    costUnknown: false,
    supplier: "Stabilo Ethiopia",
    location: "Shelf A-3",
    notes: "Anti-dry out technology",
  },
  {
    name: "Artline 70 Permanent Marker - Black Chisel",
    serial: "SL-26-P0105",
    sku: "STN-MRK-005",
    category: "Writing Instruments",
    unit: "pcs",
    quantity: 85,
    minStock: 20,
    costPrice: 55.0,
    sellingPrice: 80.0,
    costUnknown: false,
    supplier: "Artline Stationery",
    location: "Shelf A-4",
    notes: "Waterproof instant dry ink",
  },

  // 2. Paper, Notebooks & Files
  {
    name: "Double A Copier Paper A4 80gsm (Box of 5 Reams)",
    serial: "SL-26-P0201",
    sku: "STN-PPR-010",
    category: "Paper & Notebooks",
    unit: "box",
    quantity: 25,
    minStock: 8,
    costPrice: 2100.0,
    sellingPrice: 2650.0,
    costUnknown: false,
    supplier: "Double A Imports",
    location: "Storage Bay 1",
    notes: "High opacity and smooth feeding",
  },
  {
    name: "Oxford Hardcover Ruled Notebook A4 (192 Pages)",
    serial: "SL-26-P0202",
    sku: "STN-NBK-011",
    category: "Paper & Notebooks",
    unit: "pcs",
    quantity: 75,
    minStock: 15,
    costPrice: 180.0,
    sellingPrice: 260.0,
    costUnknown: false,
    supplier: "Oxford Stationery",
    location: "Shelf B-1",
    notes: "Sturdy sewn binding",
  },
  {
    name: "Post-it Canary Yellow Sticky Notes 3x3 (6 Pads)",
    serial: "SL-26-P0203",
    sku: "STN-NOT-012",
    category: "Paper & Notebooks",
    unit: "pack",
    quantity: 90,
    minStock: 20,
    costPrice: 110.0,
    sellingPrice: 165.0,
    costUnknown: false,
    supplier: "3M Commercial",
    location: "Shelf B-2",
    notes: "Original repositionable adhesive",
  },
  {
    name: "Deli Lever Arch File Binder 75mm A4 - Marble Black",
    serial: "SL-26-P0204",
    sku: "STN-ARC-013",
    category: "Paper & Notebooks",
    unit: "pcs",
    quantity: 50,
    minStock: 10,
    costPrice: 130.0,
    sellingPrice: 195.0,
    costUnknown: false,
    supplier: "Deli Group Ltd",
    location: "Shelf B-3",
    notes: "Metal edge protection",
  },

  // 3. Desk Organization & Tools
  {
    name: "Kangaro Heavy Duty Desk Stapler DS-45L",
    serial: "SL-26-P0301",
    sku: "STN-STP-020",
    category: "Desk & Office Tools",
    unit: "pcs",
    quantity: 28,
    minStock: 6,
    costPrice: 320.0,
    sellingPrice: 480.0,
    costUnknown: false,
    supplier: "Kangaro Tools",
    location: "Shelf C-1",
    notes: "Loads 24/6 & 26/6 staples",
  },
  {
    name: "Kangaro 24/6 Staple Pins (Box of 1000)",
    serial: "SL-26-P0302",
    sku: "STN-PIN-021",
    category: "Desk & Office Tools",
    unit: "box",
    quantity: 200,
    minStock: 40,
    costPrice: 25.0,
    sellingPrice: 45.0,
    costUnknown: false,
    supplier: "Kangaro Tools",
    location: "Shelf C-1",
    notes: "Zinc plated steel",
  },
  {
    name: "Scotch Heavy Duty Desktop Tape Dispenser",
    serial: "SL-26-P0303",
    sku: "STN-TPE-022",
    category: "Desk & Office Tools",
    unit: "pcs",
    quantity: 32,
    minStock: 8,
    costPrice: 210.0,
    sellingPrice: 310.0,
    costUnknown: false,
    supplier: "3M Commercial",
    location: "Shelf C-2",
    notes: "Weighted non-skid base",
  },
  {
    name: "Deli 2-Hole Puncher (Punch Capacity 30 Sheets)",
    serial: "SL-26-P0304",
    sku: "STN-PNC-023",
    category: "Desk & Office Tools",
    unit: "pcs",
    quantity: 22,
    minStock: 5,
    costPrice: 290.0,
    sellingPrice: 420.0,
    costUnknown: false,
    supplier: "Deli Group Ltd",
    location: "Shelf C-3",
    notes: "With alignment guide bar",
  },

  // 4. Geometry, Math & School Supplies
  {
    name: "Staedtler Noris Metal Geometry Math Set (9 Pcs)",
    serial: "SL-26-P0401",
    sku: "STN-GEO-030",
    category: "School & Geometry",
    unit: "tin",
    quantity: 48,
    minStock: 12,
    costPrice: 240.0,
    sellingPrice: 350.0,
    costUnknown: false,
    supplier: "Staedtler Official",
    location: "Shelf D-1",
    notes: "Embossed protective tin case",
  },
  {
    name: "Casio FX-991EX ClassWiz Scientific Calculator",
    serial: "SL-26-P0402",
    sku: "STN-CAL-031",
    category: "School & Geometry",
    unit: "pcs",
    quantity: 18,
    minStock: 5,
    costPrice: 1850.0,
    sellingPrice: 2450.0,
    costUnknown: false,
    supplier: "Casio Middle East",
    location: "Secure Display 1",
    notes: "High-resolution natural textbook display",
  },
  {
    name: "Helix 30cm Shatterproof Transparent Ruler",
    serial: "SL-26-P0403",
    sku: "STN-RUL-032",
    category: "School & Geometry",
    unit: "pcs",
    quantity: 120,
    minStock: 30,
    costPrice: 30.0,
    sellingPrice: 55.0,
    costUnknown: false,
    supplier: "Helix Oxford",
    location: "Shelf D-2",
    notes: "Metric & Imperial graduations",
  },

  // 5. Art & Drafting Supplies
  {
    name: "Winsor & Newton Cotman Watercolor Pocket Box (12 Half Pans)",
    serial: "SL-26-P0501",
    sku: "STN-ART-040",
    category: "Art & Drafting",
    unit: "set",
    quantity: 15,
    minStock: 4,
    costPrice: 950.0,
    sellingPrice: 1350.0,
    costUnknown: false,
    supplier: "Fine Arts Imports",
    location: "Shelf E-1",
    notes: "Artist quality pigments",
  },
  {
    name: "Derwent Graphic Drawing Pencils (Tin of 12 Grades 6B-4H)",
    serial: "SL-26-P0502",
    sku: "STN-ART-041",
    category: "Art & Drafting",
    unit: "tin",
    quantity: 20,
    minStock: 5,
    costPrice: 420.0,
    sellingPrice: 620.0,
    costUnknown: false,
    supplier: "Fine Arts Imports",
    location: "Shelf E-2",
    notes: "Smooth graphite for sketching & shading",
  },
  {
    name: "Maped Duo Color Eraser (Pack of 2)",
    serial: "SL-26-P0503",
    sku: "STN-ERS-042",
    category: "Art & Drafting",
    unit: "pack",
    quantity: 150,
    minStock: 35,
    costPrice: 20.0,
    sellingPrice: 40.0,
    costUnknown: false,
    supplier: "Maped School Supplies",
    location: "Shelf E-3",
    notes: "Phthalate-free vinyl eraser",
  }
];

/**
 * Self-healing in-memory database store with complete relational simulation
 */
export class SappyStore {
  public items: InventoryItem[] = [];
  public sales: Sale[] = [];
  public credits: Credit[] = [];
  public purchaseOrders: PurchaseOrder[] = [];
  public expenses: Expense[] = [];
  public activities: ActivityLog[] = [];
  public users: User[] = [];
  public sessions: Session[] = [];
  public settings: Map<string, string> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.ensureSchema();
  }

  /**
   * Idempotent self-healing schema initialization
   */
  public ensureSchema(): void {
    if (this.initialized) return;

    // Seed default master password: sappy2026
    this.settings.set("master_password", "sappy2026");
    this.settings.set("store_name", "Sappy Stationary");
    this.settings.set("store_currency", "ETB");

    // Seed default users
    this.users = [
      {
        id: "usr-admin-1",
        name: "Sappy Store Manager",
        email: "manager@sappy.local",
        role: "ADMIN",
        createdAt: new Date("2026-01-01T08:00:00Z"),
      },
      {
        id: "usr-cashier-1",
        name: "Helen Tadesse",
        email: "helen@sappy.local",
        role: "CASHIER",
        createdAt: new Date("2026-01-15T09:00:00Z"),
      },
    ];

    // Seed inventory catalog
    this.items = INITIAL_STATIONERY_ITEMS.map((raw, idx) => ({
      id: `item-${idx + 1}`,
      name: raw.name!,
      serial: raw.serial || generateAutoSerial("26"),
      sku: raw.sku || `SKU-${idx + 1}`,
      category: raw.category || "General Stationery",
      unit: raw.unit || "pcs",
      quantity: raw.quantity || 0,
      minStock: raw.minStock || 5,
      costPrice: raw.costPrice || 0,
      sellingPrice: raw.sellingPrice || 0,
      costUnknown: raw.costUnknown || false,
      supplier: raw.supplier || "Official Supplier",
      location: raw.location || "Shelf A",
      notes: raw.notes || "",
      dupKeptAt: null,
      dupKeptBy: null,
      createdAt: new Date(Date.now() - (30 - idx) * 86400000),
      updatedAt: new Date(Date.now() - (30 - idx) * 86400000),
    }));

    // Seed sample sales
    const item1 = this.items[0];
    const item5 = this.items[4];
    this.sales = [
      {
        id: "sale-1001",
        receiptNo: "REC-26-1001",
        customerName: "Walk-in Customer",
        customerPhone: "+251 911 234567",
        totalAmount: 190.0,
        discount: 0.0,
        tax: 0.0,
        paymentMethod: "CASH",
        status: "COMPLETED",
        isCredit: false,
        isBackdated: false,
        notes: "Gel pen pack purchase",
        createdBy: "Helen Tadesse",
        createdAt: new Date(Date.now() - 2 * 86400000),
        updatedAt: new Date(Date.now() - 2 * 86400000),
        items: [
          {
            id: "si-1",
            saleId: "sale-1001",
            itemId: item1.id,
            item: item1,
            quantity: 2,
            unitPrice: 95.0,
            discount: 0.0,
            subtotal: 190.0,
          },
        ],
      },
      {
        id: "sale-1002",
        receiptNo: "REC-26-1002",
        customerName: "Addis Engineering Consultants",
        customerPhone: "+251 922 112233",
        totalAmount: 4200.0,
        discount: 100.0,
        tax: 0.0,
        paymentMethod: "CREDIT",
        status: "COMPLETED",
        isCredit: true,
        isBackdated: false,
        notes: "Monthly office supply pack",
        createdBy: "Sappy Store Manager",
        createdAt: new Date(Date.now() - 1 * 86400000),
        updatedAt: new Date(Date.now() - 1 * 86400000),
        items: [
          {
            id: "si-2",
            saleId: "sale-1002",
            itemId: item5.id,
            item: item5,
            quantity: 1,
            unitPrice: 2650.0,
            discount: 0.0,
            subtotal: 2650.0,
          },
        ],
      },
    ];

    // Seed sample credits
    this.credits = [
      {
        id: "crd-2001",
        saleId: "sale-1002",
        customerName: "Addis Engineering Consultants",
        customerPhone: "+251 922 112233",
        totalAmount: 4200.0,
        remainingAmount: 2200.0,
        dueDate: new Date(Date.now() + 14 * 86400000),
        status: "PARTIALLY_PAID",
        notes: "Deposit of ETB 2,000 paid via Telebirr",
        createdAt: new Date(Date.now() - 1 * 86400000),
        updatedAt: new Date(),
        payments: [
          {
            id: "pay-1",
            creditId: "crd-2001",
            amount: 2000.0,
            paymentMethod: "MOBILE",
            note: "Telebirr Ref: TB98234",
            createdAt: new Date(Date.now() - 1 * 86400000),
          },
        ],
      },
    ];

    // Seed Expenses
    this.expenses = [
      {
        id: "exp-1",
        category: "Rent",
        description: "Monthly Store Rental - Shop #14",
        amount: 15000.0,
        date: new Date(Date.now() - 15 * 86400000),
        paymentMethod: "BANK_TRANSFER",
        createdBy: "Sappy Store Manager",
        receiptRef: "INV-RNT-99",
        createdAt: new Date(Date.now() - 15 * 86400000),
      },
      {
        id: "exp-2",
        category: "Utilities",
        description: "Electricity & High-speed Internet",
        amount: 2400.0,
        date: new Date(Date.now() - 5 * 86400000),
        paymentMethod: "MOBILE",
        createdBy: "Helen Tadesse",
        receiptRef: "REC-UTIL-34",
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
    ];

    // Seed Purchase Orders
    this.purchaseOrders = [
      {
        id: "po-3001",
        poNumber: "PO-2026-3001",
        supplier: "Double A Imports",
        status: "RECEIVED",
        totalCost: 21000.0,
        orderDate: new Date(Date.now() - 10 * 86400000),
        expectedDate: new Date(Date.now() - 7 * 86400000),
        receivedDate: new Date(Date.now() - 6 * 86400000),
        notes: "Monthly bulk paper ream order",
        createdAt: new Date(Date.now() - 10 * 86400000),
        updatedAt: new Date(Date.now() - 6 * 86400000),
        items: [
          {
            id: "poi-1",
            purchaseOrderId: "po-3001",
            itemId: item5.id,
            item: item5,
            quantity: 10,
            unitCost: 2100.0,
            subtotal: 21000.0,
          },
        ],
      },
    ];

    // Seed Activity Log
    this.activities = [
      {
        id: "act-1",
        userId: "usr-admin-1",
        userName: "Sappy Store Manager",
        action: "SYSTEM_BOOTSTRAP",
        details: "Sappy Stationary initialized with standard QR label and POS engines.",
        ipAddress: "127.0.0.1",
        createdAt: new Date(Date.now() - 30 * 86400000),
      },
    ];

    this.initialized = true;
  }

  public ensureCols(): void {
    // Ensures all optional columns exist on all records
    this.items.forEach((item) => {
      if (item.costUnknown === undefined) item.costUnknown = false;
      if (item.dupKeptAt === undefined) item.dupKeptAt = null;
      if (item.dupKeptBy === undefined) item.dupKeptBy = null;
    });
  }

  // Activity Logger
  public logActivity(action: string, details: string, user?: { id?: string; name?: string }): void {
    this.activities.unshift({
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user?.id || null,
      userName: user?.name || "System User",
      action,
      details,
      createdAt: new Date(),
    });
    if (this.activities.length > 200) {
      this.activities.pop();
    }
  }

  // Master Password Gate
  public verifyMasterPassword(password: string): boolean {
    const current = this.settings.get("master_password") || "sappy2026";
    return (password || "").trim() === current.trim();
  }

  public setMasterPassword(newPassword: string): void {
    this.settings.set("master_password", (newPassword || "").trim());
    this.logActivity("MASTER_PASSWORD_CHANGED", "Master safety password was updated.");
  }

  // Duplicate Finder
  public findDuplicateByName(name: string, excludeId?: string): InventoryItem | undefined {
    const target = normalizeItemName(name);
    return this.items.find(
      (item) => item.id !== excludeId && normalizeItemName(item.name) === target
    );
  }

  // Get Duplicates Grouped
  public getDuplicatesGrouped(): { normalizedName: string; items: InventoryItem[] }[] {
    const groups: { [key: string]: InventoryItem[] } = {};
    for (const item of this.items) {
      const key = normalizeItemName(item.name);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }

    const result: { normalizedName: string; items: InventoryItem[] }[] = [];
    for (const key in groups) {
      if (groups[key].length > 1) {
        result.push({ normalizedName: key, items: groups[key] });
      }
    }
    return result;
  }

  // Unreviewed Duplicates Count
  public getUnreviewedDuplicatesCount(): number {
    const groups = this.getDuplicatesGrouped();
    let count = 0;
    for (const g of groups) {
      const unkept = g.items.filter((item) => !item.dupKeptAt);
      if (unkept.length > 1) {
        count += unkept.length;
      }
    }
    return count;
  }

  // Inventory KPIs
  public calculateKpis(itemsInView: InventoryItem[]): InventoryKpis {
    let totalUnits = 0;
    let stockValue = 0;
    let unknownCostCount = 0;

    for (const item of itemsInView) {
      const q = item.quantity || 0;
      totalUnits += q;
      stockValue += (item.sellingPrice || 0) * q;
      if (item.costUnknown || item.costPrice <= 0) {
        unknownCostCount++;
      }
    }

    return {
      itemsInView: itemsInView.length,
      totalUnits,
      stockValue,
      unknownCostCount,
    };
  }

  // Create Inventory Item / Twin Copy
  public createInventoryItem(data: Partial<InventoryItem>, allowDuplicate: boolean = false, user?: any): InventoryItem {
    const existing = this.findDuplicateByName(data.name || "");
    if (existing && !allowDuplicate) {
      throw new Error(`Item with name "${data.name}" is already recorded (Serial: ${existing.serial}). Please edit the existing item or allow duplicates.`);
    }

    const newItem: InventoryItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: (data.name || "").trim(),
      serial: data.serial || generateAutoSerial("26"),
      sku: data.sku || null,
      category: data.category || "General Stationery",
      unit: data.unit || "pcs",
      quantity: Number(data.quantity) || 0,
      minStock: Number(data.minStock) || 5,
      costPrice: Number(data.costPrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      costUnknown: !!data.costUnknown,
      supplier: data.supplier || null,
      location: data.location || null,
      notes: data.notes || null,
      dupKeptAt: null,
      dupKeptBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.unshift(newItem);
    this.logActivity("INVENTORY_CREATE", `Created item "${newItem.name}" (${newItem.serial})`, user);
    return newItem;
  }

  // Edit Item (NEVER blocked by duplicates)
  public updateInventoryItem(id: string, data: Partial<InventoryItem>, user?: any): InventoryItem {
    const item = this.items.find((it) => it.id === id);
    if (!item) throw new Error("Inventory item not found");

    if (data.name !== undefined) item.name = data.name.trim();
    if (data.serial !== undefined) item.serial = data.serial.trim().toUpperCase();
    if (data.sku !== undefined) item.sku = data.sku;
    if (data.category !== undefined) item.category = data.category;
    if (data.unit !== undefined) item.unit = data.unit;
    if (data.quantity !== undefined) item.quantity = Number(data.quantity);
    if (data.minStock !== undefined) item.minStock = Number(data.minStock);
    if (data.costPrice !== undefined) item.costPrice = Number(data.costPrice);
    if (data.sellingPrice !== undefined) item.sellingPrice = Number(data.sellingPrice);
    if (data.costUnknown !== undefined) item.costUnknown = !!data.costUnknown;
    if (data.supplier !== undefined) item.supplier = data.supplier;
    if (data.location !== undefined) item.location = data.location;
    if (data.notes !== undefined) item.notes = data.notes;
    item.updatedAt = new Date();

    this.logActivity("INVENTORY_UPDATE", `Updated item "${item.name}" (${item.serial})`, user);
    return item;
  }

  // Keep Duplicate
  public keepDuplicateItem(id: string, userName: string): InventoryItem {
    const item = this.items.find((it) => it.id === id);
    if (!item) throw new Error("Item not found");
    item.dupKeptAt = new Date();
    item.dupKeptBy = userName || "User";
    item.updatedAt = new Date();
    this.logActivity("DUPLICATE_KEEP", `Marked duplicate item "${item.name}" (${item.serial}) as kept by ${item.dupKeptBy}`);
    return item;
  }

  // Delete Item (Master-gated)
  public deleteInventoryItem(id: string, user?: any): void {
    const index = this.items.findIndex((it) => it.id === id);
    if (index === -1) throw new Error("Item not found");
    const item = this.items[index];
    this.items.splice(index, 1);
    this.logActivity("INVENTORY_DELETE", `Deleted item "${item.name}" (${item.serial})`, user);
  }

  // Record Sale with Atomic Stock Adjustment
  public recordSale(saleData: any, user?: any): Sale {
    const saleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const receiptNo = `REC-26-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleItems: SaleItem[] = [];
    let calculatedTotal = 0;

    // Process line items & decrement linked inventoryItem quantities (clamp >= 0)
    for (const rawLine of saleData.items || []) {
      const item = this.items.find((it) => it.id === rawLine.itemId || it.serial === rawLine.serial);
      const qty = Math.max(1, Number(rawLine.quantity) || 1);
      const unitPrice = Number(rawLine.unitPrice) || (item ? item.sellingPrice : 0);
      const discount = Number(rawLine.discount) || 0;
      const subtotal = Math.max(0, qty * unitPrice - discount);
      calculatedTotal += subtotal;

      if (item) {
        // Stock decrement in isolated try/catch so stock issues never fail recording
        try {
          item.quantity = Math.max(0, item.quantity - qty);
          item.updatedAt = new Date();
        } catch (err) {
          console.error("Stock decrement error:", err);
        }
      }

      saleItems.push({
        id: `si-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        saleId,
        itemId: item ? item.id : rawLine.itemId || "unknown",
        item: item || undefined,
        quantity: qty,
        unitPrice,
        discount,
        subtotal,
      });
    }

    const totalDiscount = Number(saleData.discount) || 0;
    const finalTotal = Math.max(0, calculatedTotal - totalDiscount);

    const newSale: Sale = {
      id: saleId,
      receiptNo,
      customerName: saleData.customerName || "Walk-in Customer",
      customerPhone: saleData.customerPhone || null,
      totalAmount: finalTotal,
      discount: totalDiscount,
      tax: Number(saleData.tax) || 0,
      paymentMethod: saleData.paymentMethod || "CASH",
      status: "COMPLETED",
      isCredit: !!saleData.isCredit,
      isBackdated: !!saleData.isBackdated,
      notes: saleData.notes || null,
      createdBy: user?.name || "Cashier",
      createdAt: saleData.createdAt ? new Date(saleData.createdAt) : new Date(),
      updatedAt: new Date(),
      items: saleItems,
    };

    this.sales.unshift(newSale);

    // If Credit sale, create linked credit record
    if (newSale.isCredit) {
      const creditId = `crd-${Date.now()}`;
      this.credits.unshift({
        id: creditId,
        saleId: newSale.id,
        sale: newSale,
        customerName: newSale.customerName || "Customer",
        customerPhone: newSale.customerPhone || null,
        totalAmount: newSale.totalAmount,
        remainingAmount: newSale.totalAmount,
        dueDate: saleData.dueDate ? new Date(saleData.dueDate) : new Date(Date.now() + 14 * 86400000),
        status: "UNPAID",
        notes: newSale.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [],
      });
    }

    this.logActivity("SALE_CREATED", `Recorded ticket ${newSale.receiptNo} for ${finalTotal} ETB (${saleItems.length} items)`, user);
    return newSale;
  }

  // Void / Refund Toggle (Master-gated)
  public toggleSaleRefund(saleId: string, user?: any): Sale {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error("Sale not found");

    if (sale.status === "COMPLETED") {
      // Refund ON: add stock back (+qty)
      sale.status = "REFUNDED";
      for (const line of sale.items) {
        const item = this.items.find((it) => it.id === line.itemId);
        if (item) {
          item.quantity += line.quantity;
          item.updatedAt = new Date();
        }
      }
      this.logActivity("SALE_REFUNDED", `Refunded / Voided sale ${sale.receiptNo} (Restocked ${sale.items.length} items)`, user);
    } else {
      // Refund OFF: reverse refund (-qty)
      sale.status = "COMPLETED";
      for (const line of sale.items) {
        const item = this.items.find((it) => it.id === line.itemId);
        if (item) {
          item.quantity = Math.max(0, item.quantity - line.quantity);
          item.updatedAt = new Date();
        }
      }
      this.logActivity("SALE_UNREFUNDED", `Reversed refund on sale ${sale.receiptNo} (Deducted stock)`, user);
    }

    sale.updatedAt = new Date();
    return sale;
  }

  // Delete Sale (Master-gated): restock +qty ONLY IF NOT already refunded (no double-counting)
  public deleteSale(saleId: string, user?: any): void {
    const index = this.sales.findIndex((s) => s.id === saleId);
    if (index === -1) throw new Error("Sale not found");
    const sale = this.sales[index];

    // If NOT already refunded, return stock +qty
    if (sale.status !== "REFUNDED") {
      for (const line of sale.items) {
        const item = this.items.find((it) => it.id === line.itemId);
        if (item) {
          item.quantity += line.quantity;
          item.updatedAt = new Date();
        }
      }
    }

    // Remove any linked credit
    const creditIndex = this.credits.findIndex((c) => c.saleId === saleId);
    if (creditIndex !== -1) {
      this.credits.splice(creditIndex, 1);
    }

    this.sales.splice(index, 1);
    this.logActivity("SALE_DELETE", `Deleted sale ticket ${sale.receiptNo}`, user);
  }
}

// Global Singleton Memory Store
export const db = new SappyStore();

/**
 * Retry wrapper helper for API execution
 */
export async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delayMs: number = 100): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delayMs * attempt));
      }
    }
  }
  throw lastError;
}
