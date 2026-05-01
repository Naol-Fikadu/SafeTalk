import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // First try last 7 days
    let result;
    try {
      const query7 = `
        SELECT h.id, h.name, COUNT(ph.post_id) as posts_count
        FROM hashtags h
        JOIN post_hashtags ph ON h.id = ph.hashtag_id
        JOIN posts p ON ph.post_id = p.id
        WHERE p.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY h.id, h.name
        ORDER BY posts_count DESC
        LIMIT 10
      `;
      result = await pool.query(query7);
    } catch {
      // If the 7‑day query fails for any reason, fallback silently
      result = { rows: [] };
    }

    // If no recent, fallback to all time
    if (!result || result.rows.length === 0) {
      const queryAll = `
        SELECT id, name, posts_count
        FROM hashtags
        WHERE posts_count > 0
        ORDER BY posts_count DESC
        LIMIT 10
      `;
      result = await pool.query(queryAll);
    }

    return NextResponse.json({
      trending: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        posts_count: parseInt(row.posts_count || 0),
      })),
    });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    // Return empty array rather than error, to prevent UI breakage
    return NextResponse.json({ trending: [] });
  }
}