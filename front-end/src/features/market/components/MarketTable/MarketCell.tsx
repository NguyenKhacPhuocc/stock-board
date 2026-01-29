import { memo, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useAppSelector } from "@/app/hooks";
import { formatPrice, formatVol, formatPercent, formatChange, getColorClass } from "../../marketUtils";
import type { StockInstrument, CellType, FieldValue, MarketCellProps } from "../../marketTypes";
import styles from "./MarketCell.module.scss";


function getFieldValue(data: StockInstrument | undefined, field: string): FieldValue {
  if (!data) return undefined;
  return (data as unknown as Record<string, FieldValue>)[field];
}

function determineFlashColor(
  value: number,
  ref: number,
  ceil: number,
  flr: number,
  styles: Record<string, string>
): string {
  if (value === ceil && ceil > 0) return styles.flashCeiling;
  if (value === flr && flr > 0) return styles.flashFloor;
  if (value > ref) return styles.flashUp;
  if (value < ref) return styles.flashDown;
  return styles.flashRef;
}

function formatCellValue(value: FieldValue, type: CellType): string {
  if (value === undefined || value === null) return "";

  switch (type) {
    case "price":
      return formatPrice(value);
    case "vol":
      return formatVol(value);
    case "percent":
      return formatPercent(value);
    case "change":
      return formatChange(value);
    default:
      return String(value);
  }
}

const MarketCell = memo(({
  symbol,
  field,
  type = "text",
  className,
  fixedColorClass,
  colorField,
  isCalculated
}: MarketCellProps) => {
  const reduxStock = useAppSelector(state => state.market.entities[symbol]);
  const [flashClass, setFlashClass] = useState<string>("");
  const prevValueRef = useRef<FieldValue>(undefined);
  const data = reduxStock;

  const value = data
    ? isCalculated
      ? (data.CP ? (getFieldValue(data, field) ?? 0) : undefined)
      : getFieldValue(data, field)
    : undefined;

  const ref = data?.RE || 0;
  const ceil = data?.CL || 0;
  const flr = data?.FL || 0;
  const colorSource = colorField || (type === "price" ? field : undefined);
  const colorPrice = colorSource ? getFieldValue(data, colorSource) as number | undefined : undefined;

  useEffect(() => {
    if (value === undefined || value === null || prevValueRef.current === undefined || prevValueRef.current === value) {
      prevValueRef.current = value;
      return;
    }

    const newVal = Number(value) || 0;
    const flashColor = determineFlashColor(newVal, ref, ceil, flr, styles);
    prevValueRef.current = value;

    queueMicrotask(() => {
      setFlashClass(flashColor);
    });
    const timer = setTimeout(() => setFlashClass(""), 1000);
    return () => clearTimeout(timer);
  }, [value, ref, ceil, flr]);

  const colorClass = fixedColorClass || getColorClass(colorPrice, ref, ceil, flr);
  const formattedValue = formatCellValue(value, type);

  return (
    <td className={clsx(className, colorClass, flashClass)}>
      {formattedValue}
    </td>
  );
});

MarketCell.displayName = "MarketCell";

export default MarketCell;
