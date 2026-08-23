import { getServerSession } from "next-auth/next";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./core";

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
        if (!credentials?.email) return null;
        
        // Simple demo credentials check
        const email = credentials.email.toLowerCase().trim();
        const user = db.users.find((u) => u.email.toLowerCase() === email);
        if (user) {
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        }
        
        // Auto-register for cashier demo
        return {
          id: "usr-demo",
          name: credentials.email.split("@")[0] || "Cashier",
          email: credentials.email,
          role: "CASHIER",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CASHIER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "sappy-stationary-super-secret-key-2026",
  pages: {
    signIn: "/login",
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}
