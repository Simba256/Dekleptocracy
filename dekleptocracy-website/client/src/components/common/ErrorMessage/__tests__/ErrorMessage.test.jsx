import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from '../index';

vi.mock('../ErrorMessage.css', () => ({}));

describe('ErrorMessage', () => {
  it('renders the default error message', () => {
    render(<ErrorMessage />);

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders a custom error message', () => {
    render(<ErrorMessage message="Network request failed" />);

    expect(screen.getByText('Network request failed')).toBeInTheDocument();
  });

  it('shows retry button when onRetry is provided', () => {
    render(<ErrorMessage onRetry={() => {}} />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(<ErrorMessage />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(<ErrorMessage onRetry={handleRetry} />);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders in full page mode when fullPage is true', () => {
    const { container } = render(<ErrorMessage fullPage />);

    expect(container.querySelector('.error-message-fullpage')).toBeInTheDocument();
  });

  it('renders in container mode by default', () => {
    const { container } = render(<ErrorMessage />);

    expect(container.querySelector('.error-message-container')).toBeInTheDocument();
    expect(container.querySelector('.error-message-fullpage')).not.toBeInTheDocument();
  });

  it('renders the error icon SVG', () => {
    const { container } = render(<ErrorMessage />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
