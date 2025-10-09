import { API_ENDPOINTS, getApiConfig } from './config';

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'BNPL_DEFAULT' | 'BNPL_PAYMENT_DUE' | 'BNPL_PAYMENT_POSTED' | 'SYSTEM';
  channel: 'IN_APP' | 'WHATSAPP';
  title: string;
  body: string;
  metadata?: Record<string, any>;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  related_bnpl_terms_id?: string | null;
  created_at: string;
  read_at?: string | null;
  archived_at?: string | null;
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiConfig().baseUrl;
  const fullUrl = `${baseUrl}${path}`;
  console.log('Making request to:', fullUrl);
  
  const res = await fetch(fullUrl, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  
  console.log('Response status:', res.status);
  const json = await res.json();
  console.log('Response data:', json);
  
  if (!res.ok || json.success === false) {
    throw new Error(json.error || 'Request failed');
  }
  return (json.data ?? json) as T;
}

export const notificationsApi = {
  async list(userId: string, limit = 50): Promise<NotificationItem[]> {
    return await http<NotificationItem[]>(`${API_ENDPOINTS.NOTIFICATIONS_LIST(userId)}?limit=${limit}`);
  },
  async unreadCount(userId: string): Promise<{ count: number }> {
    return await http<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT(userId));
  },
  async markRead(notificationId: string, userId: string): Promise<void> {
    await http<void>(API_ENDPOINTS.NOTIFICATIONS_MARK_READ(notificationId), {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
  async archive(notificationId: string, userId: string): Promise<void> {
    await http<void>(API_ENDPOINTS.NOTIFICATIONS_ARCHIVE(notificationId), {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};


