import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { store } from '@/app/store';
import { messages, defaultLocale } from '@/app/i18n';
import { type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';

interface AppProviderProps {
  children: ReactNode;
}

function IntlWrapper({ children }: { children: ReactNode }) {
  const locale = useAppSelector((state) => state.app.locale);

  return (
    <IntlProvider
      messages={messages[locale]}
      locale={locale}
      defaultLocale={defaultLocale}
    >
      {children}
    </IntlProvider>
  );
}

export default function AppProvider({ children }: AppProviderProps) {
  return (
    <Provider store={store}>
      <IntlWrapper>
        {children}
      </IntlWrapper>
    </Provider>
  );
}
