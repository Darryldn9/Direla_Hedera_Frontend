import { useCallback, useEffect, useMemo, useState } from 'react';
import { MetricsService, TimeseriesPoint } from '../services/api/metrics.service';
import { api } from '../services/api';

export function useMetrics(accountId?: string | null) {
  const [dailyRevenue, setDailyRevenue] = useState<{ revenue: number; count: number } | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<{ revenue: number; count: number } | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<{ revenue: number; count: number } | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => new MetricsService(), []);

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const [dResp, wResp, mResp, sResp] = await Promise.all([
        metrics.getDailyRevenue(accountId),
        metrics.getSummary(accountId, 'week'),
        metrics.getSummary(accountId, 'month'),
        metrics.getTimeseries(accountId, '7d'),
      ]);

      if (dResp.success && dResp.data) setDailyRevenue(dResp.data);
      if (wResp.success && wResp.data) setWeeklySummary({ revenue: wResp.data.revenue, count: wResp.data.count });
      if (mResp.success && mResp.data) setMonthlySummary({ revenue: mResp.data.revenue, count: mResp.data.count });
      if (sResp.success && sResp.data) setSeries(sResp.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [accountId, metrics]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dailyRevenue, weeklySummary, monthlySummary, series, loading, error, refresh };
}


