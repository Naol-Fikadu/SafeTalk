import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';
import { pusherServer } from '@/lib/pusher';

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if already liked
    const existing = await pool.query(
      `SELECT 1 FROM reactions 
       WHERE post_id = $1 AND user_id = $2 AND reaction_type = 'like'`,
      [params.postId, session.user.id]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        `DELETE FROM reactions 
         WHERE post_id = $1 AND user_id = $2 AND reaction_type = 'like'`,
        [params.postId, session.user.id]
      );
      
      await pool.query(
        `UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1`,
        [params.postId]
      );

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await pool.query(
        `INSERT INTO reactions (post_id, user_id, reaction_type)
         VALUES ($1, $2, 'like')`,
        [params.postId, session.user.id]
      );
      
      await pool.query(
        `UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1`,
        [params.postId]
      );

      // Get post owner for notification
      const post = await pool.query(
        `SELECT user_id FROM posts WHERE id = $1`,
        [params.postId]
      );

      // Get actor info for notification payload
      const actorRes = await pool.query(
        'SELECT username, full_name, avatar_url FROM users WHERE id = $1',
        [session.user.id]
      );
      const actor = actorRes.rows[0] || {};
      const actorPayload = {
        id: session.user.id,
        username: actor.username || session.user.username,
        full_name: actor.full_name || session.user.name,
        avatar_url: actor.avatar_url || null,
      };

      const postOwnerId = post.rows[0]?.user_id;

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
              ? `${actorPayload.username} liked your post`
              : `${actorPayload.username} liked a post you might know`;

            const notifRes = await pool.query(
              `INSERT INTO notifications (user_id, type, actor_id, post_id, content)
               VALUES ($1, 'like', $2, $3, $4) RETURNING *`,
              [row.id, session.user.id, params.postId, notificationContent]
            );

            if (notifRes.rows.length > 0) {
              await pusherServer.trigger(`user-notifications-${row.id}`, 'new-notification', {
                ...notifRes.rows[0],
                actor: actorPayload,
                post: { id: params.postId, content: '' },
              }).catch(() => {});
            }
          }
        } catch (err) {
          console.error('Failed to notify users about like:', err);
        }
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}