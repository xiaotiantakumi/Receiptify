import { render, screen, fireEvent, act } from '@testing-library/react';
import Header from '../../app/components/header';
import { AuthProvider } from '../../app/contexts/auth-context';
import * as auth from '../../app/lib/auth';

// Mock auth functions
jest.mock('../../app/lib/auth', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getUserInfo: jest.fn(),
}));

// Mock ApiStatus component
jest.mock('../../app/components/api-status', () => {
  return function MockApiStatus() {
    return <div data-testid="api-status">API Status</div>;
  };
});

// Mock user info
const mockUser = {
  userDetails: 'test@example.com',
  userRoles: ['user'],
  clientPrincipal: {
    userId: '123',
    userDetails: 'test@example.com',
    identityProvider: 'google',
    userRoles: ['user'],
    claims: [],
  },
};

const HeaderWithProvider = ({ children, ...props }: any) => (
  <AuthProvider>
    <Header {...props} />
    {children}
  </AuthProvider>
);

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default title and description', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    expect(screen.getByText('Receiptify')).toBeInTheDocument();
    expect(screen.getByText('レシートをAIで解析して確定申告を効率化')).toBeInTheDocument();
  });

  it('should render with custom title and description', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(
        <HeaderWithProvider 
          title="Custom Title" 
          description="Custom Description" 
        />
      );
    });

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  it('should render without description when not provided', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider title="Custom Title" description="" />);
    });

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.queryByText('レシートをAIで解析して確定申告を効率化')).not.toBeInTheDocument();
  });

  it('should render logo with R letter', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    const logo = screen.getByText('R');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('div')).toHaveClass('bg-indigo-600', 'rounded-lg');
  });

  it('should render ApiStatus component', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    expect(screen.getByTestId('api-status')).toBeInTheDocument();
  });

  it('should show loading spinner when loading is true', async () => {
    // Mock loading state by making getUserInfo never resolve
    (auth.getUserInfo as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show login buttons when user is not authenticated', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    // Wait for loading to complete
    await screen.findByText('Googleでログイン');

    expect(screen.getByText('Googleでログイン')).toBeInTheDocument();
    expect(screen.getByText('Microsoftでログイン')).toBeInTheDocument();
  });

  it('should show user info and logout button when user is authenticated', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    // Wait for user info to load
    await screen.findByText('test@example.com');

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('ログアウト')).toBeInTheDocument();
  });

  it('should call login function when Google login button is clicked', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    const googleButton = await screen.findByText('Googleでログイン');
    fireEvent.click(googleButton);

    expect(auth.login).toHaveBeenCalledWith('google');
  });

  it('should call login function when Microsoft login button is clicked', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    const microsoftButton = await screen.findByText('Microsoftでログイン');
    fireEvent.click(microsoftButton);

    expect(auth.login).toHaveBeenCalledWith('aad');
  });

  it('should call logout function when logout button is clicked', async () => {
    (auth.getUserInfo as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(<HeaderWithProvider />);
    });

    const logoutButton = await screen.findByText('ログアウト');
    fireEvent.click(logoutButton);

    expect(auth.logout).toHaveBeenCalled();
  });
});