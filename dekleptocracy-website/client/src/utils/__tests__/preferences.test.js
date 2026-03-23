import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPreferences, savePreferences, clearPreferences } from '../preferences';

const PREFERENCES_KEY = 'dekleptocracy_user_preferences';

describe('preferences utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('loadPreferences', () => {
    it('returns defaults when nothing is stored', () => {
      const result = loadPreferences();

      expect(result).toEqual({
        conversationStyles: [],
        topicsOfInterest: [],
        householdExpenseFocus: '',
      });
    });

    it('loads and normalizes stored preferences', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          conversationStyles: ['formal', 'concise'],
          topicsOfInterest: ['budgets', 'taxes'],
          householdExpenseFocus: 'utilities',
        }),
      );

      const result = loadPreferences();

      expect(result).toEqual({
        conversationStyles: ['formal', 'concise'],
        topicsOfInterest: ['budgets', 'taxes'],
        householdExpenseFocus: 'utilities',
      });
    });

    it('handles corrupt JSON gracefully by removing key and returning defaults', () => {
      localStorage.setItem(PREFERENCES_KEY, '{not-valid-json');

      const result = loadPreferences();

      expect(result).toEqual({
        conversationStyles: [],
        topicsOfInterest: [],
        householdExpenseFocus: '',
      });
      expect(localStorage.getItem(PREFERENCES_KEY)).toBeNull();
    });

    it('handles partially stored preferences by filling missing fields with defaults', () => {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ conversationStyles: ['casual'] }));

      const result = loadPreferences();

      expect(result).toEqual({
        conversationStyles: ['casual'],
        topicsOfInterest: [],
        householdExpenseFocus: '',
      });
    });

    it('returns defaults when stored value is an empty object', () => {
      localStorage.setItem(PREFERENCES_KEY, '{}');

      const result = loadPreferences();

      expect(result).toEqual({
        conversationStyles: [],
        topicsOfInterest: [],
        householdExpenseFocus: '',
      });
    });
  });

  describe('savePreferences', () => {
    it('saves normalized preferences to localStorage', () => {
      const prefs = {
        conversationStyles: ['formal'],
        topicsOfInterest: ['budgets'],
        householdExpenseFocus: 'rent',
      };

      const result = savePreferences(prefs);

      expect(result).toEqual(prefs);
      expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY))).toEqual(prefs);
    });

    it('merges with existing preferences', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          conversationStyles: ['formal'],
          topicsOfInterest: ['budgets'],
          householdExpenseFocus: 'rent',
        }),
      );

      const result = savePreferences({ householdExpenseFocus: 'groceries' });

      expect(result).toEqual({
        conversationStyles: ['formal'],
        topicsOfInterest: ['budgets'],
        householdExpenseFocus: 'groceries',
      });
      expect(JSON.parse(localStorage.getItem(PREFERENCES_KEY))).toEqual(result);
    });

    it('normalizes values when saving', () => {
      const result = savePreferences({
        conversationStyles: ['  padded  ', '', '  trimmed'],
        householdExpenseFocus: '  spaced  ',
      });

      expect(result.conversationStyles).toEqual(['padded', 'trimmed']);
      expect(result.householdExpenseFocus).toBe('spaced');
    });

    it('returns the normalized result', () => {
      const result = savePreferences({});

      expect(result).toEqual({
        conversationStyles: [],
        topicsOfInterest: [],
        householdExpenseFocus: '',
      });
    });
  });

  describe('clearPreferences', () => {
    it('removes preferences from localStorage', () => {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ conversationStyles: ['formal'] }));

      clearPreferences();

      expect(localStorage.getItem(PREFERENCES_KEY)).toBeNull();
    });

    it('does not throw when no preferences exist', () => {
      expect(() => clearPreferences()).not.toThrow();
    });
  });

  describe('normalizePreferences edge cases', () => {
    it('trims whitespace from string values', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ householdExpenseFocus: '  utilities  ' }),
      );

      const result = loadPreferences();

      expect(result.householdExpenseFocus).toBe('utilities');
    });

    it('trims whitespace from array items', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ conversationStyles: ['  formal  ', ' casual '] }),
      );

      const result = loadPreferences();

      expect(result.conversationStyles).toEqual(['formal', 'casual']);
    });

    it('filters out empty strings from arrays', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ topicsOfInterest: ['budgets', '', '  ', 'taxes'] }),
      );

      const result = loadPreferences();

      expect(result.topicsOfInterest).toEqual(['budgets', 'taxes']);
    });

    it('converts non-string array items to strings', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ conversationStyles: [123, true, 'normal'] }),
      );

      const result = loadPreferences();

      expect(result.conversationStyles).toEqual(['123', 'true', 'normal']);
    });

    it('handles non-array values for array fields by returning empty arrays', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          conversationStyles: 'not-an-array',
          topicsOfInterest: 42,
        }),
      );

      const result = loadPreferences();

      expect(result.conversationStyles).toEqual([]);
      expect(result.topicsOfInterest).toEqual([]);
    });

    it('handles non-string values for string fields by returning empty string', () => {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ householdExpenseFocus: 123 }));

      const result = loadPreferences();

      expect(result.householdExpenseFocus).toBe('');
    });

    it('handles null and undefined values in arrays by filtering them out', () => {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ conversationStyles: [null, undefined, 'valid'] }),
      );

      const result = loadPreferences();

      expect(result.conversationStyles).toEqual(['valid']);
    });

    it('handles undefined preferences object gracefully', () => {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(undefined));

      const result = loadPreferences();

      expect(result).toEqual({
        conversationStyles: [],
        topicsOfInterest: [],
        householdExpenseFocus: '',
      });
    });
  });
});
