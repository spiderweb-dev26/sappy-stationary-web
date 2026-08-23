import { BarcodeRenderOptions } from "./types";

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export interface BarcodeBinaryPattern {
  modules: boolean[];
  totalModules: number;
  bars: { x: number; width: number }[];
  text: string;
}

export function encodeCode128(text: string): BarcodeBinaryPattern {
  const cleanText = (text || "SL-26-00001").trim();
  const codes: number[] = [START_CODE_B];

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    if (charCode >= 32 && charCode <= 126) {
      codes.push(charCode - 32);
    } else {
      codes.push(cleanText.toUpperCase().charCodeAt(i) % 95);
    }
  }

  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += i * codes[i];
  }
  checksum = checksum % 103;
  codes.push(checksum);
  codes.push(STOP_CODE);

  const modules: boolean[] = [];
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) continue;
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      for (let w = 0; w < width; w++) {
        modules.push(isBar);
      }
      isBar = !isBar;
    }
  }

  const bars: { x: number; width: number }[] = [];
  let currentBarStart: number | null = null;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i]) {
      if (currentBarStart === null) currentBarStart = i;
    } else {
      if (currentBarStart !== null) {
        bars.push({ x: currentBarStart, width: i - currentBarStart });
        currentBarStart = null;
      }
    }
  }
  if (currentBarStart !== null) {
    bars.push({ x: currentBarStart, width: modules.length - currentBarStart });
  }

  return {
    modules,
    totalModules: modules.length,
    bars,
    text: cleanText,
  };
}

export function generateBarcodeSvg(text: string, options: any = {}): string {
  const {
    width = 240,
    height = 65,
    showText = true,
    fontSize = 11,
    fontFamily = "monospace",
    lineColor = "#0f172a",
    background = "#ffffff",
    margin = 8,
  } = options;

  const encoded = encodeCode128(text);
  const textHeight = showText ? fontSize + 4 : 0;
  const barcodeHeight = height - (margin * 2) - textHeight;
  const usableWidth = width - (margin * 2);
  const moduleWidth = usableWidth / encoded.totalModules;

  let rects = "";
  for (const bar of encoded.bars) {
    const x = margin + (bar.x * moduleWidth);
    const w = bar.width * moduleWidth;
    rects += `<rect x="${x.toFixed(2)}" y="${margin}" width="${w.toFixed(2)}" height="${barcodeHeight.toFixed(2)}" fill="${lineColor}" />`;
  }

  let textElement = "";
  if (showText) {
    const textY = margin + barcodeHeight + fontSize;
    const textX = width / 2;
    textElement = `<text x="${textX}" y="${textY.toFixed(2)}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="700" text-anchor="middle" fill="${lineColor}" letter-spacing="1.5">${encoded.text}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="${background}" />${rects}${textElement}</svg>`;
}

export function generateBarcodeDataUrl(text: string, options: any = {}): string {
  const svg = generateBarcodeSvg(text, options);
  if (typeof window === "undefined") {
    const base64 = Buffer.from(svg).toString("base64");
    return "data:image/svg+xml;base64," + base64;
  } else {
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }
}

export function drawBarcodeJsPdf(
  doc: any,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    showText?: boolean;
    fontSize?: number;
    textColor?: [number, number, number];
  } = {}
): void {
  const {
    showText = true,
    fontSize = 6.5,
    textColor = [15, 23, 42],
  } = options;

  const encoded = encodeCode128(text);
  const textSpace = showText ? (fontSize * 0.35 + 2.2) : 0;
  const barcodeHeight = Math.max(4, height - textSpace);
  const moduleWidth = width / encoded.totalModules;

  doc.setFillColor(0, 0, 0);

  for (const bar of encoded.bars) {
    const barX = x + (bar.x * moduleWidth);
    const barW = bar.width * moduleWidth;
    doc.rect(barX, y, barW, barcodeHeight, "F");
  }

  if (showText) {
    doc.setFont("courier", "bold");
    doc.setFontSize(fontSize);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const textY = y + barcodeHeight + fontSize * 0.35 + 0.8;
    doc.text(encoded.text, x + (width / 2), textY, { align: "center" });
  }
}
