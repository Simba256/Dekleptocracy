import { STORAGE_KEYS } from './constants';

const PREFERENCES_KEY = STORAGE_KEYS.USER_PREFERENCES_LEGACY;

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to parse stored preferences, clearing.', error);
    }
    localStorage.removeItem(PREFERENCES_KEY);
    return {};
  }
};

const normalizePreferences = (prefs = {}) => {
  const ensureArray = (value) => Array.isArray(value)
    ? value.map(item => (typeof item === 'string' ? item.trim() : String(item || ''))).filter(Boolean)
    : [];
  const ensureString = (value) => (typeof value === 'string' ? value.trim() : '');

  return {
    conversationStyles: ensureArray(prefs.conversationStyles),
    topicsOfInterest: ensureArray(prefs.topicsOfInterest),
    householdExpenseFocus: ensureString(prefs.householdExpenseFocus),
  };
};

export const loadPreferences = () => {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  return normalizePreferences(safeParse(stored));
};

export const savePreferences = (nextPrefs) => {
  const normalized = normalizePreferences({
    ...loadPreferences(),
    ...nextPrefs,
  });
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(normalized));
  return normalized;
};

export const clearPreferences = () => {
  localStorage.removeItem(PREFERENCES_KEY);
};
