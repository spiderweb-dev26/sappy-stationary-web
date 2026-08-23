import { normalizeScannedCode } from "./format";

/**
 * Standard ISO/IEC 18004 Compliant QR Code Matrix Generator
 * Public Domain / Zero-Dependency Pure TypeScript Implementation
 */

export type QrEcc = "L" | "M" | "Q" | "H";

export class QrSegment {
  public readonly mode: string;
  public readonly numChars: number;
  public readonly bitData: number[];

  constructor(mode: string, numChars: number, bitData: number[]) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
  }

  public static makeBytes(data: Uint8Array | number[]): QrSegment {
    const bb: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const b = data[i];
      for (let j = 7; j >= 0; j--) {
        bb.push((b >>> j) & 1);
      }
    }
    return new QrSegment("BYTE", data.length, bb);
  }
}

const ECC_PER_BLOCK_STR =
  "-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30;" +
  "-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28;" +
  "-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30;" +
  "-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30";

const NUM_BLOCKS_STR =
  "-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25;" +
  "-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49;" +
  "-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68;" +
  "-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81";

const ECC_CODEWORDS_TABLE: number[][] = ECC_PER_BLOCK_STR.split(";").map((row) =>
  row.split(",").map((v) => parseInt(v, 10))
);

const NUM_BLOCKS_TABLE: number[][] = NUM_BLOCKS_STR.split(";").map((row) =>
  row.split(",").map((v) => parseInt(v, 10))
);

export class QrCode {
  public readonly version: number;
  public readonly size: number;
  public readonly errorCorrectionLevel: QrEcc;
  public readonly mask: number;
  private readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  constructor(version: number, ecl: QrEcc, dataCodewords: number[], mask: number) {
    this.version = version;
    this.size = version * 4 + 17;
    this.errorCorrectionLevel = ecl;
    this.mask = mask;

    this.modules = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => Array(this.size).fill(false));

    this.drawFunctionPatterns();
    const allCodewords = this.addErrorCorrection(dataCodewords);
    this.drawCodewords(allCodewords);

    if (mask === -1) {
      let minPenalty = 1000000000;
      let bestMask = 0;
      for (let m = 0; m < 8; m++) {
        this.applyMask(m);
        this.drawFormatBits(m);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestMask = m;
        }
        this.applyMask(m);
      }
      this.mask = bestMask;
    }

    this.applyMask(this.mask);
    this.drawFormatBits(this.mask);
  }

  public getModule(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const alignPos = QrCode.getAlignmentPatternPositions(this.version);
    const numAlign = alignPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0)) {
          this.drawAlignmentPattern(alignPos[i], alignPos[j]);
        }
      }
    }

    this.drawFormatBits(0);
    this.drawVersion();
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private static getAlignmentPatternPositions(version: number): number[] {
    if (version === 1) return [];
    const num = Math.floor(version / 7) + 2;
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (num * 2 - 2)) * 2;
    const result: number[] = [6];
    for (let pos = version * 4 + 10; result.length < num; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  private drawFormatBits(mask: number): void {
    const eclIndex = this.errorCorrectionLevel === "L" ? 1 : this.errorCorrectionLevel === "M" ? 0 : this.errorCorrectionLevel === "Q" ? 3 : 2;
    let data = (eclIndex << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, ((bits >>> i) & 1) !== 0);

    for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, this.size - 8, true);
  }

  private drawVersion(): void {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >>> i) & 1) !== 0;
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  }

  private addErrorCorrection(data: number[]): number[] {
    const eclIndex = this.errorCorrectionLevel === "L" ? 0 : this.errorCorrectionLevel === "M" ? 1 : this.errorCorrectionLevel === "Q" ? 2 : 3;
    const numBlocks = NUM_BLOCKS_TABLE[eclIndex][this.version];
    const blockEccLen = ECC_CODEWORDS_TABLE[eclIndex][this.version];
    const rawCodewords = Math.floor(QrCode.getNumRawDataModules(this.version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: number[][] = [];
    const rs = QrCode.reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i >= numShortBlocks ? 1 : 0));
      k += dat.length;
      const ecc = QrCode.reedSolomonComputeRemainder(dat, rs);
      blocks.push(dat.concat(ecc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i < blocks[j].length) result.push(blocks[j][i]);
      }
    }
    return result;
  }

  private static getNumRawDataModules(ver: number): number {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  private static reedSolomonComputeDivisor(degree: number): number[] {
    const result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        result[j] = QrCode.reedSolomonMultiply(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = QrCode.reedSolomonMultiply(root, 0x02);
    }
    return result;
  }

  private static reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
    const result = divisor.map(() => 0);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ (result.shift() as number);
      result.push(0);
      for (let j = 0; j < divisor.length; j++) {
        result[j] ^= QrCode.reedSolomonMultiply(divisor[j], factor);
      }
    }
    return result;
  }

  private static reedSolomonMultiply(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }

  private drawCodewords(data: number[]): void {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upwards = ((right + 1) & 2) === 0;
          const y = upwards ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = false;
        }
        if (!this.isFunction[y][x] && invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  private getPenaltyScore(): number {
    let result = 0;
    for (let y = 0; y < this.size; y++) {
      let runColor = false;
      let runVal = 0;
      for (let x = 0; x < this.size; x++) {
        if (this.modules[y][x] === runColor) {
          runVal++;
          if (runVal === 5) result += 3;
          else if (runVal > 5) result++;
        } else {
          runColor = this.modules[y][x];
          runVal = 1;
        }
      }
    }
    return result;
  }

  public static encodeText(text: string, ecl: QrEcc = "M"): QrCode {
    const seg = QrSegment.makeBytes(new TextEncoder().encode(text));
    
    let version = 1;
    let dataCapacityBits = 0;
    const eclIdx = ecl === "L" ? 0 : ecl === "M" ? 1 : ecl === "Q" ? 2 : 3;

    for (let v = 1; v <= 40; v++) {
      const rawCodewords = Math.floor(QrCode.getNumRawDataModules(v) / 8);
      const eccLen = ECC_CODEWORDS_TABLE[eclIdx][v] * NUM_BLOCKS_TABLE[eclIdx][v];
      const dataCap = (rawCodewords - eccLen) * 8;
      const countBits = v <= 9 ? 8 : 16;
      const totalBitsNeeded = 4 + countBits + seg.bitData.length;
      if (totalBitsNeeded <= dataCap) {
        version = v;
        dataCapacityBits = dataCap;
        break;
      }
    }

    const bb: number[] = [];
    bb.push(0, 1, 0, 0);
    const countBits = version <= 9 ? 8 : 16;
    for (let i = countBits - 1; i >= 0; i--) {
      bb.push((seg.numChars >>> i) & 1);
    }
    for (let i = 0; i < seg.bitData.length; i++) {
      bb.push(seg.bitData[i]);
    }

    const termLen = Math.min(4, dataCapacityBits - bb.length);
    for (let i = 0; i < termLen; i++) bb.push(0);
    while (bb.length % 8 !== 0) bb.push(0);

    const bytes: number[] = [];
    for (let i = 0; i < bb.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bb[i + j];
      bytes.push(byte);
    }

    const totalCodewords = dataCapacityBits / 8;
    let pad = 0xec;
    while (bytes.length < totalCodewords) {
      bytes.push(pad);
      pad = pad === 0xec ? 0x11 : 0xec;
    }

    return new QrCode(version, ecl, bytes, -1);
  }
}

export function encodeQrCode(text: string, ecl: QrEcc = "M"): boolean[][] {
  const qr = QrCode.encodeText(text || "SL-26-00000", ecl);
  const size = qr.size;
  const grid: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(qr.getModule(x, y));
    }
    grid.push(row);
  }
  return grid;
}

export function drawQrJsPdf(
  doc: any,
  text: string,
  x: number,
  y: number,
  size: number
): void {
  const matrix = encodeQrCode(text, "M");
  const count = matrix.length;
  const cellSize = size / count;

  doc.setFillColor(15, 23, 42); // slate-900
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        doc.rect(x + c * cellSize, y + r * cellSize, cellSize + 0.05, cellSize + 0.05, "F");
      }
    }
  }
}

export function generateQrSvg(
  text: string,
  size: number = 200,
  fillColor: string = "#0f172a",
  bgColor: string = "#ffffff"
): string {
  const matrix = encodeQrCode(text, "M");
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

export function playScanBeep(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

export { normalizeScannedCode };