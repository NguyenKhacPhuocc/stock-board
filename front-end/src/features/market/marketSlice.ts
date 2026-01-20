import { createSlice } from '@reduxjs/toolkit';

interface MarketState {
  stocks: any[];
  loading: boolean;
}

const initialState: MarketState = {
  stocks: [],
  loading: false,
};

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setStocks: (state, action) => {
      state.stocks = action.payload;
    },
  },
});

export const { setStocks } = marketSlice.actions;
export default marketSlice.reducer;
