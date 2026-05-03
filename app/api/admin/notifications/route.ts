import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolClient } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: NextRequest) {
  let client: PoolClient | null = null;
  
  try {
    const body = await request.json();
    const { targetUserId, message, type } = body;

    // Validate required fields
    if (!message || !type) {
      return NextResponse.json(
        { error: 'Message and type are required' },
        { status: 400 }
      );
    }

    // Connect to database
    client = await pool.connect();

    if (targetUserId) {
      // Send notification to a single user
      await client.query(
        `INSERT INTO notifications (user_id, message, type, created_at, is_read)
         VALUES ($1, $2, $3, NOW(), false)
         RETURNING *`,
        [targetUserId, message, type]
      );
    } else {
      // Send notification to all users (admin broadcast)
      await client.query(
        `INSERT INTO notifications (user_id, message, type, created_at, is_read)
         SELECT id, $1, $2, NOW(), false
         FROM users`,
        [message, type]
      );
    }

    return NextResponse.json(
      { success: true, message: 'Notification sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function GET(request: NextRequest) {
  let client: PoolClient | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // Get notifications for specific user
    const result = await client.query(
      `SELECT id, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get unread count
    const countResult = await client.query(
      `SELECT COUNT(*) as unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: parseInt(countResult.rows[0]?.unread_count || '0'),
      pagination: {
        limit,
        offset,
        total: result.rowCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function PUT(request: NextRequest) {
  let client: PoolClient | null = null;
  
  try {
    const body = await request.json();
    const { notificationId, userId, markAllAsRead } = body;

    client = await pool.connect();

    if (markAllAsRead && userId) {
      // Mark all notifications as read for a user
      await client.query(
        `UPDATE notifications
         SET is_read = true
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );
      
      return NextResponse.json(
        { success: true, message: 'All notifications marked as read' },
        { status: 200 }
      );
    } else if (notificationId) {
      // Mark single notification as read
      const result = await client.query(
        `UPDATE notifications
         SET is_read = true
         WHERE id = $1
         RETURNING *`,
        [notificationId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        notification: result.rows[0]
      });
    } else {
      return NextResponse.json(
        { error: 'Notification ID or userId with markAllAsRead is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function DELETE(request: NextRequest) {
  let client: PoolClient | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (!notificationId && !deleteAll) {
      return NextResponse.json(
        { error: 'Notification ID is required or use deleteAll=true' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    if (deleteAll && userId) {
      // Delete all notifications for a user
      await client.query(
        'DELETE FROM notifications WHERE user_id = $1',
        [userId]
      );
      
      return NextResponse.json(
        { success: true, message: 'All notifications deleted' },
        { status: 200 }
      );
    } else if (notificationId) {
      // Delete single notification
      const result = await client.query(
        'DELETE FROM notifications WHERE id = $1 RETURNING id',
        [notificationId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Notification deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'User ID is required to delete all notifications' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}