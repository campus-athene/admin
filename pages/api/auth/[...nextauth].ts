import { PrismaClient } from "@prisma/client";
import { pbkdf2, randomBytes } from "crypto";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const prisma = new PrismaClient();

export const generateSalt = () => randomBytes(64);

export const hashPassword = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) =>
      err ? reject(err) : resolve(derivedKey),
    ),
  );

export const authOptions: NextAuthOptions = {
  secret: process.env.SECRET,
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: { label: "E-Mail-Adresse", type: "text" },
        password: { label: "Kennwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user) return null;

        const hash = await hashPassword(credentials.password, user.salt);
        if (!hash.equals(user.password)) return null;

        // Await call to make sure the operation will not be cancelled.
        await prisma.adminUser.update({
          data: { lastLogin: new Date() },
          where: { id: user.id },
        });

        return {
          id: user.id.toString(),
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      token,
    }),
  },
};

export default NextAuth(authOptions);
