import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from '../../app/components/theme-toggle';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(public callback: MutationCallback) {}
  observe() {}
  disconnect() {}
  takeRecords() { return []; }
} as any;

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM classes
    document.documentElement.className = '';
  });

  it('should render theme toggle button', () => {
    render(<ThemeToggle />);
    
    // Component should render a button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });


  it('should have correct aria-label for light mode', async () => {
    render(<ThemeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'ダークモードに切り替え');
    });
  });

  it('should toggle to dark mode when clicked', async () => {
    render(<ThemeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  it('should show correct icon for light mode', async () => {
    render(<ThemeToggle />);
    
    await waitFor(() => {
      // Should show moon icon for light mode (to switch to dark)
      const moonIcon = screen.getByRole('button').querySelector('svg path[d*="17.293"]');
      expect(moonIcon).toBeInTheDocument();
    });
  });

  it('should show correct icon for dark mode', async () => {
    // Set initial dark mode
    document.documentElement.classList.add('dark');
    
    render(<ThemeToggle />);
    
    await waitFor(() => {
      // Should show sun icon for dark mode (to switch to light)
      const sunIcon = screen.getByRole('button').querySelector('svg path[fill-rule="evenodd"]');
      expect(sunIcon).toBeInTheDocument();
    });
  });

  it('should toggle back to light mode when clicked twice', async () => {
    render(<ThemeToggle />);
    
    await waitFor(async () => {
      const button = screen.getByRole('button');
      
      // First click - to dark mode
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      
      // Second click - back to light mode
      fireEvent.click(button);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  it('should have correct title attribute', async () => {
    render(<ThemeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'ダークモードに切り替え');
    });
  });
});