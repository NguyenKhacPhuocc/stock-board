import { ChevronDown, Search, Settings } from "lucide-react";
import styles from "./MarketBoard.module.scss";

export default function MarketToolBar() {
    return (
        <div className={styles.marketToolBar}>
            <div className={styles.toolBarLeft}>
                <div className={styles.searchBox}>
                    <Search />
                    <input type="text" placeholder="Add symbol" />
                </div>

                <div className={styles.dropdownBtn}>
                    Watchlist <ChevronDown />
                </div>

                <div className={styles.marketTabs}>
                    <div className={`${styles.tab} ${styles.active}`}>HOSE</div>
                    <div className={styles.tab}>HNX</div>
                    <div className={styles.tab}>UPCOM</div>
                </div>

                <div className={styles.dropdownBtn}>
                    Sectors <ChevronDown />
                </div>

                <div className={`${styles.marketTabs} ${styles.secondaryTabs}`}>
                    <div className={styles.tab}>Warrants</div>
                    <div className={styles.tab}>Bonds</div>
                    <div className={styles.tab}>ETF</div>
                    <div className={styles.tab}>TPRL</div>
                    <div className={styles.tab}>Odd lot <ChevronDown /></div>
                </div>
            </div>

            <div className={styles.toolBarRight}>
                <div className={styles.dropdownBtn}>
                    Analysis Tools <ChevronDown />
                </div>
                <div className={styles.dropdownBtn}>
                    Buy In <ChevronDown />
                </div>
                <div className={styles.iconBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                </div>
                <div className={styles.iconBtn}><Settings /></div>
                <div className={styles.iconBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
