// Guardian API specific types and interfaces
export interface GuardianApiParams {
  section?: string;
  q?: string;
  'page-size'?: number;
  page?: number;
  'show-fields'?: string;
  'order-by'?: 'newest' | 'oldest' | 'relevance';
}

export interface GuardianApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface GuardianServiceConfig {
  baseUrl: string;
  apiKey: string;
  defaultParams: GuardianApiParams;
  timeout: number;
}