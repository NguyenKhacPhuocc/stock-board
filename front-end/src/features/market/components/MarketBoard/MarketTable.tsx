import { useEffect, memo } from "react";
import styles from "./MarketBoard.module.scss";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchInstruments } from "../../marketSlice";
import { selectMarketStocks } from "../../marketSelectors";
import { formatPrice, formatVol, getColorClass } from "../../marketUtils";
import type { StockInstrument } from "../../marketTypes";
import { PinIcon } from "lucide-react";


const StockRow = memo(({ item }: { item: StockInstrument }) => {
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
        buyForeignVol,
        sellForeignVol,
    } = item;

    const ref = reference || 0;
    const ceil = ceiling || 0;
    const flr = floor || 0;
    const lastPrice = closePrice || ref;
    const changeValue = change !== undefined ? change : 0;

    return (
        <tr>
            <td>
                <PinIcon />
                <span className={getColorClass(lastPrice, ref, ceil, flr)}>
                    {symbol}
                </span>
            </td>
            <td className={styles.colorRef}>{formatPrice(ref)}</td>
            <td className={styles.colorCeiling}>{formatPrice(ceil)}</td>
            <td className={styles.colorFloor}>{formatPrice(flr)}</td>

            {/* Buy Side */}
            <td className={getColorClass(bidPrice3, ref, ceil, flr)}>{formatPrice(bidPrice3)}</td>
            <td>{formatVol(bidVol3)}</td>
            <td className={getColorClass(bidPrice2, ref, ceil, flr)}>{formatPrice(bidPrice2)}</td>
            <td>{formatVol(bidVol2)}</td>
            <td className={getColorClass(bidPrice1, ref, ceil, flr)}>{formatPrice(bidPrice1)}</td>
            <td>{formatVol(bidVol1)}</td>

            {/* Matching */}
            <td className={getColorClass(lastPrice, ref, ceil, flr)}>{formatPrice(lastPrice)}</td>
            <td>{formatVol(closeVol)}</td>
            <td className={getColorClass(lastPrice, ref, ceil, flr)}>
                {changeValue > 0 ? `+${(changeValue / 1000).toFixed(2)}` : (changeValue / 1000).toFixed(2)}
            </td>
            <td className={getColorClass(lastPrice, ref, ceil, flr)}>
                {ratioChange !== undefined ? `${(ratioChange * 100).toFixed(1)}%` : "0.0%"}
            </td>

            {/* Sell Side */}
            <td className={getColorClass(offerPrice1, ref, ceil, flr)}>{formatPrice(offerPrice1)}</td>
            <td>{formatVol(offerVol1)}</td>
            <td className={getColorClass(offerPrice2, ref, ceil, flr)}>{formatPrice(offerPrice2)}</td>
            <td>{formatVol(offerVol2)}</td>
            <td className={getColorClass(offerPrice3, ref, ceil, flr)}>{formatPrice(offerPrice3)}</td>
            <td>{formatVol(offerVol3)}</td>

            {/* Volume and Prices */}
            <td>{formatVol(totalTradedQtty || closeVol)}</td>
            <td className={styles.colorUp}>{formatPrice(high)}</td>
            <td className={getColorClass(averagePrice, ref, ceil, flr)}>{formatPrice(averagePrice)}</td>
            <td className={styles.colorDown}>{formatPrice(low)}</td>

            {/* Foreign */}
            <td>{formatVol(buyForeignVol)}</td>
            <td>{formatVol(sellForeignVol)}</td>
        </tr>
    );
});

export default function MarketTable() {
    const dispatch = useAppDispatch();
    const stocks = useAppSelector(selectMarketStocks);

    useEffect(() => {
        dispatch(fetchInstruments("HOSE"));
    }, [dispatch]);

    return (
        <div className={styles.tableWrapper}>
            <table>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ width: "80px" }}>Symbol</th>
                        <th rowSpan={2} style={{ width: "40px" }} className={styles.colorRef}>Ref</th>
                        <th rowSpan={2} style={{ width: "40px" }} className={styles.colorCeiling}>Ceil</th>
                        <th rowSpan={2} style={{ width: "40px" }} className={styles.colorFloor}>Floor</th>
                        <th colSpan={6}>Buy</th>
                        <th colSpan={4}>Matching</th>
                        <th colSpan={6}>Sell</th>
                        <th rowSpan={2}>Total Vol</th>
                        <th colSpan={3}>Price</th>
                        <th colSpan={2}>Foreign</th>
                    </tr>
                    <tr className={styles.subHeader}>
                        <th>P3</th><th>V3</th><th>P2</th><th>V2</th><th>P1</th><th>V1</th>
                        <th>P</th><th>V</th><th>+/-</th><th>%</th>
                        <th>P1</th><th>V1</th><th>P2</th><th>V2</th><th>P3</th><th>V3</th>
                        <th>High</th><th>Avg</th><th>Low</th>
                        <th>Buy</th><th>Sell</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.slice(0, 100).map((item: StockInstrument) => (
                        <StockRow key={item.symbol} item={item} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
