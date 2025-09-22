import { Router, Request, Response } from 'express';
import { HederaService, HederaAccountService, TransactionHistoryItem } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { isValidHederaAccountId } from '../utils/hedera-validation.js';
import { cacheGet, cacheSet, cacheDel, cacheKeys } from '../utils/redis.js';

type Period = 'day' | 'week' | 'month';

function startOfDayISO(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function startOfPeriod(date: Date, period: Period): number {
  const d = new Date(date);
  if (period === 'day') {
    d.setUTCHours(0, 0, 0, 0);
  } else if (period === 'week') {
    const day = d.getUTCDay(); // 0..6 (Sun..Sat)
    const diff = (day + 6) % 7; // make Monday start
    d.setUTCDate(d.getUTCDate() - diff);
    d.setUTCHours(0, 0, 0, 0);
  } else if (period === 'month') {
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
  }
  return d.getTime();
}

function filterByPeriod(transactions: TransactionHistoryItem[], accountId: string, period: Period, now = new Date()): TransactionHistoryItem[] {
  const startMs = startOfPeriod(now, period);
  return transactions.filter(t => t.time >= startMs);
}

function computeMetrics(transactions: TransactionHistoryItem[], accountId: string) {
  let revenue = 0;
  let count = 0;
  for (const t of transactions) {
    if (t.to === accountId) {
      revenue += t.amount;
      count += 1;
    }
  }
  return { revenue, count };
}

export class MetricsRoutes {
  private router: Router;
  private hederaService: HederaService;
  private hederaAccountService: HederaAccountService;

  constructor(hederaService: HederaService, hederaAccountService: HederaAccountService) {
    this.router = Router();
    this.hederaService = hederaService;
    this.hederaAccountService = hederaAccountService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/daily-revenue/:accountId', this.getDailyRevenue.bind(this));
    this.router.get('/summary/:accountId', this.getSummary.bind(this));
    this.router.get('/timeseries/:accountId', this.getTimeseries.bind(this));
  }

  /**
   * GET /metrics/daily-revenue/:accountId
   * Returns today's revenue and count, cached per account per day.
   */
  private async getDailyRevenue(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      if (!accountId || !isValidHederaAccountId(accountId)) {
        res.status(400).json({ success: false, error: 'Invalid Hedera account ID format' });
        return;
      }

      // Validate account exists and active
      const account = await this.hederaAccountService.getAccountByAccountId(accountId);
      if (!account || !account.is_active) {
        res.status(400).json({ success: false, error: 'Account not found or inactive' });
        return;
      }

      const todayISO = startOfDayISO(new Date());
      const cacheKey = cacheKeys.metrics.dailyRevenue(accountId, todayISO);
      const cached = await cacheGet<{ revenue: number; count: number }>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, message: 'Daily revenue served from cache' });
        return;
      }

      const transactions = await this.hederaService.getTransactionHistory(accountId, 500);
      const todays = filterByPeriod(transactions, accountId, 'day');
      const metrics = computeMetrics(todays, accountId);
      await cacheSet(cacheKey, metrics);
      res.json({ success: true, data: metrics, message: 'Daily revenue computed' });
    } catch (error) {
      logger.error('GET /metrics/daily-revenue failed', { error, params: req.params });
      res.status(500).json({ success: false, error: 'Failed to get daily revenue' });
    }
  }

  /**
   * GET /metrics/summary/:accountId?period=day|week|month
   * Returns revenue and transaction count for the period. Cached per account.
   */
  private async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const period = (req.query.period as Period) || 'day';

      if (!accountId || !isValidHederaAccountId(accountId)) {
        res.status(400).json({ success: false, error: 'Invalid Hedera account ID format' });
        return;
      }
      if (!['day', 'week', 'month'].includes(period)) {
        res.status(400).json({ success: false, error: 'Invalid period. Use day, week, or month' });
        return;
      }

      // cache by account+period in summary key
      const summaryKey = cacheKeys.metrics.summary(`${accountId}:${period}`);
      const cached = await cacheGet<{ period: Period; revenue: number; count: number }>(summaryKey);
      if (cached) {
        res.json({ success: true, data: cached, message: 'Summary served from cache' });
        return;
      }

      const transactions = await this.hederaService.getTransactionHistory(accountId, 1000);
      const filtered = filterByPeriod(transactions, accountId, period);
      const metrics = computeMetrics(filtered, accountId);
      const payload = { period, ...metrics };
      await cacheSet(summaryKey, payload);
      res.json({ success: true, data: payload, message: 'Summary computed' });
    } catch (error) {
      logger.error('GET /metrics/summary failed', { error, params: req.params, query: req.query });
      res.status(500).json({ success: false, error: 'Failed to get summary' });
    }
  }

  /**
   * GET /metrics/timeseries/:accountId?range=7d|30d
   * Returns a simple daily timeseries of revenue for the range. Cached.
   */
  private async getTimeseries(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const range = (req.query.range as string) || '7d';
      if (!accountId || !isValidHederaAccountId(accountId)) {
        res.status(400).json({ success: false, error: 'Invalid Hedera account ID format' });
        return;
      }
      if (!['7d', '30d'].includes(range)) {
        res.status(400).json({ success: false, error: 'Invalid range. Use 7d or 30d' });
        return;
      }

      const cacheKey = cacheKeys.metrics.timeseries(accountId, range);
      const cached = await cacheGet<{ date: string; revenue: number; count: number }[]>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached, message: 'Timeseries served from cache' });
        return;
      }

      const days = range === '30d' ? 30 : 7;
      const limit = Math.max(500, days * 50); // heuristic
      const transactions = await this.hederaService.getTransactionHistory(accountId, limit);

      // Bucket by UTC day
      const buckets = new Map<string, { revenue: number; count: number }>();
      const now = new Date();
      for (let i = 0; i < days; i++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        d.setUTCDate(d.getUTCDate() - i);
        buckets.set(d.toISOString().slice(0, 10), { revenue: 0, count: 0 });
      }

      for (const t of transactions) {
        const dateKey = new Date(t.time).toISOString().slice(0, 10);
        if (buckets.has(dateKey) && t.to === accountId) {
          const cur = buckets.get(dateKey)!;
          cur.revenue += t.amount;
          cur.count += 1;
        }
      }

      const series = Array.from(buckets.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, v]) => ({ date, revenue: v.revenue, count: v.count }));

      await cacheSet(cacheKey, series);
      res.json({ success: true, data: series, message: 'Timeseries computed' });
    } catch (error) {
      logger.error('GET /metrics/timeseries failed', { error, params: req.params, query: req.query });
      res.status(500).json({ success: false, error: 'Failed to get timeseries' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}


