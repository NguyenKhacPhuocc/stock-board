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

export const  computeColorType = (
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