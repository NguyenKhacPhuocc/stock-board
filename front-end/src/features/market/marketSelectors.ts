import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export const selectMarketStocks = (state: RootState) => state.market.stocks;
export const selectMarketLoading = (state: RootState) => state.market.loading;
export const selectMarketError = (state: RootState) => state.market.error;
export const selectSelectedExchange = (state: RootState) => state.market.selectedExchange;
export const selectSelectedType = (state: RootState) => state.market.selectedType;

export const selectFilteredStocks = createSelector(
  [selectMarketStocks, selectSelectedType],
  (stocks, selectedType) => {
    if (selectedType === 'ALL') return stocks;

    return stocks.filter(stock => {
      const type = stock.StockType;
      const symbol = stock.symbol || "";

      if (selectedType === 'STOCK') {
        // Common stock is Type 2. Warrants are Type 4. 
        // We also check length to be sure (Stocks = 3, Warrants = 8, ETF = 8)
        if (type === '4') return false; // Definitely warrant
        if (symbol.length > 3) {
          // Check if it's ETF (starts with E, F) or Warrant (starts with C)
          if (symbol.startsWith('C') || symbol.startsWith('E') || symbol.startsWith('F')) return false;
        }
        return true;
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
