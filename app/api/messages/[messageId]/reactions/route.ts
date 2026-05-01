import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';
import { pusherServer } from '@/lib/pusher';
import { pool } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reaction } = await req.json();

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction required' }, { status: 400 });
    }

    // Add reaction
    await messageQueries.addReaction(params.messageId, session.user.id, reaction);

    // Trigger real-time event if Pusher is available
    if (pusherServer) {
      try {
        // Get conversation ID for real-time notification
        const messageResult = await pool.query(
          `SELECT conversation_id FROM messages WHERE id = $1`,
          [params.messageId]
        );

        if (messageResult.rows.length > 0) {
          // Get user details for the reaction
          const userResult = await pool.query(
            `SELECT username, avatar_url FROM users WHERE id = $1`,
            [session.user.id]
          );

          await pusherServer.trigger(
            `conversation-${messageResult.rows[0].conversation_id}`,
            'message-reaction',
            {
              messageId: params.messageId,
              reaction: {
                user_id: session.user.id,
                reaction,
                created_at: new Date().toISOString(),
                user: userResult.rows[0],
              },
            }
          );
        }
      } catch (pusherError) {
        console.error('Pusher error (non-critical):', pusherError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reaction } = await req.json();

    if (!reaction) {
      return NextResponse.json({ error: 'Reaction required' }, { status: 400 });
    }

    await messageQueries.removeReaction(params.messageId, session.user.id, reaction);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}