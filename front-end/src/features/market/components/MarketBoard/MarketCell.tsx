import { memo, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "./MarketBoard.module.scss";

type CellType = "price" | "vol" | "text";

interface MarketCellProps {
  value: any;
  type?: CellType;
  className?: string;
  colorClass?: string;
}

/**
 * MarketCell - Optimized cell component with flash animation
 * Only re-renders when value changes, triggers flash effect on update
 */
const MarketCell = memo(({ value, type = "text", className, colorClass }: MarketCellProps) => {
  const [flashClass, setFlashClass] = useState<string>("");
  const prevValueRef = useRef<any>(value);

  useEffect(() => {
    if (prevValueRef.current !== undefined && prevValueRef.current !== value) {
      // Detect if value increased or decreased
      const oldVal = Number(prevValueRef.current) || 0;
      const newVal = Number(value) || 0;

      if (newVal > oldVal) {
        setFlashClass(styles.flashUp);
      } else if (newVal < oldVal) {
        setFlashClass(styles.flashDown);
      }

      // Remove flash class after animation completes
      const timer = setTimeout(() => {
        setFlashClass("");
      }, 500);

      prevValueRef.current = value;
      return () => clearTimeout(timer);
    } else {
      prevValueRef.current = value;
    }
  }, [value]);

  // Format value based on type
  const formatValue = (val: any): string => {
    if (val === undefined || val === null || val === "") return "";

    switch (type) {
      case "price": {
        const num = Number(val);
        return (num / 1000).toFixed(2);
      }
      case "vol": {
        if (val === 0) return "";
        const num = Number(val);
        return (num / 1000).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      default:
        return String(val);
    }
  };

  return (
    <td className={clsx(className, colorClass, flashClass)}>
      {formatValue(value)}
    </td>
  );
});

MarketCell.displayName = "MarketCell";

export default MarketCell;
