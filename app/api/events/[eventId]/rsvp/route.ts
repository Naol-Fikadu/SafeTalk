import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const eventId = params.eventId;
    const userId = session.user.id;

    // Check if already attending
    const existing = await pool.query(
      `SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (existing.rows.length > 0) {
      // Cancel RSVP
      await pool.query(
        `DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );
      await pool.query(
        `UPDATE events SET attendees_count = GREATEST(0, attendees_count - 1) WHERE id = $1`,
        [eventId]
      );
      return NextResponse.json({ attending: false });
    } else {
      // RSVP
      await pool.query(
        `INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, 'going')`,
        [eventId, userId]
      );
      await pool.query(
        `UPDATE events SET attendees_count = attendees_count + 1 WHERE id = $1`,
        [eventId]
      );
      return NextResponse.json({ attending: true });
    }
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}