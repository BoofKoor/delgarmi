/** The form's calls to the API, from the browser. Errors come back as the API's error code. */

export type Failure = { ok: false; status: number; error: string; body: Record<string, unknown> };
export type Result<T> = { ok: true; data: T } | Failure;

async function call<T>(path: string, init: RequestInit, token?: string): Promise<Result<T>> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init.body) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(path, { ...init, headers, cache: 'no-store' });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (response.ok) return { ok: true, data: body as T };
    const error = typeof body.error === 'string' ? body.error : response.status === 401 ? 'token' : 'server';
    return { ok: false, status: response.status, error, body };
  } catch {
    return { ok: false, status: 0, error: 'network', body: {} };
  }
}

export type SentCode = { sent: true; mobile: string; resend_after: number; expires_in: number };
export type Verified = { token: string; expires_in: number };
export type Created = { code: string; status: 'new' | 'waitlist' };
export type MyRequest = {
  code: string;
  status: string;
  service: { slug: string; name: string };
  city: { name: string; province: string } | null;
  online: boolean;
  mobile: string;
  created_at: string;
  events: { status: string; at: string }[];
};

export const sendCode = (mobile: string) => call<SentCode>('/api/otp/send', { method: 'POST', body: JSON.stringify({ mobile }) });

export const verifyCode = (mobile: string, code: string) =>
  call<Verified>('/api/otp/verify', { method: 'POST', body: JSON.stringify({ mobile, code }) });

export const submitRequest = (payload: Record<string, unknown>, token: string) =>
  call<Created>('/api/requests', { method: 'POST', body: JSON.stringify(payload) }, token);

export const myRequest = (code: string, token: string) =>
  call<MyRequest[]>(`/api/requests/mine?code=${encodeURIComponent(code)}`, { method: 'GET' }, token);

/** Where the «ثبت شد» page finds its request: this tab only, gone when it closes. */
export const DONE_KEY = 'delgarmi-request-done';
