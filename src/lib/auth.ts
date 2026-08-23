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
  withFirestoreTimeout,
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

        // 1. MASTER PASSCODE OVERRIDE
        // Allows the shop owner to log in immediately using the Master Passcode
        if (
          (typeof db.verifyMasterPassword === "function" && db.verifyMasterPassword(inputPassword)) ||
          inputPassword === "sappy2026"
        ) {
          const adminUser = {
            id: `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "")}`,
            name: cleanEmail.split("@")[0] || "Amanueal Getahun",
            email: cleanEmail,
            role: "ADMIN",
          };

          if (Array.isArray(db.users) && !db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
            db.users.push({
              id: adminUser.id,
              name: adminUser.name,
              email: adminUser.email,
              password: inputPassword,
              role: "ADMIN",
              createdAt: new Date(),
            });
          }

          return adminUser;
        }

        // 2. Live Firestore Authentication
        if (isFirebaseConfigured && firestore) {
          try {
            const q = query(
              collection(firestore, "users"),
              where("email", "==", cleanEmail)
            );
            const querySnap = await withFirestoreTimeout(getDocs(q), 2500);

            if (!querySnap.empty) {
              const userDoc = querySnap.docs[0].data() as User;

              if (userDoc.password && userDoc.password === inputPassword) {
                return {
                  id: userDoc.id,
                  name: userDoc.name,
                  email: userDoc.email,
                  role: userDoc.role || "ADMIN",
                };
              }
              return null;
            }
          } catch (err) {
            console.warn("Firestore auth query error:", err);
          }
        }

        // 3. Memory Store Fallback
        if (typeof db.ensureSchema === "function") {
          db.ensureSchema();
        }
        const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (user && user.password && user.password === inputPassword) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || "ADMIN",
          };
        }

        return null;
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
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "sappy-stationary-super-secret-key-2026",
  pages: {
    signIn: "/login",
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}