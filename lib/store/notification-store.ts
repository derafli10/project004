import { create } from 'zustand';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification';
import type { Notification } from '@prisma/client';

export interface NotificationWithCourse extends Notification {
  course: { id: string; name: string };
}

interface NotificationState {
  notifications: NotificationWithCourse[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  togglePanel: () => void;
  closePanel: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    const result = await getNotifications();
    if (result.success) {
      const notifications = result.data as NotificationWithCourse[];
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } else {
      set({ error: result.error, isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const prevNotifications = get().notifications;
    const prevCount = get().unreadCount;
    
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (notification && !notification.isRead) {
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    });

    const result = await markNotificationRead(id);
    if (!result.success) {
      // Revert on error
      set({ notifications: prevNotifications, unreadCount: prevCount, error: result.error });
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    const prevNotifications = get().notifications;
    const prevCount = get().unreadCount;
    
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));

    const result = await markAllNotificationsRead();
    if (!result.success) {
      // Revert on error
      set({ notifications: prevNotifications, unreadCount: prevCount, error: result.error });
    }
  },

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  closePanel: () => set({ isOpen: false }),
}));
