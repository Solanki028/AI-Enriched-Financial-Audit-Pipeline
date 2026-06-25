import { ApiClient } from './ApiClient.js';

export class ApiClientFactory {
  static create() {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';
    return new ApiClient({ baseUrl });
  }
}
