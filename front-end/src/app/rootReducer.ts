import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import marketReducer from '@/features/market/marketSlice';
import appReducer from './appSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  market: marketReducer,
  app: appReducer,
});

export default rootReducer;
