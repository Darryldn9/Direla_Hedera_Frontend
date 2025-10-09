import { getSupabaseClient } from '../database/connection';
import { logger } from '../utils/logger';

export type NotificationType = 'BNPL_DEFAULT' | 'BNPL_PAYMENT_DUE' | 'BNPL_PAYMENT_POSTED' | 'SYSTEM';
export type NotificationChannel = 'IN_APP' | 'WHATSAPP';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  metadata: Record<string, any> | null;
  priority: NotificationPriority;
  related_bnpl_terms_id?: string | null;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
}

export class NotificationsService {
  private supabase = getSupabaseClient();

  async list(userId: string, limit = 50, before?: string): Promise<NotificationRecord[]> {
    const query = this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Failed to list notifications', { error, userId });
      throw new Error(error.message);
    }
    return (data as any[]) as NotificationRecord[];
  }

  async create(params: {
    userId: string;
    type: NotificationType;
    channel?: NotificationChannel;
    title: string;
    body: string;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
    relatedBnplTermsId?: string | null;
  }): Promise<NotificationRecord> {
    const { userId, type, title, body } = params;
    const { data, error } = await this.supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type,
          channel: params.channel || 'IN_APP',
          title,
          body,
          priority: params.priority || 'NORMAL',
          metadata: params.metadata || {},
          related_bnpl_terms_id: params.relatedBnplTermsId || null
        }
      ])
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create notification', { error, userId, type });
      throw new Error(error.message);
    }
    return data as unknown as NotificationRecord;
  }

  async markRead(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .is('archived_at', null);

    if (error) {
      logger.error('Failed to mark notification as read', { error, notificationId, userId });
      throw new Error(error.message);
    }
    return true;
  }

  async markArchived(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to archive notification', { error, notificationId, userId });
      throw new Error(error.message);
    }
    return true;
  }

  async unreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .is('archived_at', null);

    if (error) {
      logger.error('Failed to get unread notifications count', { error, userId });
      throw new Error(error.message);
    }
    return count ?? 0;
  }
}


