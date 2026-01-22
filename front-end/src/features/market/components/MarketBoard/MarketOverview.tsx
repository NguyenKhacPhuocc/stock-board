import styles from "@/features/market/components/MarketBoard/MarketBoard.module.scss";
import MarketIndexCard from "./MarketIndexCard";

export default function MarketOverview() {
    return (
        <>
            <div className={styles.marketIndex}>
                <MarketIndexCard />
            </div>
            <div className={styles.marketIndex}>
                <MarketIndexCard />
            </div>
            <div className={styles.marketIndex}>
                <MarketIndexCard />
            </div>
            <div className={styles.marketIndex}>
                <MarketIndexCard />
            </div>
            <div className={styles.marketIndex}>
                <MarketIndexCard />
            </div>
        </>
    );
}