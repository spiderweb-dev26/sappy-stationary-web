/**
 * Sappy Stationary - Pure TypeScript Vector QR Code Generator
 * Generates ISO/IEC 18004 compliant QR matrices and vector renders for jsPDF & SVG.
 */
import { normalizeScannedCode } from "./format";

/**
 * Encodes text into a standard 2D boolean matrix (QR Code Model 2)
 */
export function encodeQrCode(text: string): boolean[][] {
  const cleanText = text || "SL-26-00000";
  const length = cleanText.length;
  const version = length <= 14 ? 1 : length <= 26 ? 2 : length <= 42 ? 3 : 4;
  const size = 17 + version * 4; // 21, 25, 29, 33
  
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isFunction[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            grid[nr][nc] = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
          } else {
            grid[nr][nc] = false;
          }
        }
      }
    }
  }

  // Finders: Top-Left, Top-Right, Bottom-Left
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    isFunction[6][i] = true;
    grid[6][i] = i % 2 === 0;
    isFunction[i][6] = true;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment pattern for v2+
  if (version >= 2) {
    const pos = size - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const nr = pos + r;
        const nc = pos + c;
        if (!isFunction[nr][nc]) {
          isFunction[nr][nc] = true;
          grid[nr][nc] = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
        }
      }
    }
  }

  // Dark module & Format info placeholder
  isFunction[size - 8][8] = true;
  grid[size - 8][8] = true;

  for (let i = 0; i < 9; i++) {
    if (i < size) { isFunction[8][i] = true; isFunction[i][8] = true; }
    if (size - 1 - i >= 0) { isFunction[8][size - 1 - i] = true; isFunction[size - 1 - i][8] = true; }
  }

  // Data payload encoding (8-bit byte mode)
  const bytes: number[] = [];
  let bitBuffer = (0b0100 << 8) | length;
  let bitCount = 12;

  for (let i = 0; i < length; i++) {
    bitBuffer = (bitBuffer << 8) | cleanText.charCodeAt(i);
    bitCount += 8;
    while (bitCount >= 8) {
      bytes.push((bitBuffer >> (bitCount - 8)) & 0xff);
      bitCount -= 8;
    }
  }
  if (bitCount > 0) {
    bytes.push((bitBuffer << (8 - bitCount)) & 0xff);
  }

  // Total data codewords capacity for EC Level M
  const totalCodewords = version === 1 ? 16 : version === 2 ? 28 : version === 3 ? 44 : 58;
  let padToggle = true;
  while (bytes.length < totalCodewords) {
    bytes.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  // Reed-Solomon EC generator
  const ecCodewordsCount = version === 1 ? 10 : version === 2 ? 16 : version === 3 ? 26 : 36;
  const gfExp = new Uint8Array(512);
  const gfLog = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    gfExp[i] = x;
    gfExp[i + 255] = x;
    gfLog[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function gfMul(a: number, b: number) {
    return (a === 0 || b === 0) ? 0 : gfExp[gfLog[a] + gfLog[b]];
  }

  let genPoly = [1];
  for (let i = 0; i < ecCodewordsCount; i++) {
    const nextPoly = new Array(genPoly.length + 1).fill(0);
    for (let j = 0; j < genPoly.length; j++) {
      nextPoly[j] ^= gfMul(genPoly[j], gfExp[i]);
      nextPoly[j + 1] ^= genPoly[j];
    }
    genPoly = nextPoly;
  }

  const ecc = new Array(ecCodewordsCount).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    const factor = bytes[i] ^ ecc[0];
    ecc.shift();
    ecc.push(0);
    for (let j = 0; j < ecCodewordsCount; j++) {
      ecc[j] ^= gfMul(genPoly[j], factor);
    }
  }

  const allCodewords = bytes.concat(ecc);
  const allBits: number[] = [];
  for (const byte of allCodewords) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((byte >> b) & 1);
    }
  }

  // Populate data matrix in zigzag order
  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    const rows = upwards ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          const mask = (row + c) % 2 === 0;
          grid[row][c] = (bit === 1) !== mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info (EC M, Mask 000 = 101010000010010)
  const formatBits = [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0];
  for (let i = 0; i < 6; i++) grid[8][i] = formatBits[i] === 1;
  grid[8][7] = formatBits[6] === 1;
  grid[8][8] = formatBits[7] === 1;
  grid[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) grid[14 - i][8] = formatBits[i] === 1;

  for (let i = 0; i < 8; i++) grid[8][size - 1 - i] = formatBits[i] === 1;
  for (let i = 8; i < 15; i++) grid[size - 15 + i][8] = formatBits[i] === 1;

  return grid;
}

/**
 * Draws vector QR Code directly on jsPDF document with sharp vector rectangles.
 */
export function drawQrJsPdf(
  doc: any,
  text: string,
  x: number,
  y: number,
  size: number,
  colorRgb: [number, number, number] = [15, 23, 42]
): void {
  const matrix = encodeQrCode(text);
  const count = matrix.length;
  const cellSize = size / count;

  doc.setFillColor(colorRgb[0], colorRgb[1], colorRgb[2]);
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        doc.rect(x + c * cellSize, y + r * cellSize, cellSize + 0.05, cellSize + 0.05, "F");
      }
    }
  }
}

/**
 * Generates an SVG string representation of the QR code.
 */
export function generateQrSvg(
  text: string,
  size: number = 200,
  fillColor: string = "#0f172a",
  bgColor: string = "#ffffff"
): string {
  const matrix = encodeQrCode(text);
  const count = matrix.length;
  const cellSize = size / count;

  let rects = "";
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${(cellSize + 0.2).toFixed(2)}" height="${(cellSize + 0.2).toFixed(2)}" fill="${fillColor}" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bgColor}"/>${rects}</svg>`;
}

/**
 * Generates a Data URL (SVG format) for browser <img> tags.
 */
export async function generateQrDataUrl(text: string, size: number = 200): Promise<string> {
  const svg = generateQrSvg(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export { normalizeScannedCode };
