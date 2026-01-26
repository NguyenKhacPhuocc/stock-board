import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/login/LoginPage';
import MarketPage from '@/pages/market/MarketPage';
import LayoutDefault from '@/components/layout/LayoutDefault';

import { loginAction } from '@/features/auth/authAction';

import { FormattedMessage } from 'react-intl';

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
        // loader: marketLoader,  // in react router v7, we use loader
      },
      {
        path: 'login',
        element: <LoginPage />,
        action: loginAction,
      },
      {
        path: '*',
        element: <div><FormattedMessage id="common.not_found" /></div>,
      },
    ],
  },
]);
