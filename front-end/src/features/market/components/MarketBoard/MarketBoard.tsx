import styles from "@/features/market/components/MarketBoard/MarketBoard.module.scss";
import MarketOverview from "./MarketOverview";

export default function MarketBoard() {
  return (
    <div className={styles.marketBoard}>
      <div className={styles.marketBoardOverview}>
        <MarketOverview />
      </div>
      <div className={styles.marketBoardTable}>
        a
      </div>
    </div>
  );
}
