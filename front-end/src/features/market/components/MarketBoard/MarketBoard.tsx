import styles from "@/features/market/components/MarketBoard/MarketBoard.module.scss";
import MarketOverview from "./MarketOverview";
import MarketToolBar from "./MarketToolBar";
import MarketTable from "./MarketTable";
import { useAppSelector } from "@/app/hooks";
import { selectSelectedExchange } from "../../marketSelectors";
import { MarketWS } from "../../marketWs";

export default function MarketBoard() {
  const selectedExchange = useAppSelector(selectSelectedExchange);

  // Establish WebSocket connection for real-time updates
  // MarketWS handles its own lifecycle and only subscribes when data is ready
  MarketWS(selectedExchange);

  return (
    <div className={styles.marketBoard}>
      <div className={styles.marketBoardOverview}>
        <MarketOverview />
      </div>
      <div className={styles.marketBoardTable}>
        <MarketToolBar />
        <MarketTable />
      </div>
    </div>
  );
}
