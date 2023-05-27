import { NextApiHandler } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions, generateSalt, hashPassword } from "./auth/[...nextauth]";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const handler: NextApiHandler = async (req, res) => {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const userId = Number.parseInt(session.token.sub || "");
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  if (oldPassword === newPassword) {
    res.status(400).json({ error: "New password must be different" });
    return;
  }

  if (newPassword.length < 8) {
    res
      .status(400)
      .json({ error: "New password must be at least 8 characters" });
    return;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
  });

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const passwordCorrect = (await hashPassword(oldPassword, user.salt)).equals(
    user.password
  );

  if (!passwordCorrect) {
    res.status(400).json({ error: "Old password incorrect" });
    return;
  }

  const salt = generateSalt();
  const newPasswordHash = await hashPassword(newPassword, salt);

  await prisma.adminUser.update({
    where: { id: userId },
    data: { password: newPasswordHash, salt, lastPasswordChange: new Date() },
  });

  res.status(200).json({ success: true });
};

export default handler;
