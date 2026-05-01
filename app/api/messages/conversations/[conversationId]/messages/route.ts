import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';
import { pusherServer } from '@/lib/pusher';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before') || undefined;

    const messages = await messageQueries.getMessages(
      params.conversationId,
      session.user.id,
      limit,
      before
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, messageType, mediaUrl, fileName, fileSize, mimeType, metadata, replyToId } = await req.json();

    if (!content && !mediaUrl) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    const message = await messageQueries.sendMessage(
      params.conversationId,
      session.user.id,
      content,
      messageType || 'text',
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      metadata,
      replyToId
    );

    if (!message) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Trigger real-time events if Pusher is available
    if (pusherServer) {
      try {
        await pusherServer.trigger(
          `conversation-${params.conversationId}`,
          'new-message',
          message
        );

        // Notify other participants
        const conversation = await messageQueries.getConversationWithDetails(params.conversationId);
        if (conversation) {
          for (const participant of conversation.participants) {
            if (participant.user_id !== session.user.id) {
              await pusherServer.trigger(
                `user-${participant.user_id}`,
                'new-conversation-message',
                {
                  conversationId: params.conversationId,
                  message,
                }
              );
            }
          }
        }
      } catch (pusherError) {
        console.error('Pusher error (non-critical):', pusherError);
        // Don't fail the request if Pusher fails
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}