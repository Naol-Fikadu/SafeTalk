import { Pool } from 'pg';

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

// Global type fix (avoids multiple pool creation in dev)
const globalForPool = globalThis as unknown as {
  pool: Pool | undefined;
};

// Only create real pool on server
export const pool: Pool | typeof mockPool =
  !isBrowser
    ? globalForPool.pool ??
      new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      })
    : mockPool;

// Save pool globally in development
if (!isBrowser && process.env.NODE_ENV !== 'production') {
  globalForPool.pool = pool as Pool;
}

// For development logging
if (!isBrowser && process.env.NODE_ENV === 'development') {
  console.log('📦 Database pool created');
}

// Handle pool errors (ONLY for real pool)
if (!isBrowser) {
  (pool as Pool).on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
  });
}