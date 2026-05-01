// lib/pusher.ts
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Server-side Pusher instance (only created on server)
export const pusherServer = !isBrowser && process.env.PUSHER_APP_ID 
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

// Client-side Pusher instance - needs hardcoded values for browser
// These must match your .env.local values
const PUSHER_KEY = '6e16f650a9d61705f8ef';
const PUSHER_CLUSTER = 'mt1';

export const pusherClient = (() => {
  if (!isBrowser) return null;
  
  try {
    return new PusherClient(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
  } catch (error) {
    console.error('Failed to initialize Pusher client:', error);
    return null;
  }
})();

// Helper to check if Pusher is available
export const isPusherAvailable = !!pusherClient;