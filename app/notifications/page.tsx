'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Bell, Check, Trash2, ExternalLink, Filter } from 'lucide-react';

interface Notification {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const categories = [
  'ALL',
  'GENERAL',
  'LEAVE',
  'ATTENDANCE',
  'PAYROLL',
  'PERFORMANCE',
  'RESIGNATION',
  'TERMINATION',
  'PROMOTION',
  'TRANSFER',
  'TASK',
  'ANNOUNCEMENT'
];

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [selectedCategory, filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const categoryParam = selectedCategory !== 'ALL' ? `&category=${selectedCategory}` : '';
      const unreadParam = filter === 'unread' ? '&unreadOnly=true' : '';
      const response = await fetch(`/api/notifications?limit=50${categoryParam}${unreadParam}`);
      
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      GENERAL: '📢',
      LEAVE: '🏖️',
      ATTENDANCE: '📅',
      PAYROLL: '💰',
      PERFORMANCE: '📊',
      RESIGNATION: '👋',
      TERMINATION: '⚠️',
      PROMOTION: '🎉',
      TRANSFER: '🔄',
      TASK: '✅',
      ANNOUNCEMENT: '📣'
    };
    return icons[category] || '📢';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-l-4 border-blue-500',
      SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-l-4 border-green-500',
      WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-l-4 border-yellow-500',
      ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-l-4 border-red-500'
    };
    return colors[type] || colors.INFO;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppShell title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stay updated with your latest activities and announcements
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            <div className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              {categories.slice(0, 6).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {category === 'ALL' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'unread'
                ? 'You have no unread notifications'
                : selectedCategory !== 'ALL'
                ? `No notifications in ${selectedCategory.toLowerCase()} category`
                : "You're all caught up!"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-5 hover:shadow-lg transition-shadow ${getTypeColor(notification.type)} ${
                  !notification.isRead ? 'ring-2 ring-purple-500/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {getCategoryIcon(notification.category)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-bold ${
                            !notification.isRead
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            {notification.category}
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="p-2 text-purple-600 hover:text-purple-700 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            title="View details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
