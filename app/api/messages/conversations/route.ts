import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await messageQueries.getUserConversations(session.user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, participantIds, name, avatarUrl } = await req.json();

    // Validate input
    if (!type || !['direct', 'group'].includes(type)) {
      return NextResponse.json({ error: 'Invalid conversation type' }, { status: 400 });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json({ error: 'Participant IDs required' }, { status: 400 });
    }

    if (type === 'group' && participantIds.length < 2) {
      return NextResponse.json({ error: 'Group requires at least 2 participants' }, { status: 400 });
    }

    if (type === 'direct' && participantIds.length !== 1) {
      return NextResponse.json({ error: 'Direct message requires exactly 1 participant' }, { status: 400 });
    }

    // Create conversation
    const conversation = await messageQueries.createConversation(
      type,
      participantIds,
      session.user.id,
      name,
      avatarUrl
    );

    if (!conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}