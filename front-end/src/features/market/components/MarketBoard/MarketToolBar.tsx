import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Settings, Video } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchInstruments, setSelectedExchange, setSelectedType, fetchAllInstruments, setHighlightedSymbol } from "../../marketSlice";
import { selectSelectedExchange, selectSelectedType, selectAllStocks } from "../../marketSelectors";
import type { MarketSymbolType, StockInstrument } from "../../marketTypes";
import styles from "./MarketBoard.module.scss";

export default function MarketToolBar() {
  const dispatch = useAppDispatch();
  const selectedExchange = useAppSelector(selectSelectedExchange);
  const selectedType = useAppSelector(selectSelectedType);
  const allStocks = useAppSelector(selectAllStocks);

  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchAllInstruments());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = searchTerm.length > 0
    ? allStocks
      .filter(s => s.symbol.toUpperCase().includes(searchTerm.toUpperCase()))
      .sort((a, b) => {
        const term = searchTerm.toUpperCase();
        const aSym = a.symbol.toUpperCase();
        const bSym = b.symbol.toUpperCase();
        if (aSym === term) return -1;
        if (bSym === term) return 1;
        const aStarts = aSym.startsWith(term);
        const bStarts = bSym.startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        if (aSym.length !== bSym.length) return aSym.length - bSym.length;
        return aSym.localeCompare(bSym);
      })
    : [];

  const handleExchangeClick = (exchange: string) => {
    dispatch(setSelectedExchange(exchange));
    dispatch(setSelectedType('STOCK'));
    dispatch(fetchInstruments(exchange));
  };

  const handleTypeClick = (type: MarketSymbolType) => {
    dispatch(setSelectedType(type));
  };

  const handleSelectStock = (stock: StockInstrument) => {
    const targetExchange = stock.exchange || selectedExchange;

    // Nếu mã nằm ở sàn khác, chuyển sàn
    if (targetExchange !== selectedExchange) {
      dispatch(setSelectedExchange(targetExchange));
      dispatch(fetchInstruments(targetExchange));
    }

    // Tự động chọn đúng loại hình (Cổ phiếu/Chứng quyền/ETF) cho mã đó
    let targetType: MarketSymbolType = 'STOCK';
    if (stock.StockType === '4' || stock.symbol.startsWith('C')) targetType = 'WARRANT';
    else if (stock.symbol.startsWith('E') || stock.symbol.startsWith('FU')) targetType = 'ETF';

    dispatch(setSelectedType(targetType));
    dispatch(setHighlightedSymbol(stock.symbol));

    setSearchTerm(stock.symbol);
    setShowSuggestions(false);
  };

  return (
    <div className={styles.marketToolBar}>
      <div className={styles.toolBarLeft}>
        <div className={styles.searchBox} ref={searchRef}>
          <Search className={styles.icon} />
          <input
            type="text"
            placeholder="Tìm mã CK"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value.toUpperCase());
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{ textTransform: 'uppercase' }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.searchSuggestions}>
              {suggestions.map(s => (
                <div
                  key={s.symbol}
                  className={styles.suggestionItem}
                  onClick={() => handleSelectStock(s)}
                >
                  <span className={styles.symbol}>{s.symbol}</span>
                  <span className={styles.exchange}>{s.exchange}</span>
                  <span className={styles.name}>{s.FullName || s.IssuerName}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.dropdownBtn}>
          Danh sách theo dõi <ChevronDown className={styles.icon} />
        </div>

        <div className={styles.marketTabs}>
          {['HOSE', 'HNX', 'UPCOM'].map((ex) => (
            <div
              key={ex}
              className={`${styles.tab} ${selectedExchange === ex && (selectedType === 'STOCK' || selectedType === 'ALL') ? styles.active : ""}`}
              onClick={() => handleExchangeClick(ex)}
            >
              {ex}
            </div>
          ))}
        </div>

        <div className={`${styles.marketTabs} ${styles.secondaryTabs}`}>
          <div
            className={`${styles.tab} ${selectedType === 'WARRANT' ? styles.active : ""}`}
            onClick={() => handleTypeClick('WARRANT')}
          >
            Chứng quyền
          </div>
          <div
            className={`${styles.tab} ${selectedType === 'ETF' ? styles.active : ""}`}
            onClick={() => handleTypeClick('ETF')}
          >
            ETF
          </div>
        </div>
      </div>

      <div className={styles.toolBarRight}>
        {/* <div className={styles.dropdownBtn}>
          Analysis Tools <ChevronDown className={styles.icon} />
        </div> */}
        <div className={styles.dropdownBtn}>
          Buy In <ChevronDown className={styles.icon} />
        </div>
        <div className={styles.iconBtn} title="Chế độ trình chiếu"><Video className={styles.icon} /></div>
        <div className={styles.iconBtn} title="Cài đặt"><Settings className={styles.icon} /></div>
        <div className={styles.iconBtn} title="Thu gọn"><ChevronUp className={styles.icon} /></div>
      </div>
    </div>
  );
}
