import { memo } from "react";
import clsx from "clsx";
import { useFlashAnimation } from "../../hooks/usePrecomputedRowData";
import styles from "./MarketCell.module.scss";

interface CellProps {
  value: string;
  colorClass?: string;
  flashColorType?: "up" | "down" | "ref" | "ceiling" | "floor";
  className?: string;
  rawValue?: unknown;
}

const MarketCell = memo(({ value, colorClass, flashColorType, className, rawValue }: CellProps) => {
  // Flash animation when rawValue changes
  const isFlashing = useFlashAnimation(rawValue, [rawValue]);

  const flashClassMap: Record<string, string | undefined> = {
    up: styles.flashUp,
    down: styles.flashDown,
    ref: styles.flashRef,
    ceiling: styles.flashCeiling,
    floor: styles.flashFloor,
  };

  const flashClass = isFlashing && flashColorType ? flashClassMap[flashColorType] : undefined;

  return (
    <div className={clsx(styles.cell, className, colorClass, flashClass)}>
      {value}
    </div>
  );
});

MarketCell.displayName = "MarketCell";

export default MarketCell;
