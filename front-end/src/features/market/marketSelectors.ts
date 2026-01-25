import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export const selectMarketStocks = (state: RootState) => state.market.stocks;
export const selectMarketLoading = (state: RootState) => state.market.loading;
export const selectMarketError = (state: RootState) => state.market.error;
export const selectSelectedExchange = (state: RootState) => state.market.selectedExchange;
export const selectSelectedType = (state: RootState) => state.market.selectedType;
export const selectAllStocks = (state: RootState) => state.market.allStocks;
export const selectHighlightedSymbol = (state: RootState) => state.market.highlightedSymbol;
export const selectPinnedSymbols = (state: RootState) => state.market.pinnedSymbols;

export const selectFilteredStocks = createSelector(
  [selectMarketStocks, selectSelectedType, selectPinnedSymbols],
  (stocks, selectedType) => {
    let filtered = stocks;
    if (selectedType !== 'ALL') {
      filtered = stocks.filter(stock => {
        const type = stock.StockType;
        const symbol = stock.symbol || "";

        if (selectedType === 'STOCK') {
          return symbol.length === 3;
        }

        if (selectedType === 'WARRANT') {
          return type === '4' || symbol.startsWith('C');
        }

        if (selectedType === 'ETF') {
          return symbol.startsWith('E') || symbol.startsWith('FU');
        }

        return true;
      });
    }

    // Return raw filtered, let sorting happen downstream or split
    return filtered;
  }
);

export const selectPinnedFilteredStocks = createSelector(
  [selectFilteredStocks, selectPinnedSymbols],
  (stocks, pinnedSymbols) => {
    return stocks.filter(s => pinnedSymbols.includes(s.symbol));
  }
);

export const selectUnpinnedFilteredStocks = createSelector(
  [selectFilteredStocks, selectPinnedSymbols],
  (stocks, pinnedSymbols) => {
    return stocks.filter(s => !pinnedSymbols.includes(s.symbol));
  }
);

export const selectSearchSuggestions = (searchTerm: string) => createSelector(
  [selectAllStocks],
  (allStocks) => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const term = searchTerm.toUpperCase();
    return allStocks
      .filter(stock => stock.symbol.toUpperCase().includes(term))
      .slice(0, 10); // Limit results for performance
  }
);
