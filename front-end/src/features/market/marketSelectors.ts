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
  [selectMarketStocks, selectSelectedType],
  (stocks, selectedType) => {
    if (selectedType === 'ALL') return stocks;

    return stocks.filter(stock => {
      const type = stock.StockType;
      const symbol = stock.SB || "";

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
);

export const selectPinnedFilteredStocks = createSelector(
  [selectFilteredStocks, selectPinnedSymbols],
  (stocks, pinnedSymbols) => {
    return stocks.filter(s => pinnedSymbols.includes(s.SB));
  }
);

export const selectUnpinnedFilteredStocks = createSelector(
  [selectFilteredStocks, selectPinnedSymbols],
  (stocks, pinnedSymbols) => {
    return stocks.filter(s => !pinnedSymbols.includes(s.SB));
  }
);

export const selectStockBySymbol = (symbol: string) => createSelector(
  [selectMarketStocks],
  (stocks) => stocks.find(s => s.SB === symbol)
);

export const selectPinnedFilteredStockSymbols = createSelector(
  [selectPinnedFilteredStocks],
  (stocks) => stocks.map(s => s.SB)
);

export const selectUnpinnedFilteredStockSymbols = createSelector(
  [selectUnpinnedFilteredStocks],
  (stocks) => stocks.map(s => s.SB)
);

export const selectSearchSuggestions = (searchTerm: string) => createSelector(
  [selectAllStocks],
  (allStocks) => {
    if (!searchTerm || searchTerm.length < 1) return [];
    const term = searchTerm.toUpperCase();
    return allStocks
      .filter(stock => stock.SB.toUpperCase().includes(term))
      .slice(0, 10);
  }
);
