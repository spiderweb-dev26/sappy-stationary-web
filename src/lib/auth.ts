import { getServerSession } from "next-auth/next";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./core";
import {
  firestore,
  isFirebaseConfigured,
  collection,
  getDocs,
  query,
  where,
} from "./firebase";
import { User } from "./types";

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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const cleanEmail = credentials.email.toLowerCase().trim();
        const inputPassword = credentials.password.trim();

        // 1. Direct Real-Time Firestore Authentication
        if (isFirebaseConfigured && firestore) {
          try {
            const q = query(
              collection(firestore, "users"),
              where("email", "==", cleanEmail)
            );
            const querySnap = await getDocs(q);

            if (querySnap.empty) {
              // User NOT registered in Firestore - REJECT
              return null;
            }

            const userDoc = querySnap.docs[0].data() as User;

            // Strict password check
            if (!userDoc.password || userDoc.password !== inputPassword) {
              // Incorrect password - REJECT
              return null;
            }

            return {
              id: userDoc.id,
              name: userDoc.name,
              email: userDoc.email,
              role: userDoc.role || "ADMIN",
            };
          } catch (err) {
            console.error("Firestore auth query error:", err);
          }
        }

        // 2. Memory Store Fallback Authentication
        db.ensureSchema();
        const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (!user) {
          // User NOT found - REJECT
          return null;
        }

        // Strict password check
        if (!user.password || user.password !== inputPassword) {
          // Incorrect password - REJECT
          return null;
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || "sappy-stationary-super-secret-key-2026",
  pages: {
    signIn: "/login",
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}