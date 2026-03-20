const { Expo } = require('expo-server-sdk');

const expo = new Expo();

/**
 * Send a push notification to one or more Expo push tokens.
 * @param {string|string[]} tokens  - Expo push token(s)
 * @param {string}          title   - Notification title
 * @param {string}          body    - Notification body
 * @param {object}          data    - Extra data payload (optional)
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  const tokenList = Array.isArray(tokens) ? tokens : [tokens];

  // Filter valid tokens
  const validTokens = tokenList.filter(token => {
    if (!Expo.isExpoPushToken(token)) {
      console.warn(`Invalid Expo push token: ${token}`);
      return false;
    }
    return true;
  });

  if (validTokens.length === 0) return;

  // Build messages
  const messages = validTokens.map(token => ({
    to:    token,
    sound: 'default',
    title,
    body,
    data,
  }));

  // Chunk and send
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log('Push receipts:', receipts);
    } catch (err) {
      console.error('Push notification error:', err);
    }
  }
};

module.exports = sendPushNotification;