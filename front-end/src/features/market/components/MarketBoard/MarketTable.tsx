import { useEffect, memo, useRef } from "react";
import styles from "./MarketBoard.module.scss";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchInstruments, setHighlightedSymbol, togglePin } from "../../marketSlice";
import { selectFilteredStocks, selectHighlightedSymbol, selectPinnedSymbols } from "../../marketSelectors";
import { getColorClass } from "../../marketUtils";
import type { StockInstrument } from "../../marketTypes";
import { PinIcon } from "lucide-react";
import clsx from "clsx";
import MarketCell from "./MarketCell";


const StockRow = memo(({
  item,
  isHighlighted,
  isPinned,
}: {
  item: StockInstrument,
  isHighlighted: boolean,
  isPinned: boolean,
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const dispatch = useAppDispatch();

  // for highlight search row
  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      const timer = setTimeout(() => {
        dispatch(setHighlightedSymbol(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, dispatch]);

  const {
    symbol,
    reference,
    ceiling,
    floor,
    bidPrice1,
    bidVol1,
    bidPrice2,
    bidVol2,
    bidPrice3,
    bidVol3,
    offerPrice1,
    offerVol1,
    offerPrice2,
    offerVol2,
    offerPrice3,
    offerVol3,
    closePrice,
    closeVol,
    change,
    ratioChange,
    high,
    low,
    averagePrice,
    totalTradedQtty,
    // buyForeignVol,
    // sellForeignVol,
  } = item;

  const ref = reference || 0;
  const ceil = ceiling || 0;
  const flr = floor || 0;
  const lastPrice = closePrice || ref;
  const changeValue = change !== undefined ? change : 0;

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
        />
        <span className={getColorClass(lastPrice, ref, ceil, flr)}>
          {symbol}
        </span>
      </td>

      {/* Reference, Ceiling, Floor - static values, no flash needed */}
      <MarketCell value={ref} type="price" colorClass={styles.colorRef} />
      <MarketCell value={ceil} type="price" colorClass={styles.colorCeiling} />
      <MarketCell value={flr} type="price" colorClass={styles.colorFloor} />

      {/* Buy Side - dynamic values with flash */}
      <MarketCell value={bidPrice3} type="price" colorClass={getColorClass(bidPrice3, ref, ceil, flr)} />
      <MarketCell value={bidVol3} type="vol" colorClass={getColorClass(bidPrice3, ref, ceil, flr)} />
      <MarketCell value={bidPrice2} type="price" colorClass={getColorClass(bidPrice2, ref, ceil, flr)} />
      <MarketCell value={bidVol2} type="vol" colorClass={getColorClass(bidPrice2, ref, ceil, flr)} />
      <MarketCell value={bidPrice1} type="price" colorClass={getColorClass(bidPrice1, ref, ceil, flr)} />
      <MarketCell value={bidVol1} type="vol" colorClass={getColorClass(bidPrice1, ref, ceil, flr)} />

      {/* Matching */}
      <MarketCell value={lastPrice} type="price" colorClass={getColorClass(lastPrice, ref, ceil, flr)} />
      <MarketCell value={closeVol} type="vol" colorClass={getColorClass(lastPrice, ref, ceil, flr)} />
      <td className={getColorClass(lastPrice, ref, ceil, flr)}>
        {changeValue > 0 ? `+${(changeValue / 1000).toFixed(2)}` : (changeValue / 1000).toFixed(2)}
      </td>
      <td className={getColorClass(lastPrice, ref, ceil, flr)}>
        {ratioChange !== undefined ? `${(ratioChange * 100).toFixed(1)}%` : "0.0%"}
      </td>

      {/* Sell Side */}
      <MarketCell value={offerPrice1} type="price" colorClass={getColorClass(offerPrice1, ref, ceil, flr)} />
      <MarketCell value={offerVol1} type="vol" colorClass={getColorClass(offerPrice1, ref, ceil, flr)} />
      <MarketCell value={offerPrice2} type="price" colorClass={getColorClass(offerPrice2, ref, ceil, flr)} />
      <MarketCell value={offerVol2} type="vol" colorClass={getColorClass(offerPrice2, ref, ceil, flr)} />
      <MarketCell value={offerPrice3} type="price" colorClass={getColorClass(offerPrice3, ref, ceil, flr)} />
      <MarketCell value={offerVol3} type="vol" colorClass={getColorClass(offerPrice3, ref, ceil, flr)} />

      {/* Volume and Prices */}
      <MarketCell value={totalTradedQtty || closeVol} type="vol" />
      <MarketCell value={high} type="price" colorClass={styles.colorUp} />
      <MarketCell value={averagePrice} type="price" colorClass={getColorClass(averagePrice, ref, ceil, flr)} />
      <MarketCell value={low} type="price" colorClass={styles.colorDown} />
    </tr>
  );
});

const TableColGroup = memo(() => (
  <colgroup>
    <col style={{ width: "100px" }} />
    <col style={{ width: "40px" }} />
    <col style={{ width: "40px" }} />
    <col style={{ width: "40px" }} />
    {/* 20 remaining columns auto-distributed */}
    {Array.from({ length: 20 }).map((_, i) => <col key={i} />)}
  </colgroup>
));

const TableHeader = memo(() => (
  <thead>
    <tr>
      <th rowSpan={2}>Mã CK</th>
      <th rowSpan={2} className={styles.colorRef}>TC</th>
      <th rowSpan={2} className={styles.colorCeiling}>Trần</th>
      <th rowSpan={2} className={styles.colorFloor}>Sàn</th>
      <th colSpan={6}>Mua</th>
      <th colSpan={4}>Khớp lệnh</th>
      <th colSpan={6}>Bán</th>
      <th rowSpan={2}>Tổng KL</th>
      <th colSpan={3}>Giá</th>
    </tr>
    <tr className={styles.subHeader}>
      <th>Giá 3</th><th>KL 3</th><th>Giá 2</th><th>KL 2</th><th>Giá 1</th><th>KL 1</th>
      <th>Giá</th><th>KL</th><th>+/-</th><th>%</th>
      <th>Giá 1</th><th>KL 1</th><th>Giá 2</th><th>KL 2</th><th>Giá 3</th><th>KL 3</th>
      <th>Cao</th><th>TB</th><th>Thấp</th>
    </tr>
  </thead>
));

export default function MarketTable() {
  const dispatch = useAppDispatch();
  const highlightedSymbol = useAppSelector(selectHighlightedSymbol);

  // Use selectors efficiently
  const pinnedStocks = useAppSelector(state => {
    const all = selectFilteredStocks(state);
    const pinned = selectPinnedSymbols(state);
    return all.filter(s => pinned.includes(s.symbol));
  });

  const unpinnedStocks = useAppSelector(state => {
    const all = selectFilteredStocks(state);
    const pinned = selectPinnedSymbols(state);
    return all.filter(s => !pinned.includes(s.symbol));
  });

  useEffect(() => {
    dispatch(fetchInstruments("HOSE"));
  }, [dispatch]);

  return (
    <div className={styles.tableWrapper}>
      {/* Pinned Table - Fixed at Top */}
      <table className={clsx(styles.pinnedTable, pinnedStocks.length === 0 && styles.emptyPinned)}>
        <TableColGroup />
        <TableHeader />
        <tbody>
          {pinnedStocks.map((item: StockInstrument) => (
            <StockRow
              key={item.symbol}
              item={item}
              isHighlighted={highlightedSymbol === item.symbol}
              isPinned={true}
            />
          ))}
        </tbody>
      </table>

      {/* Unpinned Table - Scrollable */}
      <div className={styles.scrollableTableContainer}>
        <table>
          <TableColGroup />
          <tbody className="unpinned-body">
            {unpinnedStocks.map((item: StockInstrument) => (
              <StockRow
                key={item.symbol}
                item={item}
                isHighlighted={highlightedSymbol === item.symbol}
                isPinned={false}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
