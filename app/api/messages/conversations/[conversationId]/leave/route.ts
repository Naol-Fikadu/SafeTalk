import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { messageQueries } from '@/lib/db/messages';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const left = await messageQueries.leaveGroup(params.conversationId, session.user.id);

    if (!left) {
      return NextResponse.json({ error: 'Failed to leave group' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}