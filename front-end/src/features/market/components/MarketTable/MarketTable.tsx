import { memo, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import styles from "./MarketTable.module.scss";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchInstruments, setHighlightedSymbol, togglePin } from "../../marketSlice";
import {
  selectPinnedFilteredStockSymbols,
  selectUnpinnedFilteredStockSymbols,
  selectHighlightedSymbol
} from "../../marketSelectors";
import { getColorClass } from "../../marketUtils";
import { PinIcon } from "lucide-react";
import clsx from "clsx";
import MarketCell from "./MarketCell";

const StockRow = memo(({
  symbol,
  isHighlighted,
  isPinned,
}: {
  symbol: string,
  isHighlighted: boolean,
  isPinned: boolean,
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const dispatch = useAppDispatch();

  // Select only basic info needed for the row shell
  // Note: we still need RE/CL/FL for the symbol color
  const { RE, CL, FL, CP } = useAppSelector(state => {
    const s = state.market.entities[symbol];
    return {
      RE: s?.RE || 0,
      CL: s?.CL || 0,
      FL: s?.FL || 0,
      CP: s?.CP
    };
  }, (prev, next) => (
    prev.RE === next.RE &&
    prev.CL === next.CL &&
    prev.FL === next.FL &&
    prev.CP === next.CP
  ));

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      const timer = setTimeout(() => {
        dispatch(setHighlightedSymbol(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, dispatch]);

  const colorCode = getColorClass(CP || RE, RE, CL, FL);
  const intl = useIntl();

  return (
    <tr
      ref={rowRef}
      className={clsx(
        isHighlighted && styles.rowHighlighted,
        isPinned && styles.rowPinned
      )}
    >
      <td>
        <PinIcon
          className={clsx(styles.iconPin, isPinned && styles.pinned)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            dispatch(togglePin(symbol));
          }}
        >
          <title>{intl.formatMessage({ id: 'market.pin' })}</title>
        </PinIcon>
        <span className={colorCode}>
          {symbol}
        </span>
      </td>

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
      <MarketCell symbol={symbol} field="TT" type="vol" fixedColorClass={styles.colorRef} />
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

import { marketDataService } from "../../marketDataService";

export default function MarketTable() {
  const dispatch = useAppDispatch();
  const highlightedSymbol = useAppSelector(selectHighlightedSymbol);
  const pinnedSymbols = useAppSelector(selectPinnedFilteredStockSymbols);
  const unpinnedSymbols = useAppSelector(selectUnpinnedFilteredStockSymbols);
  const allStocks = useAppSelector(state => state.market.stocks);

  // Sync Redux snapshot to High Performance Service
  useEffect(() => {
    if (allStocks.length > 0) {
      marketDataService.setInitialData(allStocks);
    }
  }, [allStocks]);

  useEffect(() => {
    dispatch(fetchInstruments("HOSE"));
  }, [dispatch]);

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
