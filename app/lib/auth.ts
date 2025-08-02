// Azure Static Web Apps認証のヘルパー関数

export interface UserInfo {
  userId: string;
  userDetails: string;
  userRoles: string[];
  identityProvider: string;
}

export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    const response = await fetch('/.auth/me');
    const authData = await response.json();
    
    if (authData.clientPrincipal) {
      return {
        userId: authData.clientPrincipal.userId,
        userDetails: authData.clientPrincipal.userDetails,
        userRoles: authData.clientPrincipal.userRoles || [],
        identityProvider: authData.clientPrincipal.identityProvider,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

export function login(provider: 'aad' | 'google' = 'aad') {
  window.location.href = `/.auth/login/${provider}`;
}

export function logout() {
  window.location.href = '/.auth/logout';
}

export function isAuthenticated(userInfo: UserInfo | null): boolean {
  return userInfo !== null;
}