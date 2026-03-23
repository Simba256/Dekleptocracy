import { render, screen } from '@testing-library/react';
import { StatCard, LobbyingStatCard } from '../index';

vi.mock('../StatCard.css', () => ({}));

describe('StatCard', () => {
  const defaultProps = {
    title: 'Total Cases',
    value: '1,234',
  };

  it('renders the title and value', () => {
    render(<StatCard {...defaultProps} />);

    expect(screen.getByText('Total Cases')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders a numeric value', () => {
    render(<StatCard title="Count" value={42} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows change with up arrow when changeDirection is up', () => {
    render(<StatCard {...defaultProps} change="+12%" changeDirection="up" />);

    const changeEl = screen.getByText(/\+12%/);
    expect(changeEl).toBeInTheDocument();
    // Up arrow character (U+2191)
    expect(changeEl.textContent).toContain('\u2191');
  });

  it('shows change with down arrow when changeDirection is down', () => {
    render(<StatCard {...defaultProps} change="-5%" changeDirection="down" />);

    const changeEl = screen.getByText(/-5%/);
    expect(changeEl).toBeInTheDocument();
    // Down arrow character (U+2193)
    expect(changeEl.textContent).toContain('\u2193');
  });

  it('applies correct CSS class for up change direction', () => {
    const { container } = render(<StatCard {...defaultProps} change="+12%" changeDirection="up" />);

    const changeEl = container.querySelector('.stat-card__change');
    expect(changeEl).toHaveClass('stat-card__change--up');
  });

  it('applies correct CSS class for down change direction', () => {
    const { container } = render(
      <StatCard {...defaultProps} change="-5%" changeDirection="down" />,
    );

    const changeEl = container.querySelector('.stat-card__change');
    expect(changeEl).toHaveClass('stat-card__change--down');
  });

  it('does not render change element when change is not provided', () => {
    const { container } = render(<StatCard {...defaultProps} />);

    expect(container.querySelector('.stat-card__change')).not.toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard {...defaultProps} subtitle="Last 30 days" />);

    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<StatCard {...defaultProps} />);

    expect(container.querySelector('.stat-card__subtitle')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<StatCard {...defaultProps} icon="📊" />);

    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('applies the variant class', () => {
    const { container } = render(<StatCard {...defaultProps} variant="pink" />);

    const card = container.querySelector('.stat-card');
    expect(card).toHaveClass('stat-card--pink');
  });

  it('applies default variant class when no variant specified', () => {
    const { container } = render(<StatCard {...defaultProps} />);

    const card = container.querySelector('.stat-card');
    expect(card).toHaveClass('stat-card--default');
  });

  it('renders children in chart slot', () => {
    render(
      <StatCard {...defaultProps}>
        <div data-testid="custom-chart">Chart</div>
      </StatCard>,
    );

    expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
  });

  it('renders bar chart when chartData is provided and no children', () => {
    const chartData = [
      { value: 10, label: 'Jan' },
      { value: 20, label: 'Feb' },
      { value: 15, label: 'Mar' },
    ];

    render(<StatCard {...defaultProps} chartData={chartData} />);

    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('prefers children over chartData when both provided', () => {
    const chartData = [
      { value: 10, label: 'Jan' },
      { value: 20, label: 'Feb' },
    ];

    render(
      <StatCard {...defaultProps} chartData={chartData}>
        <div data-testid="custom-chart">Custom</div>
      </StatCard>,
    );

    expect(screen.getByTestId('custom-chart')).toBeInTheDocument();
    expect(screen.queryByText('Jan')).not.toBeInTheDocument();
  });
});

describe('LobbyingStatCard', () => {
  it('renders with the correct title and value', () => {
    render(<LobbyingStatCard value="5,678" />);

    expect(screen.getByText('Lobbying Cases Tracked')).toBeInTheDocument();
    expect(screen.getByText('5,678')).toBeInTheDocument();
  });

  it('renders an SVG line chart', () => {
    const { container } = render(<LobbyingStatCard value={100} />);

    const svg = container.querySelector('svg.stat-card__line-chart');
    expect(svg).toBeInTheDocument();
  });
});
