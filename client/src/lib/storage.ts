const TOKEN_KEY = 'token';

export async function setToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

export async function getToken(): Promise<string | null> {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export async function removeToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}
