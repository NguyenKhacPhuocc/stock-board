import { memo, useMemo } from "react";
import clsx from "clsx";
import { useAppSelector } from "@/app/hooks";
import { makeSelectCell } from "../../marketSelectors";
import { useFlashAnimation } from "../../hooks/usePrecomputedRowData";
import styles from "./MarketCell.module.scss";
import type { MarketCellProps } from "../../marketTypes";

const MarketCell = memo(({ symbol, field, type = "text", colorField, fixedColorClass, className }: MarketCellProps) => {
    const selectCell = useMemo(() => makeSelectCell(symbol, field, type, colorField, fixedColorClass),
      [symbol, field, type, colorField, fixedColorClass]
    );

    const { value, colorClass, colorType, rawValue } = useAppSelector(selectCell);

    // Flash animation when rawValue changes
    const isFlashing = useFlashAnimation(rawValue, [rawValue]);

    const flashClassMap: Record<string, string | undefined> = {
      up: styles.flashUp,
      down: styles.flashDown,
      ref: styles.flashRef,
      ceiling: styles.flashCeiling,
      floor: styles.flashFloor,
    };

    const flashClass = isFlashing ? flashClassMap[colorType || "ref"] : undefined;

    return (
      <div className={clsx(styles.cell, className, colorClass, flashClass)}>
        {value}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.symbol === nextProps.symbol &&
      prevProps.field === nextProps.field &&
      prevProps.type === nextProps.type &&
      prevProps.colorField === nextProps.colorField &&
      prevProps.fixedColorClass === nextProps.fixedColorClass &&
      prevProps.className === nextProps.className
    );
  }
);

MarketCell.displayName = "MarketCell";

export default MarketCell;
