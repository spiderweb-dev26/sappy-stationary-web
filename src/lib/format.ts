/**
 * Sappy Stationary - Formatting and Normalization Utilities
 */

export function formatCurrency(amount: number, currency: string = "ETB"): string {
  const formatted = (amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Normalizes item names for duplicate detection:
 * trim + lowercase
 */
export function normalizeItemName(name: string): string {
  return (name || "").trim().toLowerCase();
}

/**
 * Normalizes scanned QR code or barcode:
 * uppercase + strip non [A-Z0-9-]
 */
export function normalizeScannedCode(raw: string): string {
  return (raw || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/**
 * Generates an auto-serial in format SL-26-XXXXX
 */
export function generateAutoSerial(year: string = "26"): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SL-${year}-${randomPart}`;
}
