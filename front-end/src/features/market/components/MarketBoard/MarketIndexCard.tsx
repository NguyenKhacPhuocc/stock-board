import styles from "@/features/market/components/MarketBoard/MarketBoard.module.scss";
import MarketIndexChart from "./MarketIndexChart";
import type { MarketIndexData } from "@/features/market/marketTypes";
import clsx from "clsx";

interface Props {
  indexData: MarketIndexData;
}

export default function MarketIndexCard({ indexData }: Props) {
  const { name, currentValue, change, changePercent, totalVolume, totalValue, counts, chartData, color, status } = indexData;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatVolume = (vol: number) => {
    return new Intl.NumberFormat('en-US').format(vol);
  };

  return (
    <div className={clsx(styles.card, styles[color])}>
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <button title="Zoom">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          </button>
          <button title="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <MarketIndexChart data={chartData} color={color} />
      </div>

      <div className={styles.summary}>
        <div className={styles.mainInfo}>
          <div className={styles.indexName}>{name}</div>
          <div className={styles.indexValue}>{formatNumber(currentValue)}</div>
          <div className={styles.changeText}>
            {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({changePercent}%)
          </div>
        </div>

        <div className={styles.statsRow}>
          <span className={styles.volumeTotal}>{formatVolume(totalVolume)}</span>
          <span className={styles.valueTotal}>CP {formatNumber(totalValue)} Tỷ</span>
        </div>

        <div className={styles.marketCounts}>
          <div className={clsx(styles.countItem, styles.colorCeiling)}>
            ▲ {counts.ceiling}
          </div>
          <div className={clsx(styles.countItem, styles.colorUp)}>
            ▲ {counts.up}
          </div>
          <div className={clsx(styles.countItem, styles.colorRef)}>
            ■ {counts.reference}
          </div>
          <div className={clsx(styles.countItem, styles.colorDown)}>
            ▼ {counts.down}
          </div>
          <div className={clsx(styles.countItem, styles.colorFloor)}>
            ▼ {counts.floor}
          </div>
          <div className={styles.status}>
            {status === 'closed' ? 'Đóng cửa' : 'Mở cửa'}
          </div>
        </div>
      </div>
    </div>
  );
}