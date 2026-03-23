import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  usePrefersReducedMotion,
  usePrefersDarkMode,
} from '../useMediaQuery';
import { useOnlineStatus } from '../useOnlineStatus';
import { useStateSelection } from '../useStateSelection';
import { useFocusTrap } from '../useFocusTrap';

vi.mock('../../context/HomepageContext', () => ({
  ALL_STATES: ['All states', 'Alabama', 'Alaska', 'California', 'New York'],
}));

// ─── localStorage mock & cleanup ────────────────────────────────────────────

beforeEach(() => {
  const store = {};
  vi.stubGlobal(
    'localStorage',
    Object.defineProperties(
      {},
      {
        getItem: { value: (key) => store[key] ?? null },
        setItem: { value: (key, val) => (store[key] = String(val)) },
        removeItem: {
          value: (key) => {
            delete store[key];
          },
        },
        clear: {
          value: () => {
            for (const k of Object.keys(store)) delete store[k];
          },
        },
      },
    ),
  );
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// useDebounce
// ═══════════════════════════════════════════════════════════════════════════════

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('updates the value after the specified delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'hello', delay: 500 },
    });

    rerender({ value: 'world', delay: 500 });
    expect(result.current).toBe('hello');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('world');
  });

  it('resets the timer on rapid changes and only emits the last value', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 300 },
    });

    rerender({ value: 'b', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'c', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender({ value: 'd', delay: 300 });

    // Not yet elapsed since last change
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('d');
  });

  it('respects a change in the delay parameter', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    });

    rerender({ value: 'second', delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('second');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useMediaQuery
// ═══════════════════════════════════════════════════════════════════════════════

describe('useMediaQuery', () => {
  let listeners;
  let matchMediaMock;

  beforeEach(() => {
    listeners = {};
    matchMediaMock = vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event, cb) => {
        listeners[query] = cb;
      }),
      removeEventListener: vi.fn((event, cb) => {
        if (listeners[query] === cb) {
          delete listeners[query];
        }
      }),
    }));
    vi.stubGlobal('matchMedia', matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the initial match state from matchMedia', () => {
    matchMediaMock.mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when a change event fires', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      listeners['(max-width: 768px)']({ matches: true });
    });

    expect(result.current).toBe(true);
  });

  it('cleans up the event listener on unmount', () => {
    const removeListener = vi.fn();
    matchMediaMock.mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: removeListener,
    }));

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    unmount();

    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('useIsMobile queries max-width: 768px', () => {
    renderHook(() => useIsMobile());
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 768px)');
  });

  it('useIsTablet queries max-width: 1024px', () => {
    renderHook(() => useIsTablet());
    expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 1024px)');
  });

  it('useIsDesktop queries min-width: 1025px', () => {
    renderHook(() => useIsDesktop());
    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 1025px)');
  });

  it('usePrefersReducedMotion queries prefers-reduced-motion', () => {
    renderHook(() => usePrefersReducedMotion());
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('usePrefersDarkMode queries prefers-color-scheme: dark', () => {
    renderHook(() => usePrefersDarkMode());
    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useOnlineStatus
// ═══════════════════════════════════════════════════════════════════════════════

describe('useOnlineStatus', () => {
  const originalOnLine = navigator.onLine;

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true });
  });

  it('returns true when the browser is online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('returns false when the browser is offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('detects an offline event', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('detects an online event after being offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus());

    const onlineCb = addSpy.mock.calls.find((c) => c[0] === 'online')?.[1];
    const offlineCb = addSpy.mock.calls.find((c) => c[0] === 'offline')?.[1];

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('online', onlineCb);
    expect(removeSpy).toHaveBeenCalledWith('offline', offlineCb);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useStateSelection
// ═══════════════════════════════════════════════════════════════════════════════

describe('useStateSelection', () => {
  it('has correct initial state with no options', () => {
    const { result } = renderHook(() => useStateSelection());

    expect(result.current.selectedState).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.searchTerm).toBe('');
    expect(result.current.displayValue).toBe('All States');
    expect(result.current.filteredStates).toEqual([
      'All states',
      'Alabama',
      'Alaska',
      'California',
      'New York',
    ]);
  });

  it('accepts an initialState option', () => {
    const { result } = renderHook(() => useStateSelection({ initialState: 'California' }));
    expect(result.current.selectedState).toBe('California');
    expect(result.current.displayValue).toBe('California');
  });

  it('selects a state and closes the dropdown', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.toggleDropdown();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.selectState('California');
    });

    expect(result.current.selectedState).toBe('California');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.displayValue).toBe('California');
  });

  it('maps "All states" selection to "nationwide"', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.selectState('All states');
    });

    expect(result.current.selectedState).toBe('nationwide');
    expect(result.current.displayValue).toBe('All States');
  });

  it('filters states based on search term', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.handleSearch('al');
    });

    expect(result.current.filteredStates).toEqual(
      expect.arrayContaining(['All states', 'Alabama', 'Alaska', 'California']),
    );
    expect(result.current.filteredStates).not.toContain('New York');
  });

  it('returns all states when search term is empty', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.handleSearch('cal');
    });
    expect(result.current.filteredStates).toHaveLength(1);

    act(() => {
      result.current.handleSearch('');
    });
    expect(result.current.filteredStates).toHaveLength(5);
  });

  it('toggles the dropdown open and closed', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.toggleDropdown();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggleDropdown();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('closes the dropdown via closeDropdown', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.toggleDropdown();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeDropdown();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.searchTerm).toBe('');
  });

  it('calls onStateChange callback when a state is selected', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useStateSelection({ onStateChange }));

    act(() => {
      result.current.selectState('New York');
    });

    expect(onStateChange).toHaveBeenCalledWith('New York');
  });

  it('calls onStateChange with "nationwide" when "All states" is selected', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useStateSelection({ onStateChange }));

    act(() => {
      result.current.selectState('All states');
    });

    expect(onStateChange).toHaveBeenCalledWith('nationwide');
  });

  it('clears search term when selecting a state', () => {
    const { result } = renderHook(() => useStateSelection());

    act(() => {
      result.current.handleSearch('cal');
    });
    expect(result.current.searchTerm).toBe('cal');

    act(() => {
      result.current.selectState('California');
    });
    expect(result.current.searchTerm).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useFocusTrap
// ═══════════════════════════════════════════════════════════════════════════════

describe('useFocusTrap', () => {
  function buildContainer() {
    const container = document.createElement('div');
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Middle';
    const btn3 = document.createElement('button');
    btn3.textContent = 'Last';
    container.appendChild(btn1);
    container.appendChild(btn2);
    container.appendChild(btn3);
    document.body.appendChild(container);
    return { container, btn1, btn2, btn3 };
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toHaveProperty('current');
  });

  it('focuses the first focusable element when active', () => {
    const { container, btn1 } = buildContainer();

    const { result } = renderHook(() => useFocusTrap(false));

    // Attach the ref to the container
    act(() => {
      result.current.current = container;
    });

    // Re-render with isActive = true
    const { unmount } = renderHook(() => {
      const ref = useFocusTrap(true);
      ref.current = container;
      return ref;
    });

    expect(document.activeElement).toBe(btn1);
    unmount();
  });

  it('wraps focus from last element to first on Tab', () => {
    const { container, btn1, btn3 } = buildContainer();

    const { unmount } = renderHook(() => {
      const ref = useFocusTrap(true);
      ref.current = container;
      return ref;
    });

    // Manually set focus to last element
    btn3.focus();
    expect(document.activeElement).toBe(btn3);

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      container.dispatchEvent(tabEvent);
    });

    expect(document.activeElement).toBe(btn1);
    unmount();
  });

  it('wraps focus from first element to last on Shift+Tab', () => {
    const { container, btn1, btn3 } = buildContainer();

    const { unmount } = renderHook(() => {
      const ref = useFocusTrap(true);
      ref.current = container;
      return ref;
    });

    // Focus the first element
    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      container.dispatchEvent(shiftTabEvent);
    });

    expect(document.activeElement).toBe(btn3);
    unmount();
  });

  it('does not trap focus when inactive', () => {
    const { container, btn1 } = buildContainer();

    // Focus something else first
    const outsideBtn = document.createElement('button');
    outsideBtn.textContent = 'Outside';
    document.body.appendChild(outsideBtn);
    outsideBtn.focus();

    renderHook(() => {
      const ref = useFocusTrap(false);
      ref.current = container;
      return ref;
    });

    // First element should NOT have received focus
    expect(document.activeElement).not.toBe(btn1);
    expect(document.activeElement).toBe(outsideBtn);
  });
});
