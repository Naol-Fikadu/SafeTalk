import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';

    let query = `
      SELECT 
        e.*,
        u.username as organizer_username,
        u.full_name as organizer_name,
        u.avatar_url as organizer_avatar
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE e.privacy = 'public'
    `;
    const params: any[] = [];

    if (category !== 'all') {
      query += ` AND e.category = $${params.length + 1}`;
      params.push(category);
    }

    if (search) {
      query += ` AND (e.title ILIKE $${params.length + 1} OR e.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY e.start_time ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, description, category, start_time, end_time, location, is_online, meeting_url, max_attendees, tags, cover_url } = body;

    if (!title || !start_time) {
      return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 });
    }

   const query = `
    INSERT INTO events (title, description, category, start_time, end_time, location, is_online, meeting_url, max_attendees, tags, cover_url, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  const values = [
    title,
    description || null,
    category || 'general',
    start_time,
    end_time || null,
    location || null,
    is_online || false,
    meeting_url || null,
    max_attendees ? parseInt(max_attendees) : null,
    tags ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags) : [],
    cover_url || null,
    session.user.id,
  ];

    const result = await pool.query(query, values);
    const event = result.rows[0];

    // Auto‑join creator as attending
    await pool.query(
      `INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, 'going')`,
      [event.id, session.user.id]
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}