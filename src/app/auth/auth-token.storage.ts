const TOKEN_KEY = 'iot.access_token';

export function getStoredAccessToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAccessToken(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}
