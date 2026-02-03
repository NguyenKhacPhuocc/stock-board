import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";
import type { CellColorType, CellData, StockInstrument } from "./marketTypes";
import { formatPrice, formatVol, formatChange, formatPercent, getColorClass } from "./marketUtils";
import type { CellType } from "./marketTypes";

export const selectMarketStocks = (state: RootState) => state.market.stocks;

export const selectSelectedExchange = (state: RootState) =>
  state.market.selectedExchange;

export const selectSelectedType = (state: RootState) =>
  state.market.selectedType;

export const selectPinnedSymbols = (state: RootState) =>
  state.market.pinnedSymbols;

export const selectHighlightedSymbol = (state: RootState) =>
  state.market.highlightedSymbol;

export const selectAllQuotes = (state: RootState) => state.market.allQuotes;


export const selectSearchStocks = createSelector(
  [selectAllQuotes],
  (allQuotes): StockInstrument[] => {
    return Array.from(allQuotes.values()).map(quote => ({
      SB: quote.SB as string,
      symbol: quote.SB as string,
      exchange: quote.EX as StockInstrument["exchange"],
      StockType: quote.ST as string,
      FullName: quote.FN as string,
      IssuerName: quote.IN as string,
      RE: quote.RE as number,
      CL: quote.CL as number,
      FL: quote.FL as number,
    } as StockInstrument));
  }
);

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

export const selectPinnedFilteredStockSymbols = createSelector(
  [selectPinnedFilteredStocks],
  (stocks): string[] => stocks.map((s) => s.SB || s.symbol || ""),
);

export const selectUnpinnedFilteredStockSymbols = createSelector(
  [selectUnpinnedFilteredStocks],
  (stocks): string[] => stocks.map((s) => s.SB || s.symbol || ""),
);

function computeColorType(
  price: number | undefined | null,
  ref: number | undefined,
  ceil: number | undefined,
  floor: number | undefined
): CellColorType {
  if (!price || !ref) return "ref";

  const p = Number(price);
  const r = Number(ref);
  const c = Number(ceil) || 0;
  const f = Number(floor) || 0;

  if (Math.abs(p - c) < 0.001) return "ceiling";
  if (Math.abs(p - f) < 0.001) return "floor";
  if (p > r) return "up";
  if (p < r) return "down";
  return "ref";
}

function formatCellValue(raw: unknown, type: CellType): string {
  if (raw === undefined || raw === null) return "";

  switch (type) {
    case "price":
      return formatPrice(raw as number | string);
    case "vol":
      return formatVol(raw as number | string);
    case "change":
      return formatChange(raw as number | string);
    case "percent":
      return formatPercent(raw as number | string);
    default:
      return String(raw);
  }
}

export const makeSelectCell = (
  symbol: string,
  field: string,
  type: CellType = "text",
  colorField?: string,
  fixedColorClass?: string
) => createSelector(
    (state: RootState) => state.market.entities[symbol],
    (stock): CellData => {
      if (!stock) {
        return { value: "", colorClass: fixedColorClass || "", colorType: "ref" };
      }

      // Get raw value
      const rawValue = (stock as Record<string, unknown>)[field];

      // Determine color source
      const colorPrice = colorField
        ? (stock as Record<string, unknown>)[colorField]
        : type === "price"
          ? rawValue
          : undefined;

      // If CH/CHP but CP is empty, return empty value
      if ((field === "CH" || field === "CHP") && !colorPrice) {
        return { value: "", colorClass: fixedColorClass || "", colorType: "ref", rawValue: undefined };
      }

      const value = formatCellValue(rawValue, type);

      // Determine color
      if (fixedColorClass) {
        return { value, colorClass: fixedColorClass, rawValue };
      }

      const colorClass = getColorClass(
        colorPrice as number | undefined | null,
        stock.RE || 0,
        stock.CL || 0,
        stock.FL || 0
      );

      const colorType = computeColorType(
        colorPrice as number | undefined | null,
        stock.RE,
        stock.CL,
        stock.FL
      );

      return { value, colorClass, colorType, rawValue };
    }
  );
