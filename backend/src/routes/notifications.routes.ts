import { Router, Request, Response } from 'express';
import { NotificationsService } from '../services/notifications.service';

const router = Router();
const notificationsService = new NotificationsService();

// List notifications for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit, before } = req.query;
    console.log('Fetching notifications for user:', userId, 'limit:', limit);
    const items = await notificationsService.list(userId!, Number(limit) || 50, before as string | undefined);
    console.log('Found notifications:', items.length);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to list notifications' });
  }
});

// Create a notification
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, channel, title, body, priority, metadata, relatedBnplTermsId } = req.body;
    if (!userId || !type || !title || !body) {
      return res.status(400).json({ success: false, error: 'userId, type, title, body are required' });
    }
    const item = await notificationsService.create({ userId, type, channel, title, body, priority, metadata, relatedBnplTermsId });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.post('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
    await notificationsService.markRead(notificationId!, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});

// Archive notification
router.post('/:notificationId/archive', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
    await notificationsService.markArchived(notificationId!, userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to archive notification' });
  }
});

// Unread count
router.get('/:userId/unread/count', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const count = await notificationsService.unreadCount(userId!);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
});

export default router;


