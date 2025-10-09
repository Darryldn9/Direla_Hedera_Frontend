import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { notificationsApi, NotificationItem } from '../services/api/notifications.service';
import { useUserManagement } from '../hooks/useAuth';
import { AlertTriangle, Bell, Check, CalendarClock, CreditCard } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationModal({ visible, onClose }: Props) {
  const { currentUser } = useUserManagement();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!currentUser?.user_id) {
      console.log('No currentUser.user_id available');
      setLoading(false);
      return;
    }
    console.log('Loading notifications for user:', currentUser.user_id);
    setLoading(true);
    try {
      const list = await notificationsApi.list(currentUser.user_id, 25);
      console.log('Loaded notifications:', list);
      setItems(list);
    } catch (e) {
      console.error('Failed to load notifications:', e);
      setItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) load();
  }, [visible, currentUser?.user_id]);

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'BNPL_DEFAULT':
        return <AlertTriangle size={20} color="#E74C3C" />; // urgent
      case 'BNPL_PAYMENT_DUE':
        return <CalendarClock size={20} color="#F39C12" />; // upcoming
      case 'BNPL_PAYMENT_POSTED':
        return <CreditCard size={20} color="#0C7C59" />; // success
      case 'SYSTEM':
      default:
        return <Bell size={20} color="#1C1C1E" />;
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.itemRow}>
      <View style={styles.leftIcon}>{renderIcon(item.type)}</View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemBody}>{item.body}</Text>
      </View>
      <View style={styles.rightActions}>
        {item.read_at ? (
          <Check size={18} color="#8E8E93" />
        ) : (
          <TouchableOpacity
            onPress={async () => {
              if (!currentUser?.user_id) return;
              await notificationsApi.markRead(item.id, currentUser.user_id);
              await load();
            }}
            style={styles.readIconButton}
          >
            <Check size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={{ padding: 16 }}>
              <Text>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(n) => n.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptySubtext}>You're all caught up! New notifications will appear here.</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeText: {
    color: '#0C7C59',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
  },
  leftIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  itemBody: {
    fontSize: 14,
    color: '#1C1C1E',
    marginTop: 4,
  },
  rightActions: {
    marginLeft: 12,
  },
  readIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});


