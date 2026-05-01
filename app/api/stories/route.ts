import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

// GET /api/stories – returns active stories (not expired) with viewed status for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const query = `
      SELECT 
        s.id,
        s.user_id,
        s.media_url,
        s.media_type,
        s.caption,
        s.audience,
        s.created_at,
        u.username,
        u.full_name,
        u.avatar_url,
        CASE WHEN sv.user_id IS NOT NULL THEN true ELSE false END as viewed
      FROM stories s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN story_views sv ON s.id = sv.story_id AND sv.user_id = $1
      WHERE s.expires_at > NOW()
      ORDER BY 
        CASE WHEN s.user_id = $2 THEN 0 ELSE 1 END,  -- current user's story first
        s.created_at DESC
    `;

    const result = await pool.query(query, [
      currentUserId || null,
      currentUserId || null,
    ]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/stories – create a new story
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { media_url, media_type, caption, audience } = await req.json();

    if (!media_url || !media_type) {
      return NextResponse.json({ error: 'Missing media' }, { status: 400 });
    }

    // Expire after 24 hours
    const query = `
      INSERT INTO stories (user_id, media_url, media_type, caption, audience, expires_at)
      VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')
      RETURNING id, user_id, media_url, media_type, caption, audience, created_at, expires_at
    `;
    const result = await pool.query(query, [
      session.user.id,
      media_url,
      media_type,
      caption || null,
      audience || 'public',
    ]);

    // Optionally fetch user details to return
    const story = result.rows[0];
    const userResult = await pool.query(
      'SELECT username, full_name, avatar_url FROM users WHERE id = $1',
      [session.user.id]
    );
    const user = userResult.rows[0];

    return NextResponse.json(
      {
        ...story,
        username: user?.username,
        full_name: user?.full_name,
        avatar_url: user?.avatar_url,
        viewed: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}