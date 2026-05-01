import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

// GET /api/admin/settings – returns site settings + current user's personal settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Site settings
    const siteRes = await pool.query('SELECT key, value FROM site_settings');
    const siteSettings: Record<string, string> = {};
    siteRes.rows.forEach((row: any) => {
      siteSettings[row.key] = row.value;
    });

    // Personal settings (from user_settings table)
    const userSettingsRes = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [session.user.id]
    );
    const personal = userSettingsRes.rows[0] || {
      email_notifications: true,
      push_notifications: true,
      weekly_digest: true,
      theme: 'system',
    };

    return NextResponse.json({ siteSettings, personal });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/settings – updates either site settings or personal settings based on "type"
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, data } = body; // type: 'site' or 'personal'

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }

    if (type === 'site') {
      // Update each key/value in site_settings
      const entries = Object.entries(data) as [string, string][];
      for (const [key, value] of entries) {
        await pool.query(
          `INSERT INTO site_settings (key, value, updated_at) 
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, value]
        );
      }
    } else if (type === 'personal') {
      // Update user_settings for current admin
      await pool.query(
        `INSERT INTO user_settings (user_id, ${Object.keys(data).join(', ')})
         VALUES ($1, ${Object.keys(data).map((_, i) => `$${i + 2}`).join(', ')})
         ON CONFLICT (user_id) DO UPDATE SET ${Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(', ')}`,
        [session.user.id, ...Object.values(data)]
      );
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}