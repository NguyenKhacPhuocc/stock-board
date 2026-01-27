import styles from "./MarketBoard.module.scss";
import overviewStyles from "./MarketOverview/MarketOverview.module.scss";
import MarketOverview from "./MarketOverview/MarketOverview";
import MarketToolBar from "./MarketTable/MarketToolBar";
import MarketTable from "./MarketTable/MarketTable";
import { useAppSelector } from "@/app/hooks";
import { selectSelectedExchange } from "../marketSelectors";
import { MarketWS } from "../marketWs";

export default function MarketBoard() {
  const selectedExchange = useAppSelector(selectSelectedExchange);

  // Establish WebSocket connection for real-time updates
  // MarketWS handles its own lifecycle and only subscribes when data is ready
  MarketWS(selectedExchange);

  return (
    <div className={styles.marketBoard}>
      <div className={overviewStyles.marketBoardOverview}>
        <MarketOverview />
      </div>
      <div className={styles.marketBoardTable}>
        <MarketToolBar />
        <MarketTable />
      </div>
    </div>
  );
}
