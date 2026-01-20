import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/login/LoginPage';
import MarketPage from '@/pages/market/MarketPage';
import LayoutDefault from '@/components/layout/LayoutDefault';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutDefault />,
    children: [
      {
        path: '',
        element: <Navigate to="/market" replace />,
      },
      {
        path: 'market',
        element: <MarketPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: '*',
        element: <div>404 - Trang không tồn tại</div>,
      },
    ],
  },
]);
