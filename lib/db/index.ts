import { Pool } from '@neondatabase/serverless';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a mock pool for browser environments to prevent errors
const mockPool = {
  query: async () => {
    console.warn('Database queries cannot be executed in browser');
    return { rows: [] };
  },
  connect: async () => {
    console.warn('Database connections cannot be made in browser');
    return { release: () => {} };
  },
  end: async () => {},
};

// Only create real pool on server
export const pool = !isBrowser
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Reduced timeout
    })
  : mockPool;

// For development, log when pool is created (only on server)
if (!isBrowser && process.env.NODE_ENV === 'development') {
  console.log('📦 Database pool created');
}

// Handle pool errors gracefully
if (!isBrowser) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}