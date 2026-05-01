import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { pusherServer } from '@/lib/pusher';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await pool.query(
      `SELECT 
        p.*,
        u.username,
        u.full_name,
        u.avatar_url,
        u.is_verified,
        COALESCE(p.likes_count, 0) as likes_count,
        COALESCE(p.comments_count, 0) as comments_count,
        EXISTS(
          SELECT 1 FROM reactions r
          WHERE r.post_id = p.id AND r.user_id = $1 AND r.reaction_type = 'like'
        ) as is_liked,
        EXISTS(
          SELECT 1 FROM saved_posts sp
          WHERE sp.post_id = p.id AND sp.user_id = $1
        ) as is_saved
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_archived = false
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [session.user.id, limit, offset]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, visibility, location, tags, mediaUrls, mediaTypes } = await req.json();

    const postId = uuidv4();
    const tagArray = tags ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];

    // Parse location
    let locationObj = null;
    if (location) {
      try {
        locationObj = JSON.parse(location);
      } catch {
        locationObj = { name: location };
      }
    }

    const result = await pool.query(
      `INSERT INTO posts (
        id, user_id, content, media_urls, media_types, visibility, tags, location, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [postId, session.user.id, content, mediaUrls || [], mediaTypes || [], visibility, tagArray, locationObj]
    );

    // Get user details for the response
    const userResult = await pool.query(
      `SELECT username, full_name, avatar_url, is_verified FROM users WHERE id = $1`,
      [session.user.id]
    );

    const newPost = {
      ...result.rows[0],
      ...userResult.rows[0],
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
      is_saved: false,
    };

    // Process hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = content.match(hashtagRegex)?.map((tag: string) => tag.slice(1).toLowerCase()) || [];
    
    for (const tag of hashtags) {
      const hashtagResult = await pool.query(
        `INSERT INTO hashtags (name) VALUES ($1) 
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [tag]
      );
      
      await pool.query(
        `INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2)`,
        [postId, hashtagResult.rows[0].id]
      );
      
      await pool.query(
        `UPDATE hashtags SET posts_count = posts_count + 1 WHERE id = $1`,
        [hashtagResult.rows[0].id]
      );
    }

    if (pusherServer) {
      const actorUser = userResult.rows[0];
      const actorPayload = {
        id: session.user.id,
        username: actorUser?.username || session.user.username,
        full_name: actorUser?.full_name || session.user.name,
        avatar_url: actorUser?.avatar_url || null,
      };

      // Notify all users in the system directly
      try {
        const usersRes = await pool.query(
          'SELECT id FROM users WHERE id != $1',
          [session.user.id]
        );
        for (const row of usersRes.rows) {
          // Store notification in database
          const notifRes = await pool.query(
            `INSERT INTO notifications (user_id, type, actor_id, post_id, content)
             VALUES ($1, 'system', $2, $3, $4) RETURNING *`,
            [row.id, session.user.id, postId, 'just published a new post!']
          );

          if (notifRes.rows.length > 0) {
            await pusherServer.trigger(`user-notifications-${row.id}`, 'new-notification', {
              ...notifRes.rows[0],
              actor: actorPayload,
              post: { id: postId, content: content?.slice(0, 80) },
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Failed to notify users:', err);
      }
    }

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}