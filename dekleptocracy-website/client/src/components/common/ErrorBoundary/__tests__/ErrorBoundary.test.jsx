import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { SectionErrorBoundary } from '../index';

// Mock CSS import
vi.mock('../ErrorBoundary.css', () => ({}));

// Component that throws an error
const ThrowError = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Suppress console.error for expected errors during tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows error message in fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays section name when provided', () => {
    render(
      <ErrorBoundary sectionName="Dashboard">
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Unable to load Dashboard')).toBeInTheDocument();
  });

  it('retry button resets error state', () => {
    let shouldThrow = true;
    const ConditionalError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry (using aria-label)
    fireEvent.click(screen.getByRole('button', { name: /try loading the content again/i }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('custom fallback receives error props', () => {
    const customFallback = vi.fn(({ error, retry }) => (
      <div>
        <span>Custom: {error.message}</span>
        <button onClick={retry}>Custom Retry</button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(customFallback).toHaveBeenCalled();
    expect(screen.getByText('Custom: Test error message')).toBeInTheDocument();
  });

  it('has accessible error alert role', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('includes contact support link', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const link = screen.getByRole('link', { name: /contact support/i });
    expect(link).toHaveAttribute('href', '/contact');
  });

  it('includes report issue button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /report.*issue/i })).toBeInTheDocument();
  });

  it('report button opens contact page', () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /report.*issue/i }));
    expect(windowOpen).toHaveBeenCalledWith('/contact', '_blank');
  });
});

describe('SectionErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <SectionErrorBoundary sectionName="Widget">
        <div>Widget content</div>
      </SectionErrorBoundary>,
    );

    expect(screen.getByText('Widget content')).toBeInTheDocument();
  });

  it('shows section-specific error message', () => {
    render(
      <SectionErrorBoundary sectionName="Widget">
        <ThrowError />
      </SectionErrorBoundary>,
    );

    expect(screen.getByText(/Unable to load Widget/)).toBeInTheDocument();
  });

  it('displays error message text', () => {
    render(
      <SectionErrorBoundary sectionName="Widget">
        <ThrowError />
      </SectionErrorBoundary>,
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows fallback data when provided', () => {
    render(
      <SectionErrorBoundary sectionName="Widget" fallbackData={<div>Fallback content</div>}>
        <ThrowError />
      </SectionErrorBoundary>,
    );

    expect(screen.getByText('Fallback content')).toBeInTheDocument();
  });

  it('includes retry button with section name in label', () => {
    render(
      <SectionErrorBoundary sectionName="Widget">
        <ThrowError />
      </SectionErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: /retry loading widget/i })).toBeInTheDocument();
  });
});
