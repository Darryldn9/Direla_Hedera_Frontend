import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { ApiConfig, ApiResponse } from '../../types/api';

export interface DailyRevenueData {
  revenue: number;
  count: number;
}

export interface SummaryData extends DailyRevenueData {
  period: 'day' | 'week' | 'month';
}

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  count: number;
}

export class MetricsService extends BaseApiService {
  constructor(config?: Partial<ApiConfig>) {
    super(config);
  }

  async getDailyRevenue(accountId: string): Promise<ApiResponse<DailyRevenueData>> {
    return this.get<DailyRevenueData>(API_ENDPOINTS.METRICS_DAILY_REVENUE(accountId));
  }

  async getSummary(accountId: string, period: 'day' | 'week' | 'month'): Promise<ApiResponse<SummaryData>> {
    return this.get<SummaryData>(API_ENDPOINTS.METRICS_SUMMARY(accountId, period));
  }

  async getTimeseries(accountId: string, range: '7d' | '30d'): Promise<ApiResponse<TimeseriesPoint[]>> {
    return this.get<TimeseriesPoint[]>(API_ENDPOINTS.METRICS_TIMESERIES(accountId, range));
  }
}


