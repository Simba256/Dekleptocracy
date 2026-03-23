import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../index';

vi.mock('../LoadingSpinner.css', () => ({}));

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Fetching data..." />);

    expect(screen.getByText('Fetching data...')).toBeInTheDocument();
  });

  it('applies the correct size class', () => {
    const { container } = render(<LoadingSpinner size="large" />);

    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('applies small size class', () => {
    const { container } = render(<LoadingSpinner size="small" />);

    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--small');
  });

  it('applies medium size class by default', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--medium');
  });

  it('renders in full page mode when fullPage is true', () => {
    const { container } = render(<LoadingSpinner fullPage />);

    expect(container.querySelector('.loading-spinner-fullpage')).toBeInTheDocument();
  });

  it('renders in container mode by default', () => {
    const { container } = render(<LoadingSpinner />);

    expect(container.querySelector('.loading-spinner-container')).toBeInTheDocument();
    expect(container.querySelector('.loading-spinner-fullpage')).not.toBeInTheDocument();
  });

  it('does not render message text when message is empty string', () => {
    const { container } = render(<LoadingSpinner message="" />);

    const messageEl = container.querySelector('.loading-spinner-message');
    expect(messageEl).not.toBeInTheDocument();
  });
});
