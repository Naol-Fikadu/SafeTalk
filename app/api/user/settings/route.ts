import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Single query to get all user data (profile, settings, privacy, notifications)
    const result = await pool.query(
      `SELECT 
        u.username, u.full_name, u.email, u.bio, u.avatar_url, u.cover_url,
        u.website, u.location, u.date_of_birth, u.phone_number, u.is_verified, u.is_private,
        u.two_factor_enabled, u.language, u.theme, u.last_login, u.created_at,
        COALESCE(us.email_notifications, true) as email_notifications,
        COALESCE(us.push_notifications, true) as push_notifications,
        COALESCE(us.weekly_digest, true) as weekly_digest,
        COALESCE(us.show_activity, true) as show_activity,
        COALESCE(us.show_followers, true) as show_followers,
        COALESCE(us.allow_tagging, true) as allow_tagging,
        COALESCE(us.allow_messaging, 'everyone') as allow_messaging,
        COALESCE(us.content_visibility, 'public') as content_visibility
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Get sessions, blocked users, and verification status in separate queries (they are fast)
    const [sessionsRes, blockedRes, verificationRes] = await Promise.all([
      pool.query(
        `SELECT id, device_info, ip_address, last_activity, created_at, expires_at
         FROM sessions WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_activity DESC`,
        [userId]
      ),
      pool.query(
        `SELECT u.id, u.username, u.full_name, u.avatar_url, b.created_at
         FROM blocks b JOIN users u ON b.blocked_user_id = u.id
         WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
        [userId]
      ),
      pool.query(
        `SELECT status, created_at FROM verification_requests 
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
    ]);

    return NextResponse.json({
      account: {
        fullName: row.full_name || '',
        username: row.username,
        email: row.email,
        phone: row.phone_number || '',
        bio: row.bio || '',
        dob: row.date_of_birth || '',
        website: row.website || '',
        location: row.location || '',
        avatarUrl: row.avatar_url,
        coverUrl: row.cover_url,
        isVerified: row.is_verified,
        isPrivate: row.is_private,
        twoFactorEnabled: row.two_factor_enabled,
        language: row.language || 'en',
        theme: row.theme || 'light',
        lastLogin: row.last_login,
        createdAt: row.created_at
      },
      privacy: {
        profileVisibility: row.is_private ? 'private' : 'public',
        postVisibility: row.content_visibility,
        messagePermission: row.allow_messaging,
        tagPermission: row.allow_tagging ? 'everyone' : 'friends',
        showOnlineStatus: row.show_activity,
        showFollowers: row.show_followers,
        searchEngineIndexing: !row.is_private
      },
      notifications: {
        push: {
          likes: row.push_notifications,
          comments: row.push_notifications,
          follows: row.push_notifications,
          messages: row.push_notifications,
          mentions: row.push_notifications
        },
        email: {
          marketing: false,
          security: row.email_notifications,
          digest: row.weekly_digest,
          mentions: row.email_notifications
        }
      },
      sessions: sessionsRes.rows,
      blockedUsers: blockedRes.rows,
      verificationStatus: verificationRes.rows[0]?.status || null,
      appearance: {
        theme: row.theme || 'system',
        language: row.language || 'en'
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { section, data } = body;

    try {
      switch (section) {
        case 'profile':
          await pool.query(
            `UPDATE users 
             SET full_name = $1, bio = $2, website = $3, location = $4, phone_number = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6`,
            [data.fullName, data.bio, data.website, data.location, data.phone, userId]
          );
          break;

        case 'account':
          await pool.query(
            `UPDATE users 
             SET username = $1, date_of_birth = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [data.username, data.dob, userId]
          );
          break;

        case 'privacy':
          await pool.query(
            `UPDATE users SET is_private = $1 WHERE id = $2`,
            [data.profileVisibility === 'private', userId]
          );
          
          // Check if user_settings exists
          const existingSettings = await pool.query(
            `SELECT * FROM user_settings WHERE user_id = $1`,
            [userId]
          );
          
          if (existingSettings.rows.length > 0) {
            await pool.query(
              `UPDATE user_settings 
               SET content_visibility = $1, allow_messaging = $2, allow_tagging = $3, 
                   show_activity = $4, show_followers = $5
               WHERE user_id = $6`,
              [data.postVisibility, data.messagePermission, data.tagPermission === 'everyone', 
               data.showOnlineStatus, data.showFollowers, userId]
            );
          } else {
            await pool.query(
              `INSERT INTO user_settings (user_id, content_visibility, allow_messaging, 
                allow_tagging, show_activity, show_followers)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [userId, data.postVisibility, data.messagePermission, data.tagPermission === 'everyone',
               data.showOnlineStatus, data.showFollowers]
            );
          }
          break;

        case 'notifications':
          await pool.query(
            `UPDATE user_settings 
             SET push_notifications = $1, email_notifications = $2, weekly_digest = $3
             WHERE user_id = $4`,
            [data.pushEnabled, data.emailEnabled, data.digestEnabled, userId]
          );
          break;

        case 'appearance':
          await pool.query(
            `UPDATE users SET theme = $1, language = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [data.theme, data.language, userId]
          );
          break;

        case 'password':
          // Password change would be handled with bcrypt
          await pool.query(
            `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [data.passwordHash, userId]
          );
          break;

        default:
          return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: `${section} updated successfully` });
    } catch (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}