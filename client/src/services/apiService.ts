import { supabase } from '@/lib/supabase';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

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

  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        headers['user-id'] = user.id;
      }
    } catch (error) {
      console.warn('Failed to get user for auth headers:', error);
    }

    return headers;
  }

  static async post(endpoint: string, data?: any): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async get(endpoint: string): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'GET',
      headers,
    });
  }

  static async put(endpoint: string, data?: any): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(endpoint: string): Promise<Response> {
    const url = this.getFullUrl(endpoint);
    const headers = await this.getAuthHeaders();

    return fetch(url, {
      method: 'DELETE',
      headers,
    });
  }
}

export default ApiService;
