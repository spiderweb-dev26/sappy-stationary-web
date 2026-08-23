import { getServerSession } from "next-auth/next";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./core";

if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  } else {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        db.ensureSchema();
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const user = db.users.find((u) => u.email.toLowerCase() === email);

        if (!user) {
          return null; // Reject unknown users
        }

        // Verify password
        if (user.password && user.password !== credentials.password) {
          return null; // Reject incorrect passwords
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || "ADMIN",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || "ADMIN";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days session
  },
  secret: process.env.NEXTAUTH_SECRET || "sappy-stationary-super-secret-key-2026",
  pages: {
    signIn: "/login",
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}