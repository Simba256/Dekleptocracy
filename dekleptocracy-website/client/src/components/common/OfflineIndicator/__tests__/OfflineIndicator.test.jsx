import { render, screen } from '@testing-library/react';
import { OfflineIndicator, OfflineFallback } from '../index';

vi.mock('../OfflineIndicator.css', () => ({}));
vi.mock('../../../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));

// Import the mock after vi.mock so we can control return values
import { useOnlineStatus } from '../../../../hooks/useOnlineStatus';

describe('OfflineIndicator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when online', () => {
    useOnlineStatus.mockReturnValue(true);

    const { container } = render(<OfflineIndicator />);

    expect(container.innerHTML).toBe('');
  });

  it('shows the offline banner when offline', () => {
    useOnlineStatus.mockReturnValue(false);

    render(<OfflineIndicator />);

    expect(screen.getByText("You're offline. Some features may not work.")).toBeInTheDocument();
  });

  it('has role="alert" for accessibility when offline', () => {
    useOnlineStatus.mockReturnValue(false);

    render(<OfflineIndicator />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has aria-live="assertive" for screen reader announcements', () => {
    useOnlineStatus.mockReturnValue(false);

    render(<OfflineIndicator />);

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });

  it('hides the satellite icon from assistive technology', () => {
    useOnlineStatus.mockReturnValue(false);

    const { container } = render(<OfflineIndicator />);

    const icon = container.querySelector('.offline-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('OfflineFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when online', () => {
    useOnlineStatus.mockReturnValue(true);

    render(
      <OfflineFallback>
        <div data-testid="child-content">Dashboard</div>
      </OfflineFallback>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('shows full offline screen when offline with no cached data', () => {
    useOnlineStatus.mockReturnValue(false);

    render(
      <OfflineFallback>
        <div>Dashboard</div>
      </OfflineFallback>,
    );

    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry connecting/i })).toBeInTheDocument();
  });

  it('shows cached data notice when offline with cached data', () => {
    useOnlineStatus.mockReturnValue(false);
    const cachedData = { timestamp: '2026-01-15T10:00:00Z' };

    render(
      <OfflineFallback cachedData={cachedData}>
        <div data-testid="cached-child">Cached Dashboard</div>
      </OfflineFallback>,
    );

    expect(screen.getByText(/showing cached data from/i)).toBeInTheDocument();
    expect(screen.getByTestId('cached-child')).toBeInTheDocument();
  });
});
