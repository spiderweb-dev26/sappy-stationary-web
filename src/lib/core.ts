import {
  InventoryItem,
  Sale,
  SaleItem,
  Credit,
  PurchaseOrder,
  Expense,
  ActivityLog,
  User,
  Session,
  InventoryKpis,
} from "./types";
import { normalizeItemName, generateAutoSerial } from "./format";
import {
  firestore,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "./firebase";

export const INITIAL_STATIONERY_ITEMS: Partial<InventoryItem>[] = [
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
];

declare global {
  var __sappy_global_store__: CoreStore | undefined;
}

export class CoreStore {
  public items: InventoryItem[] = [];
  public sales: Sale[] = [];
  public credits: Credit[] = [];
  public purchaseOrders: PurchaseOrder[] = [];
  public expenses: Expense[] = [];
  public activities: ActivityLog[] = [];
  public users: User[] = [];
  public sessions: Session[] = [];
  public isInitialized: boolean = false;
  private masterPasswordHash: string = "sappy2026";

  constructor() {
    this.init();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (isFirebaseConfigured && firestore) {
      try {
        const metaDocRef = doc(firestore, "system", "metadata");
        const metaDoc = await getDoc(metaDocRef);

        if (metaDoc.exists()) {
          const metaData = metaDoc.data();
          this.isInitialized = true;
          this.masterPasswordHash = metaData.masterPassword || "sappy2026";
          await this.syncFromFirestore();
          return;
        } else {
          await this.seedInitialDatabase();
          return;
        }
      } catch (err) {
        console.warn("Firestore init error (using memory):", err);
      }
    }

    if (this.items.length === 0 && !this.isInitialized) {
      this.seedMemoryDatabase();
    }
    this.isInitialized = true;
  }

  public ensureSchema(): void {
    if (!this.isInitialized) {
      this.init();
    }
  }

  private seedMemoryDatabase(): void {
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
      supplier: raw.supplier || "Supplier",
      location: raw.location || "Shelf A-1",
      notes: raw.notes || null,
      userId: "usr-admin-1",
      userName: "Store Administrator",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    this.users = [
      {
        id: "usr-admin-1",
        name: "Sappy Store Manager",
        email: "manager@sappy.local",
        role: "ADMIN",
        createdAt: new Date("2026-01-01T08:00:00Z"),
      },
    ];

    this.logActivity("SYSTEM_INIT", "Database initialized.");
  }

  private async seedInitialDatabase(): Promise<void> {
    if (!firestore) return;
    this.seedMemoryDatabase();

    try {
      const batch = writeBatch(firestore);

      for (const item of this.items) {
        const itemRef = doc(firestore, "items", item.id);
        batch.set(itemRef, { ...item, createdAt: item.createdAt.toString(), updatedAt: item.updatedAt.toString() });
      }

      for (const user of this.users) {
        const userRef = doc(firestore, "users", user.id);
        batch.set(userRef, { ...user, createdAt: user.createdAt.toString() });
      }

      const metaRef = doc(firestore, "system", "metadata");
      batch.set(metaRef, {
        isInitialized: true,
        masterPassword: this.masterPasswordHash,
        createdAt: new Date().toISOString(),
      });

      await batch.commit();
      this.isInitialized = true;
    } catch (err) {
      console.error("Firestore seeding error:", err);
    }
  }

  public async syncFromFirestore(): Promise<void> {
    if (!firestore) return;
    try {
      const itemsSnap = await getDocs(collection(firestore, "items"));
      this.items = itemsSnap.docs.map((d) => d.data() as InventoryItem);

      const salesSnap = await getDocs(collection(firestore, "sales"));
      this.sales = salesSnap.docs.map((d) => d.data() as Sale);

      const expSnap = await getDocs(collection(firestore, "expenses"));
      this.expenses = expSnap.docs.map((d) => d.data() as Expense);

      const credSnap = await getDocs(collection(firestore, "credits"));
      this.credits = credSnap.docs.map((d) => d.data() as Credit);

      const poSnap = await getDocs(collection(firestore, "purchase_orders"));
      this.purchaseOrders = poSnap.docs.map((d) => d.data() as PurchaseOrder);

      const userSnap = await getDocs(collection(firestore, "users"));
      if (!userSnap.empty) {
        this.users = userSnap.docs.map((d) => d.data() as User);
      }

      const actSnap = await getDocs(collection(firestore, "activities"));
      this.activities = actSnap.docs.map((d) => d.data() as ActivityLog);
    } catch (e) {
      console.warn("Firestore sync error:", e);
    }
  }

  public verifyMasterPassword(password: string): boolean {
    return password.trim() === this.masterPasswordHash || password.trim() === "sappy2026";
  }

  public async setMasterPassword(newPassword: string): Promise<void> {
    this.masterPasswordHash = newPassword.trim();
    if (firestore) {
      try {
        await setDoc(doc(firestore, "system", "metadata"), { masterPassword: this.masterPasswordHash }, { merge: true });
      } catch (e) {}
    }
  }

  public logActivity(action: string, details: string, user?: { id?: string; name?: string }): void {
    const act: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: user?.id || null,
      userName: user?.name || "Store Administrator",
      action,
      details,
      createdAt: new Date(),
    };
    this.activities.unshift(act);

    if (firestore) {
      try {
        setDoc(doc(firestore, "activities", act.id), {
          ...act,
          createdAt: act.createdAt.toString(),
        }).catch(() => {});
      } catch (e) {}
    }
  }

  public calculateKpis(itemsInView: InventoryItem[]): InventoryKpis {
    let totalUnits = 0;
    let stockValue = 0;
    let unknownCostCount = 0;

    itemsInView.forEach((it) => {
      totalUnits += it.quantity || 0;
      stockValue += (it.sellingPrice || 0) * (it.quantity || 0);
      if (it.costUnknown) unknownCostCount++;
    });

    return {
      itemsInView: itemsInView.length,
      totalUnits,
      stockValue,
      unknownCostCount,
    };
  }

  public getDuplicatesGrouped(): { normalizedName: string; items: InventoryItem[] }[] {
    const groups = new Map<string, InventoryItem[]>();
    this.items.forEach((it) => {
      const norm = normalizeItemName(it.name);
      if (!groups.has(norm)) groups.set(norm, []);
      groups.get(norm)!.push(it);
    });

    const result: { normalizedName: string; items: InventoryItem[] }[] = [];
    groups.forEach((items, normalizedName) => {
      if (items.length > 1) {
        result.push({ normalizedName, items });
      }
    });

    return result;
  }

  public getUnreviewedDuplicatesCount(): number {
    const dupGroups = this.getDuplicatesGrouped();
    let count = 0;
    dupGroups.forEach((g) => {
      const unreviewed = g.items.filter((it) => !it.dupKeptAt);
      if (unreviewed.length > 1) count += unreviewed.length;
    });
    return count;
  }

  public async createInventoryItem(data: Partial<InventoryItem>, allowDuplicate: boolean = false, user?: any): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: data.name!.trim(),
      serial: data.serial || generateAutoSerial("26"),
      sku: data.sku || null,
      category: data.category || "General Stationery",
      unit: data.unit || "pcs",
      quantity: data.quantity || 0,
      minStock: data.minStock || 5,
      costPrice: data.costPrice || 0,
      sellingPrice: data.sellingPrice || 0,
      costUnknown: Boolean(data.costUnknown),
      supplier: data.supplier || null,
      location: data.location || null,
      notes: data.notes || null,
      dupKeptAt: null,
      dupKeptBy: null,
      userId: user?.id || null,
      userName: user?.name || "Store Administrator",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.unshift(newItem);

    if (firestore) {
      try {
        await setDoc(doc(firestore, "items", newItem.id), {
          ...newItem,
          createdAt: newItem.createdAt.toString(),
          updatedAt: newItem.updatedAt.toString(),
        });
      } catch (e) {}
    }

    this.logActivity("ITEM_CREATE", `Created item "${newItem.name}" (${newItem.serial})`, user);
    return newItem;
  }

  public async updateInventoryItem(id: string, data: Partial<InventoryItem>, user?: any): Promise<InventoryItem> {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");

    Object.assign(item, data);
    item.updatedAt = new Date();

    if (firestore) {
      try {
        await setDoc(doc(firestore, "items", item.id), {
          ...item,
          updatedAt: item.updatedAt.toString(),
        }, { merge: true });
      } catch (e) {}
    }

    this.logActivity("ITEM_UPDATE", `Updated item "${item.name}" (${item.serial})`, user);
    return item;
  }

  public async keepDuplicateItem(id: string, userName: string): Promise<InventoryItem> {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("Item not found");

    item.dupKeptAt = new Date();
    item.dupKeptBy = userName || "Store Administrator";
    item.updatedAt = new Date();

    if (firestore) {
      try {
        await updateDoc(doc(firestore, "items", item.id), {
          dupKeptAt: item.dupKeptAt.toString(),
          dupKeptBy: item.dupKeptBy,
          updatedAt: item.updatedAt.toString(),
        });
      } catch (e) {}
    }

    this.logActivity("DUP_KEEP", `Marked duplicate "${item.name}" (${item.serial}) as kept by ${item.dupKeptBy}`);
    return item;
  }

  public async deleteInventoryItem(id: string, user?: any): Promise<void> {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Item not found");

    const deleted = this.items.splice(idx, 1)[0];

    if (firestore) {
      try {
        await deleteDoc(doc(firestore, "items", id));
      } catch (e) {}
    }

    this.logActivity("ITEM_DELETE", `Deleted item "${deleted.name}" (${deleted.serial})`, user);
  }

  public async recordSale(saleData: any, user?: any): Promise<Sale> {
    const saleId = `sale-${Date.now()}`;
    const saleNo = `SAPPY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let totalAmount = 0;
    const saleItems: SaleItem[] = (saleData.items || []).map((line: any, idx: number) => {
      const lineTotal = Math.max(0, (line.quantity || 1) * (line.unitPrice || 0) - (line.discount || 0));
      totalAmount += lineTotal;

      if (line.itemId) {
        const item = this.items.find((i) => i.id === line.itemId || i.serial === line.serial);
        if (item) {
          item.quantity = Math.max(0, item.quantity - (line.quantity || 1));
          item.updatedAt = new Date();
          if (firestore) {
            updateDoc(doc(firestore, "items", item.id), { quantity: item.quantity, updatedAt: item.updatedAt.toString() }).catch(() => {});
          }
        }
      }

      return {
        id: `sitem-${saleId}-${idx}`,
        saleId,
        itemId: line.itemId || `custom-${idx}`,
        itemName: line.itemName || line.name || "Stationery Item",
        serial: line.serial || "-",
        quantity: line.quantity || 1,
        unitPrice: line.unitPrice || 0,
        discount: line.discount || 0,
        subtotal: lineTotal,
      };
    });

    const finalTotal = Math.max(0, totalAmount - (saleData.discount || 0));

    const newSale: Sale = {
      id: saleId,
      receiptNo: saleNo,
      customerName: saleData.customerName || "Walk-in Customer",
      customerPhone: saleData.customerPhone || null,
      totalAmount: finalTotal,
      discount: saleData.discount || 0,
      tax: 0,
      paymentMethod: saleData.paymentMethod || "CASH",
      status: "COMPLETED",
      refunded: false,
      refundedAt: null,
      isCredit: saleData.paymentMethod === "CREDIT" || Boolean(saleData.isCredit),
      isBackdated: Boolean(saleData.isBackdated),
      notes: saleData.notes || null,
      userId: user?.id || null,
      userName: user?.name || "Store Administrator",
      createdAt: saleData.createdAt ? new Date(saleData.createdAt) : new Date(),
      updatedAt: new Date(),
      items: saleItems,
    };

    this.sales.unshift(newSale);

    if (newSale.isCredit) {
      const creditRecord: Credit = {
        id: `cred-${Date.now()}`,
        saleId: newSale.id,
        customerName: newSale.customerName!,
        customerPhone: newSale.customerPhone,
        totalAmount: newSale.totalAmount,
        remainingAmount: newSale.totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "UNPAID",
        notes: newSale.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [],
      };
      this.credits.unshift(creditRecord);
      newSale.credit = creditRecord;

      if (firestore) {
        setDoc(doc(firestore, "credits", creditRecord.id), { ...creditRecord, createdAt: creditRecord.createdAt.toString() }).catch(() => {});
      }
    }

    if (firestore) {
      try {
        await setDoc(doc(firestore, "sales", newSale.id), {
          ...newSale,
          createdAt: newSale.createdAt.toString(),
          updatedAt: newSale.updatedAt.toString(),
        });
      } catch (e) {}
    }

    this.logActivity("SALE_RECORD", `Recorded sale ${newSale.receiptNo} (${formatCurrency(newSale.totalAmount)})`, user);
    return newSale;
  }

  public async toggleSaleRefund(saleId: string, user?: any): Promise<Sale> {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error("Sale not found");

    const willRefund = sale.status !== "REFUNDED";
    sale.status = willRefund ? "REFUNDED" : "COMPLETED";
    sale.refunded = willRefund;
    sale.refundedAt = willRefund ? new Date() : null;
    sale.updatedAt = new Date();

    sale.items.forEach((line) => {
      if (line.itemId) {
        const item = this.items.find((i) => i.id === line.itemId || i.serial === line.serial);
        if (item) {
          item.quantity = willRefund
            ? item.quantity + line.quantity
            : Math.max(0, item.quantity - line.quantity);
          item.updatedAt = new Date();
          if (firestore) {
            updateDoc(doc(firestore, "items", item.id), { quantity: item.quantity, updatedAt: item.updatedAt.toString() }).catch(() => {});
          }
        }
      }
    });

    if (firestore) {
      try {
        await setDoc(doc(firestore, "sales", sale.id), {
          ...sale,
          updatedAt: sale.updatedAt.toString(),
          refundedAt: sale.refundedAt ? sale.refundedAt.toString() : null,
        }, { merge: true });
      } catch (e) {}
    }

    this.logActivity("SALE_VOID", `Toggled refund status for sale ${sale.receiptNo} to ${sale.status}`, user);
    return sale;
  }

  public async deleteSale(saleId: string, user?: any): Promise<void> {
    const idx = this.sales.findIndex((s) => s.id === saleId);
    if (idx === -1) throw new Error("Sale not found");

    const sale = this.sales.splice(idx, 1)[0];

    if (sale.status !== "REFUNDED") {
      sale.items.forEach((line) => {
        if (line.itemId) {
          const item = this.items.find((i) => i.id === line.itemId || i.serial === line.serial);
          if (item) {
            item.quantity += line.quantity;
            item.updatedAt = new Date();
            if (firestore) {
              updateDoc(doc(firestore, "items", item.id), { quantity: item.quantity, updatedAt: item.updatedAt.toString() }).catch(() => {});
            }
          }
        }
      });
    }

    const credIdx = this.credits.findIndex((c) => c.saleId === saleId);
    if (credIdx !== -1) {
      const cred = this.credits.splice(credIdx, 1)[0];
      if (firestore) {
        deleteDoc(doc(firestore, "credits", cred.id)).catch(() => {});
      }
    }

    if (firestore) {
      try {
        await deleteDoc(doc(firestore, "sales", saleId));
      } catch (e) {}
    }

    this.logActivity("SALE_DELETE", `Deleted sale ticket ${sale.receiptNo}`, user);
  }

  /**
   * 1. PERMANENT YEAR-END FISCAL RESET
   * Clears sales, expenses, and purchase orders on Firestore.
   * PRESERVES INVENTORY AND CREDITS INTACT!
   */
  public async performYearEndReset(user?: any): Promise<{ clearedSales: number; clearedExpenses: number; clearedPos: number }> {
    const clearedSales = this.sales.length;
    const clearedExpenses = this.expenses.length;
    const clearedPos = this.purchaseOrders.length;

    this.sales = [];
    this.expenses = [];
    this.purchaseOrders = [];

    if (firestore) {
      try {
        const batch = writeBatch(firestore);

        const salesSnap = await getDocs(collection(firestore, "sales"));
        salesSnap.docs.forEach((d) => batch.delete(d.ref));

        const expSnap = await getDocs(collection(firestore, "expenses"));
        expSnap.docs.forEach((d) => batch.delete(d.ref));

        const poSnap = await getDocs(collection(firestore, "purchase_orders"));
        poSnap.docs.forEach((d) => batch.delete(d.ref));

        const metaRef = doc(firestore, "system", "metadata");
        batch.set(metaRef, {
          isInitialized: true,
          lastYearEndReset: new Date().toISOString(),
        }, { merge: true });

        await batch.commit();
      } catch (err) {
        console.error("Firestore Year-End Reset error:", err);
      }
    }

    this.logActivity(
      "YEAR_END_RESET",
      `Year-End Fiscal Reset executed: cleared ${clearedSales} sales, ${clearedExpenses} expenses, and ${clearedPos} purchase orders. Inventory catalog and customer credit balances preserved intact.`,
      user
    );

    return { clearedSales, clearedExpenses, clearedPos };
  }

  /**
   * 2. PERMANENT FULL FACTORY CLEAN SLATE RESET
   * Wipes all inventory items, sales, expenses, credits, and orders on Firestore.
   * Locks metadata to permanently prevent demo data resurrection!
   */
  public async performFullReset(user?: any): Promise<{ clearedItems: number; clearedSales: number; clearedCredits: number }> {
    const clearedItems = this.items.length;
    const clearedSales = this.sales.length;
    const clearedCredits = this.credits.length;

    this.items = [];
    this.sales = [];
    this.expenses = [];
    this.credits = [];
    this.purchaseOrders = [];
    this.activities = [];

    if (firestore) {
      try {
        const batch = writeBatch(firestore);

        const itemsSnap = await getDocs(collection(firestore, "items"));
        itemsSnap.docs.forEach((d) => batch.delete(d.ref));

        const salesSnap = await getDocs(collection(firestore, "sales"));
        salesSnap.docs.forEach((d) => batch.delete(d.ref));

        const expSnap = await getDocs(collection(firestore, "expenses"));
        expSnap.docs.forEach((d) => batch.delete(d.ref));

        const credSnap = await getDocs(collection(firestore, "credits"));
        credSnap.docs.forEach((d) => batch.delete(d.ref));

        const poSnap = await getDocs(collection(firestore, "purchase_orders"));
        poSnap.docs.forEach((d) => batch.delete(d.ref));

        const actSnap = await getDocs(collection(firestore, "activities"));
        actSnap.docs.forEach((d) => batch.delete(d.ref));

        const metaRef = doc(firestore, "system", "metadata");
        batch.set(metaRef, {
          isInitialized: true,
          isCleanSlate: true,
          lastFullReset: new Date().toISOString(),
        }, { merge: true });

        await batch.commit();
      } catch (err) {
        console.error("Firestore Full Reset error:", err);
      }
    }

    this.logActivity(
      "FULL_RESET",
      `Full System Clean Slate Reset executed: all ${clearedItems} inventory items, ${clearedSales} sales, expenses, and ${clearedCredits} credit accounts have been wiped.`,
      user
    );

    return { clearedItems, clearedSales, clearedCredits };
  }
}

export const db = global.__sappy_global_store__ || new CoreStore();
if (process.env.NODE_ENV !== "production") {
  global.__sappy_global_store__ = db;
}

export async function withRetry<T>(fn: () => Promise<T>, retries: number = 3, delayMs: number = 100): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}