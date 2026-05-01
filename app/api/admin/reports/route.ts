import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build WHERE conditions and parameters dynamically
    const conditions: string[] = [];
    const params: any[] = [];

    if (status !== 'all') {
      conditions.push(`r.status = $${params.length + 1}`);
      params.push(status);
    }

    if (type !== 'all') {
      if (type === 'post') {
        conditions.push(`r.reported_post_id IS NOT NULL`);
      } else if (type === 'comment') {
        conditions.push(`r.reported_comment_id IS NOT NULL`);
      } else if (type === 'user') {
        conditions.push(`r.reported_user_id IS NOT NULL`);
      }
    }

    if (search) {
      // Search in reason, description, reporter username, reported username/content
      conditions.push(`
        (r.reason ILIKE $${params.length + 1} OR 
         r.description ILIKE $${params.length + 1} OR 
         reporter.username ILIKE $${params.length + 1} OR
         (SELECT u.username FROM users u WHERE u.id = r.reported_user_id) ILIKE $${params.length + 1} OR
         (SELECT p.content FROM posts p WHERE p.id = r.reported_post_id) ILIKE $${params.length + 1} OR
         (SELECT c.content FROM comments c WHERE c.id = r.reported_comment_id) ILIKE $${params.length + 1})
      `);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reporter.avatar_url as reporter_avatar,
        COALESCE(
          (SELECT json_build_object(
            'id', u.id,
            'username', u.username,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url
          ) FROM users u WHERE u.id = r.reported_user_id),
          NULL
        ) as reported_user,
        COALESCE(
          (SELECT json_build_object(
            'id', p.id,
            'content', p.content,
            'created_at', p.created_at,
            'user', json_build_object(
              'id', pu.id,
              'username', pu.username,
              'full_name', pu.full_name
            )
          ) FROM posts p
          LEFT JOIN users pu ON p.user_id = pu.id
          WHERE p.id = r.reported_post_id),
          NULL
        ) as reported_post,
        COALESCE(
          (SELECT json_build_object(
            'id', c.id,
            'content', c.content,
            'created_at', c.created_at,
            'user', json_build_object(
              'id', cu.id,
              'username', cu.username,
              'full_name', cu.full_name
            )
          ) FROM comments c
          LEFT JOIN users cu ON c.user_id = cu.id
          WHERE c.id = r.reported_comment_id),
          NULL
        ) as reported_comment
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      ${whereClause}
      ORDER BY r.created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Count query (same conditions but without LIMIT/OFFSET)
    const countConditions = conditions.slice(); // copy
    const countWhere = countConditions.length ? `WHERE ${countConditions.join(' AND ')}` : '';
    const countQuery = `SELECT COUNT(*) as total FROM reports r JOIN users reporter ON r.reporter_id = reporter.id ${countWhere}`;
    const countParams = params.slice(0, -2); // remove limit/offset
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      reports: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reportId, action, notes } = await req.json();

    if (!reportId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get report details
      const reportResult = await client.query(
        `SELECT * FROM reports WHERE id = $1`,
        [reportId]
      );
      if (reportResult.rows.length === 0) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      const report = reportResult.rows[0];

      let updateQuery;
      let logDetails: any = { reportId, action, notes };

      switch (action) {
        case 'resolve':
          updateQuery = `UPDATE reports SET status = 'resolved', resolved_by = $1, resolved_at = NOW(), admin_notes = $2 WHERE id = $3`;
          break;
        case 'dismiss':
          updateQuery = `UPDATE reports SET status = 'dismissed', resolved_by = $1, resolved_at = NOW(), admin_notes = $2 WHERE id = $3`;
          break;
        case 'remove_content':
          if (report.reported_post_id) {
            await client.query(`DELETE FROM posts WHERE id = $1`, [report.reported_post_id]);
            logDetails.content_removed = 'post';
          } else if (report.reported_comment_id) {
            await client.query(`DELETE FROM comments WHERE id = $1`, [report.reported_comment_id]);
            logDetails.content_removed = 'comment';
          }
          updateQuery = `UPDATE reports SET status = 'resolved', resolved_by = $1, resolved_at = NOW(), admin_notes = $2 WHERE id = $3`;
          break;
        case 'shadow_ban':
          if (report.reported_user_id) {
            await client.query(`UPDATE users SET is_shadow_banned = true, shadow_ban_reason = $1 WHERE id = $2`, [notes, report.reported_user_id]);
            logDetails.shadow_banned = true;
          }
          updateQuery = `UPDATE reports SET status = 'resolved', resolved_by = $1, resolved_at = NOW(), admin_notes = $2 WHERE id = $3`;
          break;
        default:
          throw new Error('Invalid action');
      }

      if (updateQuery) {
        await client.query(updateQuery, [session.user.id, notes, reportId]);
      }

      // Log admin action
      await client.query(
        `INSERT INTO admin_logs (admin_id, action, target_user_id, target_post_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [session.user.id, action, report.reported_user_id, report.reported_post_id, logDetails]
      );

      await client.query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}