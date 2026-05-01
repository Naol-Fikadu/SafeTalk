import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

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

    // If specific conversation ID provided, fix just that one
    if (conversationId) {
      const fixResult = await fixConversationParticipants(conversationId, session.user.id);
      if (fixResult.success) {
        results.fixed.push(fixResult);
      } else {
        results.errors.push(fixResult);
      }
    } else {
      // Fix all conversations missing current user
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
  const client = await pool.connect();
  try {
    // Check if user is already a participant
    const existing = await client.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (existing.rows.length > 0) {
      return { 
        conversationId, 
        success: true, 
        message: 'User already a participant' 
      };
    }

    // Get conversation details to determine role
    const convInfo = await client.query(
      `SELECT type, created_by FROM conversations WHERE id = $1`,
      [conversationId]
    );

    if (convInfo.rows.length === 0) {
      return { 
        conversationId, 
        success: false, 
        error: 'Conversation not found' 
      };
    }

    const conv = convInfo.rows[0];
    const role = conv.created_by === userId ? 'admin' : 'member';

    // Add user as participant
    await client.query(
      `INSERT INTO conversation_participants 
       (conversation_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, NOW())`,
      [conversationId, userId, role]
    );

    return { 
      conversationId, 
      success: true, 
      message: 'Added as participant',
      role 
    };
  } catch (error) {
    console.error('Error fixing conversation:', error);
    return { 
      conversationId, 
      success: false, 
      error: String(error) 
    };
  } finally {
    client.release();
  }
}