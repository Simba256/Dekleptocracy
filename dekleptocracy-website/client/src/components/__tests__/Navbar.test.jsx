import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';

vi.mock('../Navbar.css', () => ({}));
vi.mock('../../utils/auth', () => ({
  isAuthenticated: vi.fn(() => false),
  logout: vi.fn(),
}));
vi.mock('../../utils/apiUrl', () => ({
  API_URL: 'http://localhost:5000',
  getApiUrl: () => 'http://localhost:5000',
}));

const renderNavbar = (initialRoute = '/') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Navbar />
    </MemoryRouter>,
  );

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders site logo with correct text', () => {
    renderNavbar();
    const logo = screen.getByRole('link', { name: /kleptocracy/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('href', '/');
  });

  it('renders correctly with MemoryRouter', () => {
    const { container } = renderNavbar();
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('has a proper nav landmark element', () => {
    renderNavbar();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders all main navigation links', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /about us/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /reports/i })).toHaveAttribute('href', '/reports');
    expect(screen.getByRole('link', { name: /chatbot/i })).toHaveAttribute('href', '/chatbot');
    expect(screen.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact');
  });

  it('renders the Insights dropdown button', () => {
    renderNavbar();
    const insightsButton = screen.getByRole('button', { name: /insights/i });
    expect(insightsButton).toBeInTheDocument();
    expect(insightsButton).toHaveAttribute('aria-haspopup', 'true');
    expect(insightsButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the Insights dropdown and shows submenu links on click', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const insightsButton = screen.getByRole('button', { name: /insights/i });
    await user.click(insightsButton);

    expect(insightsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: /all insights/i })).toHaveAttribute(
      'href',
      '/insights',
    );
    expect(screen.getByRole('menuitem', { name: /articles/i })).toHaveAttribute(
      'href',
      '/insights/articles',
    );
    expect(screen.getByRole('menuitem', { name: /research/i })).toHaveAttribute(
      'href',
      '/insights/research',
    );
  });

  it('highlights the active link based on current route', () => {
    renderNavbar('/about');
    const aboutLink = screen.getByRole('link', { name: /about us/i });
    expect(aboutLink.className).toContain('active');

    const homeLink = screen.getByRole('link', { name: /^home$/i });
    expect(homeLink.className).not.toContain('active');
  });

  it('highlights Home link when on root route', () => {
    renderNavbar('/');
    const homeLink = screen.getByRole('link', { name: /^home$/i });
    expect(homeLink.className).toContain('active');
  });

  describe('mobile menu toggle', () => {
    it('renders a mobile menu button with correct aria-label', () => {
      renderNavbar();
      const menuButton = screen.getByRole('button', { name: /open menu/i });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens mobile menu on button click and updates aria attributes', async () => {
      const user = userEvent.setup();
      renderNavbar();

      const menuButton = screen.getByRole('button', { name: /open menu/i });
      await user.click(menuButton);

      expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(screen.getByLabelText(/mobile navigation/i)).toBeInTheDocument();
    });

    it('shows navigation links inside the mobile menu', async () => {
      const user = userEvent.setup();
      renderNavbar();

      await user.click(screen.getByRole('button', { name: /open menu/i }));

      const mobileNav = screen.getByLabelText(/mobile navigation/i);
      expect(mobileNav).toBeInTheDocument();

      const mobileLinks = mobileNav.querySelectorAll('a');
      const hrefs = Array.from(mobileLinks).map((link) => link.getAttribute('href'));
      expect(hrefs).toContain('/');
      expect(hrefs).toContain('/about');
      expect(hrefs).toContain('/reports');
      expect(hrefs).toContain('/chatbot');
      expect(hrefs).toContain('/contact');
    });
  });

  describe('profile menu', () => {
    it('renders profile menu button', () => {
      renderNavbar();
      const profileButton = screen.getByRole('button', { name: /profile menu/i });
      expect(profileButton).toBeInTheDocument();
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows login and sign up links when not authenticated', async () => {
      const user = userEvent.setup();
      renderNavbar();

      await user.click(screen.getByRole('button', { name: /profile menu/i }));

      expect(screen.getByRole('menuitem', { name: /login/i })).toHaveAttribute(
        'href',
        '/chatbot/login',
      );
      expect(screen.getByRole('menuitem', { name: /sign up/i })).toHaveAttribute(
        'href',
        '/chatbot/create-account',
      );
    });

    it('shows dashboard, profile, and logout when authenticated', async () => {
      const { isAuthenticated } = await import('../../utils/auth');
      isAuthenticated.mockReturnValue(true);
      localStorage.setItem('user', JSON.stringify({ fullName: 'Test User' }));

      const user = userEvent.setup();
      renderNavbar();

      await user.click(screen.getByRole('button', { name: /profile menu/i }));

      expect(screen.getByRole('menuitem', { name: /dashboard/i })).toHaveAttribute(
        'href',
        '/dashboard',
      );
      expect(screen.getByRole('menuitem', { name: /my profile/i })).toHaveAttribute(
        'href',
        '/profile',
      );
      expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument();
    });
  });

  it('closes profile dropdown on Escape key', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole('button', { name: /profile menu/i }));
    expect(screen.getByRole('menu', { name: /profile options/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: /profile options/i })).not.toBeInTheDocument();
  });
});
