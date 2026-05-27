const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(extraHeaders as Record<string, string>),
    },
  });
  const data: Record<string, unknown> = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error as string) ?? `Error ${res.status}`);
  return data;
}

export const api = {
  register: (body: object) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: object) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  tipos: () => request('/tipos-ticket'),
  horarios: () => request('/horarios'),
  comprar: (body: object) => request('/compras', { method: 'POST', body: JSON.stringify(body) }),
};
