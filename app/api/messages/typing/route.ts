import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, isTyping } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Only trigger if Pusher is available
    if (pusherServer) {
      try {
        await pusherServer.trigger(
          `conversation-${conversationId}`,
          'typing-indicator',
          {
            userId: session.user.id,
            isTyping,
          }
        );
      } catch (pusherError) {
        console.error('Pusher error (non-critical):', pusherError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}