import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      fixed: 0,
      errors: [] as string[]
    };

    // Fix all conversations missing creators
    const missingCreator = await pool.query(`
      SELECT c.id, c.created_by
      FROM conversations c
      WHERE NOT EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = c.id AND user_id = c.created_by
      )
    `);

    for (const row of missingCreator.rows) {
      try {
        await pool.query(
          `INSERT INTO conversation_participants 
           (conversation_id, user_id, role, joined_at)
           VALUES ($1, $2, 'admin', NOW())
           ON CONFLICT DO NOTHING`,
          [row.id, row.created_by]
        );
        results.fixed++;
      } catch (err) {
        results.errors.push(`Failed to fix conversation ${row.id}: ${err}`);
      }
    }

    // Fix direct messages with wrong participant count
    const directConvs = await pool.query(`
      SELECT c.id, array_agg(cp.user_id) as participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.type = 'direct'
      GROUP BY c.id
      HAVING COUNT(cp.user_id) != 2
    `);

    for (const row of directConvs.rows) {
      try {
        // Get the two users involved from messages
        const messages = await pool.query(
          `SELECT DISTINCT sender_id, receiver_id 
           FROM messages 
           WHERE conversation_id = $1 
           LIMIT 1`,
          [row.id]
        );

        if (messages.rows.length > 0) {
          const msg = messages.rows[0];
          const neededUsers = [msg.sender_id, msg.receiver_id];
          
          for (const userId of neededUsers) {
            if (!row.participants.includes(userId)) {
              await pool.query(
                `INSERT INTO conversation_participants 
                 (conversation_id, user_id, role, joined_at)
                 VALUES ($1, $2, 'member', NOW())
                 ON CONFLICT DO NOTHING`,
                [row.id, userId]
              );
              results.fixed++;
            }
          }
        }
      } catch (err) {
        results.errors.push(`Failed to fix direct conversation ${row.id}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      message: `Fixed ${results.fixed} conversations`
    });
  } catch (error) {
    console.error('Maintenance error:', error);
    return NextResponse.json({ error: 'Maintenance failed' }, { status: 500 });
  }
}