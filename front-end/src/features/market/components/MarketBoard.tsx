import { useEffect } from 'react';
import styles from './MarketBoard.module.scss';
import overviewStyles from './MarketOverview/MarketOverview.module.scss';
import MarketOverview from './MarketOverview/MarketOverview';
import MarketToolBar from './MarketTable/MarketToolBar';
import MarketTable from './MarketTable/MarketTable';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  initializeMarket,
  loadExchangeStocks,
  setSelectedExchange,
} from '../marketSlice';
import {
  selectMarketStocks,
  selectMarketLoading,
  selectMarketError,
  selectSelectedExchange,
  selectAllQuotes,
} from '../marketSelectors';
import { useMarketWebSocket } from '../marketWs';

const logger = {
  debug: (msg: string, data?: any) => {
    console.log(`[MarketBoard] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[MarketBoard] ${msg}`, error || '');
  },
};

export default function MarketBoard() {
  const dispatch = useAppDispatch();
  const stocks = useAppSelector(selectMarketStocks);
  const loading = useAppSelector(selectMarketLoading);
  const error = useAppSelector(selectMarketError);
  const selectedExchange = useAppSelector(selectSelectedExchange);
  const allQuotes = useAppSelector(selectAllQuotes);

  useMarketWebSocket(selectedExchange);

  useEffect(() => {
    logger.debug('MarketBoard mounted, initializing market data');
    dispatch(initializeMarket());
  }, [dispatch]);

  useEffect(() => {
    if (allQuotes.size === 0) {
      logger.debug('Waiting for quotes to load...');
      return;
    }

    logger.debug(`Loading stocks for exchange: ${selectedExchange}`);
    dispatch(
      loadExchangeStocks({
        exchange: selectedExchange,
        quoteData: allQuotes,
      })
    );
  }, [selectedExchange, allQuotes, dispatch]);

  const handleExchangeChange = (exchange: 'HOSE' | 'HNX' | 'UPCOM') => {
    logger.debug(`Changing exchange to ${exchange}`);
    dispatch(setSelectedExchange(exchange));
  };

  if (loading && stocks.length === 0) {
    return <div className={styles.loading}>Loading market data...</div>;
  }

  if (error && stocks.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.marketBoard}>
      <div className={overviewStyles.marketBoardOverview}>
        <MarketOverview
          selectedExchange={selectedExchange}
          onExchangeChange={handleExchangeChange}
        />
      </div>
      <div className={styles.marketBoardTable}>
        <MarketToolBar />
        <MarketTable />
      </div>
    </div>
  );
}
