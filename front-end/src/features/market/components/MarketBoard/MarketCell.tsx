import { memo, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./MarketBoard.module.scss";
import { formatPrice, formatVol, formatPercent, formatChange, getColorClass } from "../../marketUtils";
import { useAppSelector } from "@/app/hooks";
import { marketDataService } from "../../marketDataService";

type CellType = "price" | "vol" | "percent" | "change" | "text";

interface MarketCellProps {
  symbol: string;
  field: string;
  type?: CellType;
  className?: string;
  fixedColorClass?: string;
  colorField?: string;
  isCalculated?: boolean;
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
  // 1. Initial load from Redux snapshot
  const reduxStock = useAppSelector(state => state.market.entities[symbol]);

  // 2. Local state for high-frequency updates
  const [data, setData] = useState<any>(reduxStock || marketDataService.get(symbol));
  const [flashClass, setFlashClass] = useState<string>("");
  const prevValueRef = useRef<any>(undefined);

  // Keep local state in sync if Redux data changes (initial load completion)
  useEffect(() => {
    if (reduxStock) {
      setData(reduxStock);
    }
  }, [reduxStock]);

  // 3. Subscribe to REAL-TIME updates via MarketDataService
  useEffect(() => {
    const unsubscribe = marketDataService.subscribe(symbol, (updatedStock) => {
      setData((prev: any) => {
        if (!prev) return updatedStock;

        const valChanged = prev[field] !== updatedStock[field];
        const cField = colorField || (type === "price" ? field : undefined);
        const colorChanged = cField ? prev[cField] !== updatedStock[cField] : false;

        if (valChanged || colorChanged || prev.RE !== updatedStock.RE) {
          return updatedStock;
        }
        return prev;
      });
    });
    return unsubscribe;
  }, [symbol, field, colorField, type]);

  // Derived values for rendering
  const value = data ? (isCalculated ? (data.CP ? (data[field] ?? 0) : undefined) : data[field]) : undefined;
  const ref = data?.RE || 0;
  const ceil = data?.CL || 0;
  const flr = data?.FL || 0;
  const cField = colorField || (type === "price" ? field : undefined);
  const colorPrice = cField ? data?.[cField] : undefined;

  useEffect(() => {
    if (prevValueRef.current !== undefined && prevValueRef.current !== value && value !== undefined) {
      const oldVal = Number(prevValueRef.current) || 0;
      const newVal = Number(value) || 0;

      if (newVal > oldVal) {
        setFlashClass(styles.flashUp);
      } else if (newVal < oldVal) {
        setFlashClass(styles.flashDown);
      }

      const timer = setTimeout(() => {
        setFlashClass("");
      }, 1500);

      prevValueRef.current = value;
      return () => clearTimeout(timer);
    } else {
      prevValueRef.current = value;
    }
  }, [value]);

  const colorClass = fixedColorClass || getColorClass(colorPrice, ref, ceil, flr);

  return (
    <td className={clsx(className, colorClass, flashClass)}>
      {type === "price" ? formatPrice(value) :
        type === "vol" ? formatVol(value) :
          type === "percent" ? formatPercent(value) :
            type === "change" ? formatChange(value) :
              (value !== undefined && value !== null ? String(value) : "")}
    </td>
  );
});

MarketCell.displayName = "MarketCell";

export default MarketCell;
