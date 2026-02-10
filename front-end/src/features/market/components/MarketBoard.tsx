import { useEffect, useRef } from 'react';
import styles from './MarketBoard.module.scss';
import overviewStyles from './MarketOverview/MarketOverview.module.scss';
import MarketOverview from './MarketOverview/MarketOverview';
import MarketToolBar from './MarketTable/MarketToolBar';
import MarketTable from './MarketTable/MarketTable';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  initializeMarket,
  loadExchangeStocks,
} from '../marketSlice';
import {
  selectSelectedExchange,
  selectAllQuotes,
} from '../marketSelectors';
import { useMarketWebSocket } from '../marketWs';

export default function MarketBoard() {
  const dispatch = useAppDispatch();
  const selectedExchange = useAppSelector(selectSelectedExchange);
  const allQuotes = useAppSelector(selectAllQuotes);
  const isInitialized = useRef(false);
  const prevExchange = useRef(selectedExchange);

  useMarketWebSocket(selectedExchange);

  // Initialize market data only once on mount
  useEffect(() => {
    if (!isInitialized.current) {
      dispatch(initializeMarket(selectedExchange));
      isInitialized.current = true;
    }
  }, [dispatch, selectedExchange]);

  // When exchange changes (after initialization), only fetch instruments
  useEffect(() => {
    if (isInitialized.current && prevExchange.current !== selectedExchange) {
      dispatch(loadExchangeStocks({ exchange: selectedExchange, quoteData: allQuotes }));
      prevExchange.current = selectedExchange;
    }
  }, [dispatch, selectedExchange, allQuotes]);


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
