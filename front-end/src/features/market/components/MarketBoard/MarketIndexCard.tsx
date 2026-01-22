import styles from "@/features/market/components/MarketBoard/MarketBoard.module.scss";
import MarketIndexChart from "./MarketIndexChart";

export default function MarketIndexCard() {
    return (
        <div className={styles.card}>
            <div className={styles.chart}>
                <MarketIndexChart />
            </div>

            <div className={styles.summary}>
                <div className={styles.title}>VN-INDEX</div>
                <div className={styles.value}>1,890.33</div>
                <div className={styles.change}>+48.90 (+2.65%)</div>
            </div>
        </div>
    );
}