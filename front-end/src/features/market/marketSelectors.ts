import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { StockInstrument } from "./marketTypes";

export const selectMarketStocks = (state: RootState) => state.market.stocks;

export const selectMarketEntities = (state: RootState) => state.market.entities;

export const selectMarketLoading = (state: RootState) => state.market.loading;

export const selectMarketError = (state: RootState) => state.market.error;

export const selectSelectedExchange = (state: RootState) =>
  state.market.selectedExchange;

export const selectSelectedType = (state: RootState) =>
  state.market.selectedType;

export const selectPinnedSymbols = (state: RootState) =>
  state.market.pinnedSymbols;

export const selectHighlightedSymbol = (state: RootState) =>
  state.market.highlightedSymbol;

export const selectAllQuotes = (state: RootState) => state.market.allQuotes;

export const selectFilteredStocks = createSelector(
  [selectMarketStocks, selectSelectedType],
  (stocks, selectedType): StockInstrument[] => {
    if (selectedType === "ALL") return stocks;

    return stocks.filter((stock) => {
      const type = stock.StockType;
      const symbol = stock.SB || stock.symbol || "";

      if (selectedType === "STOCK") {
        return symbol.length === 3;
      }

      if (selectedType === "WARRANT") {
        return type === "4" || symbol.startsWith("C");
      }

      if (selectedType === "ETF") {
        return symbol.startsWith("E") || symbol.startsWith("FU");
      }

      return true;
    });
  },
);

export const selectPinnedFilteredStocks = createSelector(
  [selectFilteredStocks, selectPinnedSymbols],
  (stocks, pinnedSymbols): StockInstrument[] => {
    return stocks.filter((s) => pinnedSymbols.includes(s.SB || s.symbol || ""));
  },
);

export const selectUnpinnedFilteredStocks = createSelector(
  [selectFilteredStocks, selectPinnedSymbols],
  (stocks, pinnedSymbols): StockInstrument[] => {
    return stocks.filter(
      (s) => !pinnedSymbols.includes(s.SB || s.symbol || ""),
    );
  },
);

export const selectStockBySymbol = (symbol: string) =>
  createSelector([selectMarketStocks], (stocks): StockInstrument | undefined =>
    stocks.find((s) => (s.SB || s.symbol) === symbol),
  );

export const selectPinnedFilteredStockSymbols = createSelector(
  [selectPinnedFilteredStocks],
  (stocks): string[] => stocks.map((s) => s.SB || s.symbol || ""),
);

export const selectUnpinnedFilteredStockSymbols = createSelector(
  [selectUnpinnedFilteredStocks],
  (stocks): string[] => stocks.map((s) => s.SB || s.symbol || ""),
);
