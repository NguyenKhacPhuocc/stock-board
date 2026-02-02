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
  const { value, ref, ceil, flr, colorPrice } = useAppSelector((state) => {
    const stock = state.market.entities[symbol];
    const dataValue = stock
      ? isCalculated
        ? (stock.CP ? (getFieldValue(stock, field) ?? 0) : undefined)
        : getFieldValue(stock, field)
      : undefined;
    const colorSource = colorField || (type === "price" ? field : undefined);
    const cPrice = colorSource ? getFieldValue(stock, colorSource) as number | undefined : undefined;
    return {
      value: dataValue,
      ref: stock?.RE || 0,
      ceil: stock?.CL || 0,
      flr: stock?.FL || 0,
      colorPrice: cPrice,
    };
  }, (prev, next) => {
    return (
      prev.value === next.value &&
      prev.ref === next.ref &&
      prev.ceil === next.ceil &&
      prev.flr === next.flr &&
      prev.colorPrice === next.colorPrice
    );
  });

  const [flashClass, setFlashClass] = useState<string>("");
  const prevValueRef = useRef<number | undefined>(undefined);
  const prevColorPriceRef = useRef<number | undefined>(undefined);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstEffectRef = useRef(true);

  useEffect(() => {
    // Check if main value changed
    const valueChanged = value !== prevValueRef.current;
    // Check if colorPrice changed (for Vol cells or color determination)
    const colorChanged = colorPrice !== prevColorPriceRef.current;

    // On first effect render, set initial values and skip flash
    if (isFirstEffectRef.current) {
      prevValueRef.current = value as number | undefined;
      prevColorPriceRef.current = colorPrice as number | undefined;
      isFirstEffectRef.current = false;
      return;
    }

    // Skip if nothing changed
    if (!valueChanged && !colorChanged) {
      return;
    }

    // Update refs
    prevValueRef.current = value as number | undefined;
    prevColorPriceRef.current = colorPrice as number | undefined;

    const flashValue = colorField ? colorPrice : value;

    if (flashValue === undefined) {
      return;
    }

    // Determine flash color and trigger animation
    const flashColor = determineFlashColor(flashValue as number, ref, ceil, flr, styles);

    // Clear any existing timeout
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }

    // Trigger CSS animation via RAF
    requestAnimationFrame(() => setFlashClass(flashColor));

    flashTimeoutRef.current = setTimeout(() => {
      setFlashClass("");
    }, 1000);

    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, colorPrice]);

  const colorClass = fixedColorClass || getColorClass(colorPrice, ref, ceil, flr);
  const formattedValue = formatCellValue(value, type);

  return (
    <div className={clsx(styles.cell, className, colorClass, flashClass)}>
      {formattedValue}
    </div>
  );
});

MarketCell.displayName = "MarketCell";

export default MarketCell;
