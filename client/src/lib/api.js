// Small fetch wrapper. Adds the login token and turns server errors into ApiError.
// There are two clients so a customer and an admin can be logged in at the same time
// in the same browser without mixing tokens.

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || [];
  }
  // { "shipping.phone": "Enter a valid phone number", ... } for showing errors under inputs
  get fieldErrors() {
    const out = {};
    for (const d of this.details) if (d.field && !out[d.field]) out[d.field] = d.message;
    return out;
  }
}

export function createClient(tokenKey) {
  const client = {
    onUnauthorized: null,
    getToken: () => localStorage.getItem(tokenKey),
    setToken: (token) => (token ? localStorage.setItem(tokenKey, token) : localStorage.removeItem(tokenKey)),
  };

  async function request(method, path, { body, form, params } = {}) {
    const headers = {};
    const token = client.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let payload;
    if (form) {
      payload = form; // the browser sets the multipart header itself
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    let url = `/api${path}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, v);
      }
      if (qs.toString()) url += `?${qs}`;
    }

    let res;
    try {
      res = await fetch(url, { method, headers, body: payload });
    } catch {
      throw new ApiError(0, 'Cannot reach the server. Check that the API is running.');
    }

    if (res.status === 204) return null;
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* no JSON body */
    }

    if (!res.ok) {
      // Token expired or account disabled -> log out locally
      if (res.status === 401 && token) {
        client.setToken(null);
        if (client.onUnauthorized) client.onUnauthorized();
      }
      throw new ApiError(res.status, data?.error || 'Something went wrong. Please try again.', data?.details);
    }
    return data;
  }

  client.get = (path, params) => request('GET', path, { params });
  client.post = (path, body) => request('POST', path, { body });
  client.put = (path, body) => request('PUT', path, { body });
  client.del = (path) => request('DELETE', path);
  client.postForm = (path, form) => request('POST', path, { form });
  client.putForm = (path, form) => request('PUT', path, { form });
  return client;
}

export const api = createClient('hbk_token'); // shop customers
export const adminApi = createClient('hbk_admin_token'); // admin panel
