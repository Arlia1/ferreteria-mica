export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mica_admin_token');
}

export function setAdminToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('mica_admin_token', token);
  } else {
    localStorage.removeItem('mica_admin_token');
  }
}

export function getResolvedBackendUrl(): string {
  const envBackend = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim().replace(/\/$/, '');
  const isPlaceholder = !envBackend || envBackend.includes('tu-backend') || envBackend.includes('example');
  if (envBackend && !isPlaceholder) {
    return envBackend;
  }
  return '';
}

export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let finalUrl = url;
  if (url.startsWith('/api/')) {
    const base = getResolvedBackendUrl();
    if (base) {
      finalUrl = `${base}${url}`;
    }
  }

  return fetch(finalUrl, {
    ...init,
    headers,
    credentials: 'include',
  });
}
