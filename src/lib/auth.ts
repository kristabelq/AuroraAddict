import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import InstagramProvider from "next-auth/providers/instagram";
import { prisma } from "./prisma";
import { generateUsername } from "./username";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user?.id) {
        session.user.id = user.id;
        // Add onboarding status to session
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { onboardingComplete: true, username: true, userType: true },
          });
          session.user.onboardingComplete = dbUser?.onboardingComplete || false;
          session.user.userType = dbUser?.userType || "personal";

          // Auto-generate username if it doesn't exist
          if (!dbUser?.username && user.name) {
            const username = await generateUsername(user.name);
            await prisma.user.update({
              where: { id: user.id },
              data: { username },
            });
          }
        } catch (error) {
          console.error("Error in session callback:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "database",
  },
};
