import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumbs from '../index';

// Mock CSS import
vi.mock('../Breadcrumbs.css', () => ({}));

const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
};

describe('Breadcrumbs', () => {
  describe('home icon', () => {
    it('renders home icon when showHome=true', () => {
      renderWithRouter(<Breadcrumbs showHome={true} />, { route: '/about' });

      expect(screen.getByLabelText('Home')).toBeInTheDocument();
    });

    it('does not render home icon when showHome=false', () => {
      renderWithRouter(<Breadcrumbs showHome={false} />, { route: '/about' });

      expect(screen.queryByLabelText('Home')).not.toBeInTheDocument();
    });

    it('home link points to root', () => {
      renderWithRouter(<Breadcrumbs showHome={true} />, { route: '/about' });

      const homeLink = screen.getByLabelText('Home');
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('auto-generation', () => {
    it('auto-generates breadcrumbs from pathname', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/about' });

      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('generates nested breadcrumbs', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/chatbot/login' });

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('returns null on root path with no items', () => {
      const { container } = renderWithRouter(<Breadcrumbs showHome={false} />, {
        route: '/',
      });

      expect(container.querySelector('nav')).not.toBeInTheDocument();
    });
  });

  describe('route mapping', () => {
    it('maps known routes to friendly labels', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/chatbot' });
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    it('maps contact route correctly', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/contact' });
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('maps reports route correctly', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/reports' });
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('maps create-account route correctly', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/chatbot/create-account' });
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
  });

  describe('segment formatting', () => {
    it('formats unknown segments from kebab-case to Title Case', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/my-custom-page' });
      expect(screen.getByText('My Custom Page')).toBeInTheDocument();
    });

    it('handles single-word segments', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/dashboard' });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('aria-current', () => {
    it('last item has aria-current="page"', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/about' });

      const currentPage = screen.getByText('About');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('intermediate items do not have aria-current', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/chatbot/login' });

      const intermediateLink = screen.getByRole('link', { name: 'AI Assistant' });
      expect(intermediateLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('manual items', () => {
    it('uses provided items instead of auto-generation', () => {
      const items = [
        { label: 'Custom One', path: '/custom-one' },
        { label: 'Custom Two', path: '/custom-two' },
      ];

      renderWithRouter(<Breadcrumbs items={items} />, { route: '/other' });

      expect(screen.getByText('Custom One')).toBeInTheDocument();
      expect(screen.getByText('Custom Two')).toBeInTheDocument();
    });

    it('intermediate manual items are links', () => {
      const items = [
        { label: 'First', path: '/first' },
        { label: 'Second', path: '/second' },
      ];

      renderWithRouter(<Breadcrumbs items={items} />);

      const link = screen.getByRole('link', { name: 'First' });
      expect(link).toHaveAttribute('href', '/first');
    });

    it('last manual item is not a link', () => {
      const items = [
        { label: 'First', path: '/first' },
        { label: 'Last', path: '/last' },
      ];

      renderWithRouter(<Breadcrumbs items={items} />);

      expect(screen.queryByRole('link', { name: 'Last' })).not.toBeInTheDocument();
      expect(screen.getByText('Last')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has navigation landmark with aria-label', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/about' });

      expect(screen.getByRole('navigation')).toHaveAttribute(
        'aria-label',
        'Breadcrumb'
      );
    });

    it('uses ordered list for breadcrumbs', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/about' });

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('renders list items for each breadcrumb', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/chatbot/login' });

      // Home + 2 breadcrumb items
      const items = screen.getAllByRole('listitem');
      expect(items.length).toBe(3);
    });
  });

  describe('className', () => {
    it('applies custom className', () => {
      renderWithRouter(<Breadcrumbs className="custom-class" />, {
        route: '/about',
      });

      expect(screen.getByRole('navigation')).toHaveClass('custom-class');
    });

    it('preserves default breadcrumbs class with custom className', () => {
      renderWithRouter(<Breadcrumbs className="custom-class" />, {
        route: '/about',
      });

      expect(screen.getByRole('navigation')).toHaveClass('breadcrumbs');
    });
  });

  describe('separators', () => {
    it('renders separators between items', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/chatbot/login' });

      const separators = document.querySelectorAll('.breadcrumbs__separator');
      // Home -> AI Assistant -> Login = 2 separators
      expect(separators.length).toBe(2);
    });

    it('separator icons are hidden from screen readers', () => {
      renderWithRouter(<Breadcrumbs />, { route: '/about' });

      const svgs = document.querySelectorAll('.breadcrumbs__separator svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
