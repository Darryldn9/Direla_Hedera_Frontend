import { ApiResponse, RequestOptions, ApiConfig } from '../../types/api';
import { getApiConfig } from './config';

export class ApiError extends Error {
  public statusCode?: number;
  public response?: ApiResponse;

  constructor(message: string, statusCode?: number, response?: ApiResponse) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export class BaseApiService {
  protected config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = { ...getApiConfig(), ...config };
  }

  /**
   * Make an HTTP request to the API
   */
  protected async request<T = any>(
    endpoint: string,
    options: RequestOptions = { method: 'GET' }
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    console.log('🌐 Making request to:', url);
    console.log('📋 Request options:', { method: options.method, body: options.body });
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const requestOptions: RequestInit = {
      method: options.method,
      headers: { ...defaultHeaders, ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Error response data:', errorData);
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data: ApiResponse<T> = await response.json();
      console.log('✅ Success response data:', data);
      return data;
    } catch (error: any) {
      console.log('💥 Request error:', error);
      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      throw new ApiError(
        error.message || 'Network error occurred',
        0
      );
    }
  }

  /**
   * Make a GET request
   */
  protected async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * Make a POST request
   */
  protected async post<T = any>(
    endpoint: string, 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  /**
   * Make a PUT request
   */
  protected async put<T = any>(
    endpoint: string, 
    body?: any, 
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * Retry a request with exponential backoff
   */
  protected async retryRequest<T = any>(
    requestFn: () => Promise<ApiResponse<T>>,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determine if a request should be retried
   */
  private shouldRetry(error: any): boolean {
    if (error instanceof ApiError) {
      // Retry on server errors (5xx) and timeouts
      return error.statusCode ? error.statusCode >= 500 : true;
    }
    // Retry on network errors
    return true;
  }

  /**
   * Check if the API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}
