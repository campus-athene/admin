import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { getServerSession } from "next-auth";
import { join } from "path/posix";
import { createClient } from "webdav";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

if (!process.env.STORAGE_URL) throw new Error("STORAGE_URL was not specified.");

const webdav = createClient(process.env.STORAGE_URL, {
  maxBodyLength: 1024 * 1024 * 10,
  username: process.env.STORAGE_USERNAME,
  password: process.env.STORAGE_PASSWORD,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.token.sub) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  if (!req.headers["content-type"]) {
    res.status(400).end(); // 400 Bad Request
    return;
  }

  const id = randomBytes(8).toString("hex");

  if (!(await webdav.putFileContents(join("/image-upload", id), req)))
    throw new Error("putFileContents returned false.");

  await prisma.image.create({
    data: {
      id,
      mimeType: req.headers["content-type"],
      ownerId: Number.parseInt(session?.token.sub),
    },
  });

  res.status(200).json({ id });
};

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

export default handler;
