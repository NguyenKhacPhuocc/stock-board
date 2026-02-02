import { memo, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { useIntl } from "react-intl";
import clsx from "clsx";
import { PinIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setHighlightedSymbol, togglePin } from "../../marketSlice";
import {
  selectPinnedFilteredStockSymbols,
  selectUnpinnedFilteredStockSymbols,
  selectHighlightedSymbol
} from "../../marketSelectors";
import { getColorClass } from "../../marketUtils";
import MarketCell from "./MarketCell";
import styles from "./MarketTable.module.scss";
import { FixedSizeList as List, type ListChildComponentProps } from "react-window";
import type { VirtualRowData } from "../../marketTypes";
import useMeasure from "react-use-measure";


const HIGHLIGHT_TIMEOUT = 2000;

const SymbolCell = memo(({ symbol, isPinned }: { symbol: string; isPinned: boolean }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const { RE, CL, FL, CP } = useAppSelector(
    state => {
      const stock = state.market.entities[symbol];
      return {
        RE: stock?.RE || 0,
        CL: stock?.CL || 0,
        FL: stock?.FL || 0,
        CP: stock?.CP
      };
    },
    (prev, next) => (
      prev.RE === next.RE &&
      prev.CL === next.CL &&
      prev.FL === next.FL &&
      prev.CP === next.CP
    )
  );

  const colorCode = getColorClass(CP || RE, RE, CL, FL);

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(togglePin(symbol));
  };

  return (
    <div className={styles.symbolCell}>
      <PinIcon
        className={clsx(styles.iconPin, isPinned && styles.pinned)}
        onDoubleClick={handlePinToggle}
      >
        <title>{intl.formatMessage({ id: 'market.pin' })}</title>
      </PinIcon>
      <span className={colorCode}>{symbol}</span>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality: only re-render if symbol or isPinned changed
  return prevProps.symbol === nextProps.symbol && prevProps.isPinned === nextProps.isPinned;
});

SymbolCell.displayName = 'SymbolCell';

const StockRow = memo(({
  symbol,
  isHighlighted,
  isPinned,
  style,
}: {
  symbol: string;
  isHighlighted: boolean;
  isPinned: boolean;
  style?: CSSProperties;
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isHighlighted || !rowRef.current) return;
    const timer = setTimeout(() => {
      dispatch(setHighlightedSymbol(null));
    }, HIGHLIGHT_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isHighlighted, dispatch]);

  return (
    <div
      ref={rowRef}
      style={style}
      className={clsx(
        styles.row,
        isHighlighted && styles.rowHighlighted,
        isPinned && styles.rowPinned
      )}
    >
      <SymbolCell symbol={symbol} isPinned={isPinned} />

      {/* Static-price columns */}
      <MarketCell symbol={symbol} field="RE" type="price" fixedColorClass={styles.colorRef} />
      <MarketCell symbol={symbol} field="CL" type="price" fixedColorClass={styles.colorCeiling} />
      <MarketCell symbol={symbol} field="FL" type="price" fixedColorClass={styles.colorFloor} />

      {/* Buy Side - Vol cells color depends on their Price counterparts */}
      <MarketCell symbol={symbol} field="B3" type="price" />
      <MarketCell symbol={symbol} field="V3" type="vol" colorField="B3" />
      <MarketCell symbol={symbol} field="B2" type="price" />
      <MarketCell symbol={symbol} field="V2" type="vol" colorField="B2" />
      <MarketCell symbol={symbol} field="B1" type="price" />
      <MarketCell symbol={symbol} field="V1" type="vol" colorField="B1" />

      {/* Matching - All color depends on CP (closePrice) */}
      <MarketCell symbol={symbol} field="CP" type="price" />
      <MarketCell symbol={symbol} field="CV" type="vol" colorField="CP" />
      <MarketCell symbol={symbol} field="CH" type="change" colorField="CP" isCalculated />
      <MarketCell symbol={symbol} field="CHP" type="percent" colorField="CP" isCalculated />

      {/* Sell Side */}
      <MarketCell symbol={symbol} field="S1" type="price" />
      <MarketCell symbol={symbol} field="U1" type="vol" colorField="S1" />
      <MarketCell symbol={symbol} field="S2" type="price" />
      <MarketCell symbol={symbol} field="U2" type="vol" colorField="S2" />
      <MarketCell symbol={symbol} field="S3" type="price" />
      <MarketCell symbol={symbol} field="U3" type="vol" colorField="S3" />

      {/* Summary */}
      <MarketCell symbol={symbol} field="TT" type="vol" fixedColorClass={styles.colorWhite} />
      <MarketCell symbol={symbol} field="HI" type="price" fixedColorClass={styles.colorUp} />
      <MarketCell symbol={symbol} field="AP" type="price" />
      <MarketCell symbol={symbol} field="LO" type="price" fixedColorClass={styles.colorDown} />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality: only re-render if symbol, isHighlighted or isPinned changed
  return (
    prevProps.symbol === nextProps.symbol &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isPinned === nextProps.isPinned
  );
});


const TableHeader = memo(() => {
  const intl = useIntl();
  return (
    <div className={styles.header}>
      <div className={styles.headerCell} style={{ gridColumn: 1, gridRow: '1 / span 2' }}>{intl.formatMessage({ id: 'market.symbol' })}</div>
      <div className={clsx(styles.headerCell, styles.colorRef)} style={{ gridColumn: 2, gridRow: '1 / span 2' }}>{intl.formatMessage({ id: 'market.ref' })}</div>
      <div className={clsx(styles.headerCell, styles.colorCeiling)} style={{ gridColumn: 3, gridRow: '1 / span 2' }}>{intl.formatMessage({ id: 'market.ceil' })}</div>
      <div className={clsx(styles.headerCell, styles.colorFloor)} style={{ gridColumn: 4, gridRow: '1 / span 2' }}>{intl.formatMessage({ id: 'market.floor' })}</div>
      <div className={styles.headerGroup} style={{ gridColumn: '5 / span 6' }}>{intl.formatMessage({ id: 'market.buy' })}</div>
      <div className={styles.headerGroup} style={{ gridColumn: '11 / span 4' }}>{intl.formatMessage({ id: 'market.matched' })}</div>
      <div className={styles.headerGroup} style={{ gridColumn: '15 / span 6' }}>{intl.formatMessage({ id: 'market.sell' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 21, gridRow: '1 / span 2' }}>{intl.formatMessage({ id: 'market.total_vol' })}</div>
      <div className={styles.headerGroup} style={{ gridColumn: '22 / span 3' }}>{intl.formatMessage({ id: 'market.price' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 5 }}>{intl.formatMessage({ id: 'market.price_n' }, { n: 3 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 6 }}>{intl.formatMessage({ id: 'market.vol_n' }, { n: 3 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 7 }}>{intl.formatMessage({ id: 'market.price_n' }, { n: 2 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 8 }}>{intl.formatMessage({ id: 'market.vol_n' }, { n: 2 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 9 }}>{intl.formatMessage({ id: 'market.price_n' }, { n: 1 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 10 }}>{intl.formatMessage({ id: 'market.vol_n' }, { n: 1 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 11 }}>{intl.formatMessage({ id: 'market.price' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 12 }}>{intl.formatMessage({ id: 'market.total_vol' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 13 }}>{intl.formatMessage({ id: 'market.change' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 14 }}>{intl.formatMessage({ id: 'market.percent' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 15 }}>{intl.formatMessage({ id: 'market.price_n' }, { n: 1 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 16 }}>{intl.formatMessage({ id: 'market.vol_n' }, { n: 1 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 17 }}>{intl.formatMessage({ id: 'market.price_n' }, { n: 2 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 18 }}>{intl.formatMessage({ id: 'market.vol_n' }, { n: 2 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 19 }}>{intl.formatMessage({ id: 'market.price_n' }, { n: 3 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 20 }}>{intl.formatMessage({ id: 'market.vol_n' }, { n: 3 })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 22 }}>{intl.formatMessage({ id: 'market.high' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 23 }}>{intl.formatMessage({ id: 'market.avg' })}</div>
      <div className={styles.headerCell} style={{ gridColumn: 24 }}>{intl.formatMessage({ id: 'market.low' })}</div>
    </div>
  );
});

const VirtualRow = memo(({ index, style, data }: ListChildComponentProps< VirtualRowData>) => {
  const sym = data.unpinnedSymbols[index];

  return (
    <StockRow
      symbol={sym}
      isHighlighted={data.highlightedSymbol === sym}
      isPinned={false}
      style={style}
    />
  );
});

VirtualRow.displayName = 'VirtualRow';
StockRow.displayName = 'StockRow';
TableHeader.displayName = 'TableHeader';

export default function MarketTable() {
  const highlightedSymbol = useAppSelector(selectHighlightedSymbol);
  const pinnedSymbols = useAppSelector(selectPinnedFilteredStockSymbols);
  const unpinnedSymbols = useAppSelector(selectUnpinnedFilteredStockSymbols);
  const listRef = useRef<List>(null);
  const virtualData = useMemo(() => ({
    unpinnedSymbols,
    highlightedSymbol
  }), [unpinnedSymbols, highlightedSymbol]);
  
  const [ref, bounds] = useMeasure();

  useEffect(() => {
    if (!highlightedSymbol || !listRef.current) return;

    const index = unpinnedSymbols.indexOf(highlightedSymbol);

    if (index >= 0) {
      listRef.current.scrollToItem(index, "start");
    }
  }, [highlightedSymbol, unpinnedSymbols]);

  return (
    <div className={styles.tableWrapper}>
      <div className={clsx(styles.pinnedTable, pinnedSymbols.length === 0 && styles.emptyPinned)}>
        <TableHeader />
        <div className={styles.pinnedBody}>
          {pinnedSymbols.map((sym: string) => (
            <StockRow
              key={sym}
              symbol={sym}
              isHighlighted={highlightedSymbol === sym}
              isPinned={true}
            />
          ))}
        </div>
      </div>

      <div ref={ref} className={styles.scrollableTableContainer}>
        <div className={styles.body}>
          {bounds.width > 0 && bounds.height > 0 && (
            <List
              key={unpinnedSymbols.length}
              ref={listRef}
              height={bounds.height}
              width={bounds.width}
              itemKey={(index, data) => data.unpinnedSymbols[index]}
              itemCount={unpinnedSymbols.length}
              itemSize={28}
              overscanCount={4}
              itemData={virtualData}
            >
              {VirtualRow}
            </List>
          )}
        </div>
      </div>
    </div>
  );
}
