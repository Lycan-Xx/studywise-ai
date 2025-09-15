const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiService {
  private static getFullUrl(endpoint: string): string {
    // If endpoint starts with http, it's already a full URL
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // If we have a base URL, use it
    if (API_BASE_URL) {
      return `${API_BASE_URL}${endpoint}`;
    }

    // Fallback to relative URL (for development)
    return endpoint;
  }

  static async post(endpoint: string, data?: any): Promise<Response> {
    const url = this.getFullUrl(endpoint);

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async get(endpoint: string): Promise<Response> {
    const url = this.getFullUrl(endpoint);

    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export default ApiService;