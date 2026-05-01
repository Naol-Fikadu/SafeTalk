import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';
import { pusherServer } from '@/lib/pusher';
import { pool } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await messageQueries.deleteMessage(params.messageId, session.user.id);

    if (deleted && pusherServer) {
      try {
        // Get message details for real-time notification
        const messageResult = await pool.query(
          `SELECT conversation_id FROM messages WHERE id = $1`,
          [params.messageId]
        );

        if (messageResult.rows.length > 0) {
          await pusherServer.trigger(
            `conversation-${messageResult.rows[0].conversation_id}`,
            'message-deleted',
            { messageId: params.messageId }
          );
        }
      } catch (pusherError) {
        console.error('Pusher error (non-critical):', pusherError);
      }
    }

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    const message = await messageQueries.editMessage(params.messageId, session.user.id, content);

    if (message && pusherServer) {
      try {
        // Get message details for real-time notification
        const messageResult = await pool.query(
          `SELECT conversation_id FROM messages WHERE id = $1`,
          [params.messageId]
        );

        if (messageResult.rows.length > 0) {
          await pusherServer.trigger(
            `conversation-${messageResult.rows[0].conversation_id}`,
            'message-edited',
            { messageId: params.messageId, content }
          );
        }
      } catch (pusherError) {
        console.error('Pusher error (non-critical):', pusherError);
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error editing message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}