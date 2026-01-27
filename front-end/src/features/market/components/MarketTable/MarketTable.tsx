import { memo, useEffect, useRef } from "react";
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
import { marketCache } from "../../marketCache";
import MarketCell from "./MarketCell";
import styles from "./MarketTable.module.scss";

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
    <td>
      <PinIcon
        className={clsx(styles.iconPin, isPinned && styles.pinned)}
        onDoubleClick={handlePinToggle}
      >
        <title>{intl.formatMessage({ id: 'market.pin' })}</title>
      </PinIcon>
      <span className={colorCode}>{symbol}</span>
    </td>
  );
});

SymbolCell.displayName = 'SymbolCell';

const StockRow = memo(({
  symbol,
  isHighlighted,
  isPinned,
}: {
  symbol: string;
  isHighlighted: boolean;
  isPinned: boolean;
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isHighlighted || !rowRef.current) return;

    rowRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    const timer = setTimeout(() => {
      dispatch(setHighlightedSymbol(null));
    }, HIGHLIGHT_TIMEOUT);

    return () => clearTimeout(timer);
  }, [isHighlighted, dispatch]);

  return (
    <tr
      ref={rowRef}
      className={clsx(
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
    </tr>
  );
});

const TableColGroup = memo(() => (
  <colgroup>
    <col style={{ width: "100px" }} />
    <col style={{ width: "40px" }} />
    <col style={{ width: "40px" }} />
    <col style={{ width: "40px" }} />
    {Array.from({ length: 20 }).map((_, i) => <col key={i} />)}
  </colgroup>
));

const TableHeader = memo(() => {
  const intl = useIntl();
  return (
    <thead>
      <tr>
        <th rowSpan={2}>{intl.formatMessage({ id: 'market.symbol' })}</th>
        <th rowSpan={2} className={styles.colorRef}>{intl.formatMessage({ id: 'market.ref' })}</th>
        <th rowSpan={2} className={styles.colorCeiling}>{intl.formatMessage({ id: 'market.ceil' })}</th>
        <th rowSpan={2} className={styles.colorFloor}>{intl.formatMessage({ id: 'market.floor' })}</th>
        <th colSpan={6}>{intl.formatMessage({ id: 'market.buy' })}</th>
        <th colSpan={4}>{intl.formatMessage({ id: 'market.matched' })}</th>
        <th colSpan={6}>{intl.formatMessage({ id: 'market.sell' })}</th>
        <th rowSpan={2}>{intl.formatMessage({ id: 'market.total_vol' })}</th>
        <th colSpan={3}>{intl.formatMessage({ id: 'market.price' })}</th>
      </tr>
      <tr className={styles.subHeader}>
        <th>{intl.formatMessage({ id: 'market.price_n' }, { n: 3 })}</th>
        <th>{intl.formatMessage({ id: 'market.vol_n' }, { n: 3 })}</th>
        <th>{intl.formatMessage({ id: 'market.price_n' }, { n: 2 })}</th>
        <th>{intl.formatMessage({ id: 'market.vol_n' }, { n: 2 })}</th>
        <th>{intl.formatMessage({ id: 'market.price_n' }, { n: 1 })}</th>
        <th>{intl.formatMessage({ id: 'market.vol_n' }, { n: 1 })}</th>
        <th>{intl.formatMessage({ id: 'market.price' })}</th>
        <th>{intl.formatMessage({ id: 'market.total_vol' })}</th>
        <th>{intl.formatMessage({ id: 'market.change' })}</th>
        <th>{intl.formatMessage({ id: 'market.percent' })}</th>
        <th>{intl.formatMessage({ id: 'market.price_n' }, { n: 1 })}</th>
        <th>{intl.formatMessage({ id: 'market.vol_n' }, { n: 1 })}</th>
        <th>{intl.formatMessage({ id: 'market.price_n' }, { n: 2 })}</th>
        <th>{intl.formatMessage({ id: 'market.vol_n' }, { n: 2 })}</th>
        <th>{intl.formatMessage({ id: 'market.price_n' }, { n: 3 })}</th>
        <th>{intl.formatMessage({ id: 'market.vol_n' }, { n: 3 })}</th>
        <th>{intl.formatMessage({ id: 'market.high' })}</th>
        <th>{intl.formatMessage({ id: 'market.avg' })}</th>
        <th>{intl.formatMessage({ id: 'market.low' })}</th>
      </tr>
    </thead>
  );
});

StockRow.displayName = 'StockRow';
TableColGroup.displayName = 'TableColGroup';
TableHeader.displayName = 'TableHeader';

export default function MarketTable() {
  const highlightedSymbol = useAppSelector(selectHighlightedSymbol);
  const pinnedSymbols = useAppSelector(selectPinnedFilteredStockSymbols);
  const unpinnedSymbols = useAppSelector(selectUnpinnedFilteredStockSymbols);
  const allStocks = useAppSelector(state => state.market.stocks);

  useEffect(() => {
    if (allStocks.length > 0) {
      marketCache.setInitialData(allStocks);
    }
  }, [allStocks]);

  return (
    <div className={styles.tableWrapper}>
      <table className={clsx(styles.pinnedTable, pinnedSymbols.length === 0 && styles.emptyPinned)}>
        <TableColGroup />
        <TableHeader />
        <tbody>
          {pinnedSymbols.map((sym: string) => (
            <StockRow
              key={sym}
              symbol={sym}
              isHighlighted={highlightedSymbol === sym}
              isPinned={true}
            />
          ))}
        </tbody>
      </table>

      <div className={styles.scrollableTableContainer}>
        <table>
          <TableColGroup />
          <tbody className="unpinned-body">
            {unpinnedSymbols.map((sym: string) => (
              <StockRow
                key={sym}
                symbol={sym}
                isHighlighted={highlightedSymbol === sym}
                isPinned={false}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
