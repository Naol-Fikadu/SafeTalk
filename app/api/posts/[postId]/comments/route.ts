// app/api/posts/[postId]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { pusherServer } from '@/lib/pusher';

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const result = await pool.query(
      `SELECT 
        c.*,
        u.username,
        u.full_name,
        u.avatar_url,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', r.id,
              'content', r.content,
              'user_id', r.user_id,
              'created_at', r.created_at,
              'username', ru.username,
              'full_name', ru.full_name,
              'avatar_url', ru.avatar_url
            ) ORDER BY r.created_at ASC
          )
          FROM comments r
          JOIN users ru ON r.user_id = ru.id
          WHERE r.parent_id = c.id
          ), '[]'::json) as replies
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1 AND c.parent_id IS NULL
      ORDER BY c.created_at DESC`,
      [params.postId]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, parentId } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }
    
    const commentId = uuidv4();
    
    // Insert comment
    const insertResult = await pool.query(
      `INSERT INTO comments (id, post_id, user_id, content, parent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [commentId, params.postId, session.user.id, content.trim(), parentId || null]
    );
    
    // Update post comment count
    await pool.query(
      `UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1`,
      [params.postId]
    );
    
    // Get user info
    const userResult = await pool.query(
      `SELECT username, full_name, avatar_url FROM users WHERE id = $1`,
      [session.user.id]
    );
    
    const comment = {
      ...insertResult.rows[0],
      username: userResult.rows[0].username,
      full_name: userResult.rows[0].full_name,
      avatar_url: userResult.rows[0].avatar_url,
      replies: [],
    };

    // Get post owner for notification
    const post = await pool.query(
      `SELECT user_id FROM posts WHERE id = $1`,
      [params.postId]
    );

    const postOwnerId = post.rows[0]?.user_id;

    // Get actor info
    const actorRes2 = await pool.query(
      'SELECT username, full_name, avatar_url FROM users WHERE id = $1',
      [session.user.id]
    );
    const actor2 = actorRes2.rows[0] || {};
    const actorPayload2 = {
      id: session.user.id,
      username: actor2.username || session.user.username,
      full_name: actor2.full_name || session.user.name,
      avatar_url: actor2.avatar_url || null,
    };

    // Notify all users in the system
    if (pusherServer) {
      try {
        const usersRes = await pool.query(
          'SELECT id FROM users WHERE id != $1',
          [session.user.id]
        );
        for (const row of usersRes.rows) {
          const isOwner = row.id === postOwnerId;
          const notificationContent = isOwner 
            ? `${actorPayload2.username} commented on your post`
            : `${actorPayload2.username} commented on a post you might know`;
          
          const notifRes = await pool.query(
            `INSERT INTO notifications (user_id, type, actor_id, post_id, comment_id, content)
             VALUES ($1, 'comment', $2, $3, $4, $5) RETURNING *`,
            [row.id, session.user.id, params.postId, commentId, notificationContent]
          );

          if (notifRes.rows.length > 0) {
            await pusherServer.trigger(`user-notifications-${row.id}`, 'new-notification', {
              ...notifRes.rows[0],
              actor: actorPayload2,
              post: { id: params.postId, content: '' },
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to notify users about comment:', err);
      }
    }
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { commentId, content } = await req.json();
    if (!commentId || !content?.trim()) {
      return NextResponse.json({ error: 'Comment ID and content required' }, { status: 400 });
    }
    
    // Check if user is the author
    const check = await pool.query(
      `SELECT user_id FROM comments WHERE id = $1 AND post_id = $2`,
      [commentId, params.postId]
    );
    
    if (!check.rows.length || check.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const update = await pool.query(
      `UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [content.trim(), commentId]
    );
    
    return NextResponse.json(update.rows[0]);
  } catch (error) {
    console.error('Error editing comment:', error);
    return NextResponse.json({ error: 'Failed to edit comment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { commentId } = await req.json();
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }
    
    // Check if user is the author
    const check = await pool.query(
      `SELECT user_id FROM comments WHERE id = $1 AND post_id = $2`,
      [commentId, params.postId]
    );
    
    if (!check.rows.length || check.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete comment and all its replies
    await pool.query(`DELETE FROM comments WHERE id = $1 OR parent_id = $1`, [commentId]);
    
    // Update comment count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM comments WHERE post_id = $1`,
      [params.postId]
    );
    
    await pool.query(
      `UPDATE posts SET comments_count = $1 WHERE id = $2`,
      [countResult.rows[0].count, params.postId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}