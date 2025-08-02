import '@testing-library/jest-dom';

// Configure React Testing Library
import { configure } from '@testing-library/react';

configure({
  // Ensure elements are automatically attached to the document body
  defaultHidden: false,
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock URL methods for file handling
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods for CSV download
const originalCreateElement = document.createElement;
const mockCreateElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
      href: '',
      download: '',
    };
    return mockLink;
  }
  return originalCreateElement.call(document, tagName);
});

// Store original methods for testing use
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

// Mock appendChild that actually appends for testing
document.body.appendChild = jest.fn((element) => {
  // For link elements (CSV download), just mock the behavior
  if (element.tagName === 'A') {
    return element;
  }
  // For other elements, actually append them
  return originalAppendChild.call(document.body, element);
});

document.body.removeChild = jest.fn((element) => {
  // For link elements (CSV download), just mock the behavior
  if (element.tagName === 'A') {
    return element;
  }
  // For other elements, actually remove them
  return originalRemoveChild.call(document.body, element);
});

// Set up safe defaults
document.createElement = mockCreateElement;