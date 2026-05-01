import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {};

    // 1. Check current user
    const currentUser = await pool.query(
      `SELECT id, username, full_name FROM users WHERE id = $1`,
      [session.user.id]
    );
    results.currentUser = currentUser.rows[0];

    // 2. Get all conversations for current user
    const conversations = await pool.query(
      `SELECT c.*, 
        COUNT(DISTINCT cp.user_id) as participant_count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
      GROUP BY c.id`,
      [session.user.id]
    );
    results.userConversations = conversations.rows;

    // 3. Check each conversation's participants
    results.conversationDetails = [];
    for (const conv of conversations.rows) {
      const participants = await pool.query(
        `SELECT 
          cp.*,
          u.id as user_id,
          u.username,
          u.full_name,
          u.avatar_url
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = $1`,
        [conv.id]
      );
      
      results.conversationDetails.push({
        conversationId: conv.id,
        participantCount: participants.rows.length,
        participants: participants.rows,
        hasCurrentUser: participants.rows.some(p => p.user_id === session.user.id),
        participantIds: participants.rows.map(p => p.user_id)
      });
    }

    // 4. Check for conversations missing current user
    results.missingCurrentUser = results.conversationDetails
      .filter((d: any) => !d.hasCurrentUser)
      .map((d: any) => d.conversationId);

    // 5. Check all conversations in database
    const allConversations = await pool.query(
      `SELECT c.id, c.type, c.created_by,
        array_agg(cp.user_id) as participant_ids
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      GROUP BY c.id`
    );
    results.allConversations = allConversations.rows;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ error: 'Diagnostic failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await req.json();

    const results: any = {
      fixed: [],
      errors: []
    };

    if (conversationId) {
      const fixResult = await fixConversationParticipants(conversationId, session.user.id);
      if (fixResult.success) {
        results.fixed.push(fixResult);
      } else {
        results.errors.push(fixResult);
      }
    } else {
      const missingConvs = await pool.query(
        `SELECT c.id
        FROM conversations c
        WHERE NOT EXISTS (
          SELECT 1 FROM conversation_participants 
          WHERE conversation_id = c.id AND user_id = $1
        )`,
        [session.user.id]
      );

      for (const row of missingConvs.rows) {
        const fixResult = await fixConversationParticipants(row.id, session.user.id);
        if (fixResult.success) {
          results.fixed.push(fixResult);
        } else {
          results.errors.push(fixResult);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Fix error:', error);
    return NextResponse.json({ error: 'Fix failed' }, { status: 500 });
  }
}

async function fixConversationParticipants(conversationId: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await pool.connect() as any;
  try {
    const existing = await client.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (existing.rows.length > 0) {
      return { conversationId, success: true, message: 'User already a participant' };
    }

    const convInfo = await client.query(
      `SELECT type, created_by FROM conversations WHERE id = $1`,
      [conversationId]
    );

    if (convInfo.rows.length === 0) {
      return { conversationId, success: false, error: 'Conversation not found' };
    }

    const conv = convInfo.rows[0];
    const role = conv.created_by === userId ? 'admin' : 'member';

    await client.query(
      `INSERT INTO conversation_participants 
       (conversation_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, NOW())`,
      [conversationId, userId, role]
    );

    return { conversationId, success: true, message: 'Added as participant', role };
  } catch (error) {
    console.error('Error fixing conversation:', error);
    return { conversationId, success: false, error: String(error) };
  } finally {
    client.release();
  }
}