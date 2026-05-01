import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    is_admin?: boolean;
    avatar_url?: string | null;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      name?: string;
      is_admin?: boolean;
      avatar_url?: string | null;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    is_admin?: boolean;
    avatar_url?: string | null;
  }
}