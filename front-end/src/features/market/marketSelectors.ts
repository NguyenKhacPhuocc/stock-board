import type { RootState } from '@/app/store';

export const selectMarketStocks = (state: RootState) => state.market.stocks;
export const selectMarketLoading = (state: RootState) => state.market.loading;
export const selectMarketError = (state: RootState) => state.market.error;
