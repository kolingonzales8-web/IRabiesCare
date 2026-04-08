// src/api/notifications.js
import client from './client';

// Initial badge hydration on page load
export const getNotificationCounts = () =>
  client.get('/notifications/counts');

// SSE stream — returns an EventSource connected to the backend
// Pass your token since EventSource doesn't support Authorization headers natively
export const createNotificationStream = (token) => {
  const baseURL = client.defaults.baseURL || '';
  const url     = `${baseURL}/notifications/stream?token=${token}`;
  return new EventSource(url);
};

// ── ADD THESE ──
export const getNotifications = () =>
  client.get('/notifications');

export const markAllRead = () =>
  client.patch('/notifications/read-all');