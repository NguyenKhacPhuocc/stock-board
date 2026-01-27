import { memo, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useAppSelector } from "@/app/hooks";
import { formatPrice, formatVol, formatPercent, formatChange, getColorClass } from "../../marketUtils";
import { marketCache } from "../../marketCache";
import type { StockInstrument, CellType, FieldValue, MarketCellProps } from "../../marketTypes";
import styles from "./MarketCell.module.scss";

const FLASH_DURATION = 500;

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
  const [data, setData] = useState<StockInstrument | undefined>(
    reduxStock || marketCache.get(symbol)
  );
  const [flashClass, setFlashClass] = useState<string>("");
  const prevValueRef = useRef<FieldValue>(undefined);

  useEffect(() => {
    if (reduxStock) {
      setData(reduxStock);
    }
  }, [reduxStock]);

  useEffect(() => {
    const unsubscribe = marketCache.subscribe(symbol, (updatedStock) => {
      setData((prev) => {
        if (!prev) return updatedStock;

        const valueChanged = getFieldValue(prev, field) !== getFieldValue(updatedStock, field);
        const colorSource = colorField || (type === "price" ? field : undefined);
        const colorChanged = colorSource
          ? getFieldValue(prev, colorSource) !== getFieldValue(updatedStock, colorSource)
          : false;

        const shouldUpdate = valueChanged || colorChanged || prev.RE !== updatedStock.RE;
        return shouldUpdate ? updatedStock : prev;
      });
    });
    return unsubscribe;
  }, [symbol, field, colorField, type]);

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
    const hasNoPreviousValue = prevValueRef.current === undefined;
    const valueUnchanged = prevValueRef.current === value;
    const noValue = value === undefined;

    if (hasNoPreviousValue || valueUnchanged || noValue) {
      prevValueRef.current = value;
      return;
    }

    const newVal = Number(value) || 0;
    const flashColor = determineFlashColor(newVal, ref, ceil, flr, styles);
    setFlashClass(flashColor);

    const timer = setTimeout(() => {
      setFlashClass("");
    }, FLASH_DURATION);

    prevValueRef.current = value;
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
