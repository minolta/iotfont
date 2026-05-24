const TOKEN_KEY = 'iot.access_token';

export function getStoredAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
