const BASE = '/api';

async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders as Record<string, string>),
    },
  });
  const data: Record<string, unknown> = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data.error as string) ?? `Error ${res.status}`);
  return data;
}

export const api = {
  me: () => request('/me'),
  tipos: () => request('/tipos-ticket'),
  horarios: () => request('/horarios'),
  comprar: (body: object) => request('/compras', { method: 'POST', body: JSON.stringify(body) }),
};
