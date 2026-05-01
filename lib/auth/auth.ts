import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db } from '@/lib/db/queries';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          // Find user by email
          const user = await db.users.findByEmail(credentials.email);
          
          if (!user || !user.password_hash) {
            throw new Error('Invalid email or password');
          }

          // Compare passwords
          const isValid = await compare(credentials.password, user.password_hash);
          
          if (!isValid) {
            throw new Error('Invalid email or password');
          }

          // Return user object with admin status and avatar
          return {
            id: user.id,
            email: user.email,
            name: user.full_name || user.username,
            username: user.username,
            avatar_url: user.avatar_url,
            is_admin: user.is_admin || false,
          };
        } catch (error) {
          console.error('Authorize error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.avatar_url = (user as any).avatar_url;
        token.is_admin = (user as any).is_admin;
      }
      
      // Handle manual session update
      if (trigger === "update" && session?.avatar_url) {
        token.avatar_url = session.avatar_url;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.avatar_url = token.avatar_url as string;
        session.user.is_admin = token.is_admin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};