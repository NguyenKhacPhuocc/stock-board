import { useState, useRef, useEffect } from "react";
import { useIntl } from "react-intl";
import clsx from "clsx";
import { ChevronDown, ChevronUp, Search, Settings, Video } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setSelectedExchange, setSelectedType, setHighlightedSymbol } from "../../marketSlice";
import { selectSelectedExchange, selectSelectedType, selectSearchStocks } from "../../marketSelectors";
import type { StockInstrument, ExchangeType } from "../../marketTypes";
import styles from "./MarketToolBar.module.scss";
import { EXCHANGES } from "@/constants/exchanges";


function sortSuggestions(stocks: StockInstrument[], searchTerm: string): StockInstrument[] {
  const term = searchTerm.toUpperCase();

  return stocks.sort((a, b) => {
    const aSym = a.SB.toUpperCase();
    const bSym = b.SB.toUpperCase();

    if (aSym === term) return -1;
    if (bSym === term) return 1;

    const aStarts = aSym.startsWith(term);
    const bStarts = bSym.startsWith(term);

    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    if (aSym.length !== bSym.length) return aSym.length - bSym.length;

    return aSym.localeCompare(bSym);
  });
}

function filterStocks(stocks: StockInstrument[], searchTerm: string): StockInstrument[] {
  if (!searchTerm) return [];

  const term = searchTerm.toUpperCase();
  const filtered = stocks.filter((stock) => stock.SB.toUpperCase().includes(term));
  return sortSuggestions(filtered, searchTerm);
}

// Disabled since WARRANT/ETF tabs are disabled
// function getStockType(stock: StockInstrument): string {
//   if (stock.StockType === '4' || stock.SB.startsWith('C')) return 'WARRANT';
//   if (stock.SB.startsWith('E') || stock.SB.startsWith('FU')) return 'ETF';
//   return 'STOCK';
// }

export default function MarketToolBar() {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const selectedExchange = useAppSelector(selectSelectedExchange);
  const selectedType = useAppSelector(selectSelectedType);
  const searchStocks = useAppSelector(selectSearchStocks);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = filterStocks(searchStocks, searchTerm);

  const handleExchangeClick = (exchange: ExchangeType) => {
    dispatch(setSelectedExchange(exchange));
    dispatch(setSelectedType('STOCK'));
  };

  const handleSelectStock = (stock: StockInstrument) => {
    const targetExchange = stock.exchange || selectedExchange;
    // Since WARRANT/ETF tabs are disabled, always use STOCK type
    // const targetType = getStockType(stock);

    if (targetExchange !== selectedExchange) {
      dispatch(setSelectedExchange(targetExchange as ExchangeType));
    }

    // Always set to STOCK since WARRANT/ETF are disabled
    dispatch(setSelectedType('STOCK'));
    dispatch(setHighlightedSymbol(stock.SB));

    setSearchTerm(stock.SB);
    setShowSuggestions(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value.toUpperCase());
    setShowSuggestions(true);
  };

  return (
    <div className={styles.marketToolBar}>
      <div className={styles.toolBarLeft}>
        <div className={styles.searchBox} ref={searchRef}>
          <Search className={styles.icon} />
          <input
            type="text"
            placeholder={intl.formatMessage({ id: 'common.search_symbol' })}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            style={{ textTransform: 'uppercase' }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.searchSuggestions}>
              {suggestions.map(s => (
                <div
                  key={s.SB}
                  className={styles.suggestionItem}
                  onClick={() => handleSelectStock(s)}
                >
                  <span className={styles.symbol}>{s.SB}</span>
                  <span className={styles.exchange}>{s.exchange}</span>
                  <span className={styles.name}>{s.FullName || s.IssuerName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.dropdownBtn}>
          {intl.formatMessage({ id: 'market.watchlist' })} <ChevronDown className={styles.icon} />
        </div>

        <div className={styles.marketTabs}>
          {EXCHANGES.map((ex) => {
            const isActive = selectedExchange === ex && (selectedType === 'STOCK' || selectedType === 'ALL');
            return (
              <div
                key={ex}
                className={clsx(styles.tab, isActive && styles.active)}
                onClick={() => handleExchangeClick(ex)}
              >
                {ex}
              </div>
            );
          })}
        </div>

        {/* <div className={clsx(styles.marketTabs, styles.secondaryTabs)}>
          <div
            className={clsx(styles.tab, selectedType === 'WARRANT' && styles.active)}
            onClick={() => handleTypeClick('WARRANT')}
          >
            {intl.formatMessage({ id: 'market.warrants' })}
          </div>
          <div
            className={clsx(styles.tab, selectedType === 'ETF' && styles.active)}
            onClick={() => handleTypeClick('ETF')}
          >
            {intl.formatMessage({ id: 'market.etf' })}
          </div>
        </div> */}
      </div>

      <div className={styles.toolBarRight}>
        <div className={styles.dropdownBtn}>
          Buy In <ChevronDown className={styles.icon} />
        </div>
        <div className={styles.iconBtn} title={intl.formatMessage({ id: 'common.presentation_mode' })}><Video className={styles.icon} /></div>
        <div className={styles.iconBtn} title={intl.formatMessage({ id: 'common.settings' })}><Settings className={styles.icon} /></div>
        <div className={styles.iconBtn} title={intl.formatMessage({ id: 'common.collapse' })}><ChevronUp className={styles.icon} /></div>
      </div>
    </div>
  );
}
