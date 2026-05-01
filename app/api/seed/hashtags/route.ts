import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST() {
  try {
    // 1. Insert common hashtags
    await pool.query(`
      INSERT INTO hashtags (name) VALUES 
        ('coding'), ('react'), ('nextjs'), ('javascript'), ('webdev'),
        ('tech'), ('programming'), ('developer'), ('software'), ('ai')
      ON CONFLICT (name) DO NOTHING
    `);

    // 2. Get the most recent posts
    const postsRes = await pool.query(
      `SELECT id FROM posts ORDER BY created_at DESC LIMIT 10`
    );
    const postIds = postsRes.rows.map(r => r.id);

    // 3. Get hashtag IDs
    const hashtagsRes = await pool.query(`SELECT id, name FROM hashtags`);
    const hashtags = hashtagsRes.rows;

    if (postIds.length > 0 && hashtags.length > 0) {
      // 4. Randomly assign 1-3 hashtags to each post
      for (const postId of postIds) {
        const shuffled = hashtags.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
        for (const tag of selected) {
          await pool.query(
            `INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [postId, tag.id]
          );
        }
      }
    }

    // 5. Update posts_count on hashtags
    await pool.query(`
      UPDATE hashtags h
      SET posts_count = (
        SELECT COUNT(*) FROM post_hashtags ph WHERE ph.hashtag_id = h.id
      )
    `);

    return NextResponse.json({ success: true, message: 'Hashtags seeded' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}