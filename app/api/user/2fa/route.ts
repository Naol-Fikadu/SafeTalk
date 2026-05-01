import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import { pool } from '@/lib/db';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const userResult = await pool.query(
      'SELECT id, two_factor_enabled, two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    if (!user.two_factor_enabled && !user.two_factor_secret) {
      // Generate new secret
      const secret = speakeasy.generateSecret({
        name: `SocialMedia:${session.user.email}`
      });

      // Save secret to database
      await pool.query(
        'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
        [secret.base32, userId]
      );

      // Generate QR code if otpauth_url exists
      let qrCodeUrl = null;
      if (secret.otpauth_url) {
        qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      }

      return NextResponse.json({
        enabled: false,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualKey: secret.base32.match(/.{1,4}/g)?.join(' ') || secret.base32
      });
    }

    return NextResponse.json({
      enabled: user.two_factor_enabled,
      secret: user.two_factor_secret
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { enable, token } = await request.json();

    const userResult = await pool.query(
      'SELECT id, two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    const user = userResult.rows[0];

    if (enable) {
      if (!user.two_factor_secret) {
        return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token
      });

      if (!verified) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Enable 2FA
      await pool.query(
        'UPDATE users SET two_factor_enabled = true WHERE id = $1',
        [userId]
      );

      return NextResponse.json({ success: true, message: '2FA enabled successfully' });
    } else {
      // Disable 2FA
      await pool.query(
        'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
        [userId]
      );

      return NextResponse.json({ success: true, message: '2FA disabled successfully' });
    }
  } catch (error) {
    console.error('Error updating 2FA:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}