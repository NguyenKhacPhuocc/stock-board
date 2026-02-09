/* eslint-disable @typescript-eslint/no-explicit-any */
import viMessages from '@/locales/vi.json';
import enMessages from '@/locales/en.json';

const flattenMessages = (nestedMessages: any, prefix = '') => {
  if (nestedMessages === null) return {};

  return Object.keys(nestedMessages).reduce((messages: any, key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[prefixedKey] = value;
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }

    return messages;
  }, {});
};

export const messages: Record<string, any> = {
  vi: flattenMessages(viMessages),
  en: flattenMessages(enMessages),
};

export const defaultLocale = 'vi';
