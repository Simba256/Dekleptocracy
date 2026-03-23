import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

vi.mock('../Footer.css', () => ({}));

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

describe('Footer', () => {
  it('renders the footer element with proper landmark', () => {
    renderFooter();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders the site logo text', () => {
    const { container } = renderFooter();
    const logo = container.querySelector('.footer-logo');
    expect(logo).toBeInTheDocument();
    expect(logo.textContent).toContain('kleptocracy');
  });

  it('renders the copyright notice', () => {
    renderFooter();
    expect(screen.getByText(/2025 Dekleptocracy, All rights reserved/i)).toBeInTheDocument();
  });

  describe('legal navigation links', () => {
    it('renders Privacy Policy link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /privacy policy/i });
      expect(link).toHaveAttribute('href', '/privacy-policy');
    });

    it('renders Terms of Service link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /terms of service/i });
      expect(link).toHaveAttribute('href', '/terms-of-service');
    });

    it('renders Copyright Policy link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /copyright policy/i });
      expect(link).toHaveAttribute('href', '/copyright-policy');
    });

    it('renders Data Policy link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /data policy/i });
      expect(link).toHaveAttribute('href', '/data-policy');
    });

    it('renders Accessibility link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /accessibility/i });
      expect(link).toHaveAttribute('href', '/accessibility');
    });

    it('renders Help link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /help/i });
      expect(link).toHaveAttribute('href', '/help');
    });
  });

  describe('main navigation links', () => {
    it('renders About Us link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /about us/i });
      expect(link).toHaveAttribute('href', '/about');
    });

    it('renders Services link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /services/i });
      expect(link).toHaveAttribute('href', '/services');
    });

    it('renders Contact Us link with correct route', () => {
      renderFooter();
      const link = screen.getByRole('link', { name: /contact us/i });
      expect(link).toHaveAttribute('href', '/contact');
    });
  });

  it('renders all expected navigation links', () => {
    renderFooter();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(9);
  });
});
