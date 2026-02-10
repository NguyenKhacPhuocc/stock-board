import styles from "./components/MarketOverview/MarketIndexCard.module.scss";
import type { CellColorType, CellType } from "./marketTypes";

type PriceValue = number | string | undefined | null;

// Format price from absolute value to decimal (e.g., 7920 -> 7.92)
export const formatPrice = (val: PriceValue): string => {
  if (val === undefined || val === null || val === "" || Number(val) === 0)
    return "";
  const num = Number(val) / 1000;
  return num.toFixed(2);
};

// Format volume following HOSE standards
export const formatVol = (val: PriceValue): string => {
  if (val === undefined || val === null || val === "" || Number(val) === 0)
    return "";
  const raw = Number(val);
  const num = raw / 1000;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Format percentage (converts ratio to percentage string)
export const formatPercent = (val: PriceValue): string => {
  if (val === undefined || val === null || val === "") return "";

  const ratio = Number(val);
  const percent = ratio;

  if (Math.abs(percent) < 0.005) return "0.00%";

  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
};

// Format absolute change (e.g., 60 -> +0.06)
export const formatChange = (val: PriceValue): string => {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val) / 1000;
  if (Math.abs(num) < 0.0001) return "0.00";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}`;
};

// Determine CSS class based on price comparison to reference/ceiling/floor
export const getColorClass = (
  price: number | undefined | null,
  ref: number,
  ceil: number,
  floor: number,
): string => {
  if (!price || !ref) return styles.colorRef;
  const p = Number(price);
  const r = Number(ref);
  const c = Number(ceil);
  const f = Number(floor);

  if (Math.abs(p - c) < 0.001) return styles.colorCeiling;
  if (Math.abs(p - f) < 0.001) return styles.colorFloor;
  if (p > r) return styles.colorUp;
  if (p < r) return styles.colorDown;
  return styles.colorRef;
};

export const computeColorType = (
  price: number | undefined | null,
  ref: number | undefined,
  ceil: number | undefined,
  floor: number | undefined
): CellColorType => {
  if (!price || !ref) return "ref";

  const p = Number(price);
  const r = Number(ref);
  const c = Number(ceil) || 0;
  const f = Number(floor) || 0;

  if (Math.abs(p - c) < 0.001) return "ceiling";
  if (Math.abs(p - f) < 0.001) return "floor";
  if (p > r) return "up";
  if (p < r) return "down";
  return "ref";
}

export const formatCellValue = (raw: unknown, type: CellType): string => {
  if (raw === undefined || raw === null) return "";

  switch (type) {
    case "price":
      return formatPrice(raw as number | string);
    case "vol":
      return formatVol(raw as number | string);
    case "change":
      return formatChange(raw as number | string);
    case "percent":
      return formatPercent(raw as number | string);
    default:
      return String(raw);
  }
}

export const computeRowData = (
  stock: import("./marketTypes").StockInstrument | undefined
): import("./marketTypes").ComputedRowData | null => {
  if (!stock) return null;

  const { RE = 0, CL = 0, FL = 0, CP } = stock;

  // Helper to get color for a price
  const getPriceColor = (price: number | undefined) =>
    getColorClass(price, RE, CL, FL);

  const getPriceColorType = (price: number | undefined) =>
    computeColorType(price, RE, CL, FL);

  // Symbol (uses CP color)
  const cpColor = getPriceColor(CP);
  const cpColorType = getPriceColorType(CP);

  // Type-safe formatter wrappers to match (val: unknown) => string signature
  const fmtPrice = (val: unknown) => formatPrice(val as PriceValue);
  const fmtVol = (val: unknown) => formatVol(val as PriceValue);
  const fmtChange = (val: unknown) => formatChange(val as PriceValue);
  const fmtPercent = (val: unknown) => formatPercent(val as PriceValue);

  // Helper to create cell data
  const createCell = (
    rawValue: unknown,
    formatter: (val: unknown) => string,
    colorClass: string,
    colorType: CellColorType = "ref"
  ): import("./marketTypes").ComputedCellData => ({
    value: formatter(rawValue),
    colorClass,
    colorType,
    rawValue,
  });

  return {
    // Symbol
    symbol: createCell(stock.SB, String, cpColor, cpColorType),

    // Static prices (fixed colors)
    re: createCell(RE, fmtPrice, styles.colorRef, "ref"),
    cl: createCell(CL, fmtPrice, styles.colorCeiling, "ceiling"),
    fl: createCell(FL, fmtPrice, styles.colorFloor, "floor"),

    // Buy side
    b3: createCell(stock.B3, fmtPrice, getPriceColor(stock.B3), getPriceColorType(stock.B3)),
    v3: createCell(stock.V3, fmtVol, getPriceColor(stock.B3), getPriceColorType(stock.B3)),
    b2: createCell(stock.B2, fmtPrice, getPriceColor(stock.B2), getPriceColorType(stock.B2)),
    v2: createCell(stock.V2, fmtVol, getPriceColor(stock.B2), getPriceColorType(stock.B2)),
    b1: createCell(stock.B1, fmtPrice, getPriceColor(stock.B1), getPriceColorType(stock.B1)),
    v1: createCell(stock.V1, fmtVol, getPriceColor(stock.B1), getPriceColorType(stock.B1)),

    // Match (use CP for color)
    cp: createCell(CP, fmtPrice, cpColor, cpColorType),
    cv: createCell(stock.CV, fmtVol, cpColor, cpColorType),
    ch: createCell(
      CP ? stock.CH : undefined, // Only show if CP exists
      fmtChange,
      cpColor,
      cpColorType
    ),
    chp: createCell(
      CP ? stock.CHP : undefined, // Only show if CP exists
      fmtPercent,
      cpColor,
      cpColorType
    ),

    // Sell side
    s1: createCell(stock.S1, fmtPrice, getPriceColor(stock.S1), getPriceColorType(stock.S1)),
    u1: createCell(stock.U1, fmtVol, getPriceColor(stock.S1), getPriceColorType(stock.S1)),
    s2: createCell(stock.S2, fmtPrice, getPriceColor(stock.S2), getPriceColorType(stock.S2)),
    u2: createCell(stock.U2, fmtVol, getPriceColor(stock.S2), getPriceColorType(stock.S2)),
    s3: createCell(stock.S3, fmtPrice, getPriceColor(stock.S3), getPriceColorType(stock.S3)),
    u3: createCell(stock.U3, fmtVol, getPriceColor(stock.S3), getPriceColorType(stock.S3)),

    // Summary
    tt: createCell(stock.TT, fmtVol, styles.colorWhite, "ref"),
    hi: createCell(stock.HI, fmtPrice, styles.colorUp, "up"),
    ap: createCell(stock.AP, fmtPrice, getPriceColor(stock.AP), getPriceColorType(stock.AP)),
    lo: createCell(stock.LO, fmtPrice, styles.colorDown, "down"),
  };
};
