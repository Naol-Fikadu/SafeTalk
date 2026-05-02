import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';  // This imports from your db.ts file

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params: any[] = [];

    if (search) {
      conditions.push(`(c.content ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status === 'reported') {
      conditions.push(`EXISTS (SELECT 1 FROM reports WHERE reported_comment_id = c.id)`);
    } else if (status === 'spam') {
      conditions.push(`c.is_spam = true`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM comments c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Comments with user info and report counts
    const commentsResult = await pool.query(
      `SELECT 
        c.id,
        c.content,
        c.created_at,
        c.likes_count,
        u.id as user_id,
        u.username,
        u.full_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM reports WHERE reported_comment_id = c.id) as reports_count,
        COALESCE(c.is_spam, false) as is_spam
      FROM comments c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      comments: commentsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId, action, notes } = await req.json();

    if (!commentId || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Simple operations - use pool.query directly without transactions
    try {
      if (action === 'delete') {
        await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
      } else if (action === 'spam') {
        await pool.query('UPDATE comments SET is_spam = true WHERE id = $1', [commentId]);
      } else if (action === 'not-spam') {
        await pool.query('UPDATE comments SET is_spam = false WHERE id = $1', [commentId]);
      } else if (action === 'approve') {
        // If comment was reported, resolve related reports
        await pool.query('DELETE FROM reports WHERE reported_comment_id = $1', [commentId]);
      } else {
        throw new Error('Invalid action');
      }

      // Log admin action
      await pool.query(
        `INSERT INTO admin_logs (admin_id, action, target_user_id, target_post_id, details)
         VALUES ($1, $2, NULL, NULL, $3)`,
        [
          session.user.id,
          action,
          JSON.stringify({ commentId, notes: notes || '' }),
        ]
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}