import { ApiError } from './ApiError.js';

export class ApiClient {
  constructor({ baseUrl, defaultHeaders = {} }) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options = {}) {
    return this.request(path, { ...options, body, method: 'POST' });
  }

  put(path, body, options = {}) {
    return this.request(path, { ...options, body, method: 'PUT' });
  }

  async request(path, { body, method, query } = {}) {
    const response = await fetch(this.buildUrl(path, query), {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
      },
      method,
    });

    const payload = await this.parseJson(response);

    if (!response.ok) {
      const error = payload?.error ?? {};
      throw new ApiError({
        details: error.details,
        errorCode: error.errorCode ?? error.code ?? 'API_ERROR',
        message: error.message ?? 'API request failed.',
        status: response.status,
      });
    }

    return payload?.data ?? payload;
  }

  buildUrl(path, query) {
    const url = new URL(this.baseUrl + path);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  async parseJson(response) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
}
