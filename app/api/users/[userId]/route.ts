import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const targetUserId = params.userId;

    if (!session || session.user.id !== targetUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bio, location, website, full_name } = await req.json();

    // Update the database
    const result = await pool.query(
      `UPDATE users 
       SET bio = $1, location = $2, website = $3, full_name = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [bio, location, website, full_name, targetUserId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
