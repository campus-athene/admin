import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { unstable_getServerSession } from "next-auth";
import { join } from "path";
import { createClient } from "webdav";
import { authOptions } from "../auth/[...nextauth]";

const prisma = new PrismaClient();

if (!process.env.STORAGE_URL) throw new Error("STORAGE_URL was not specified.");

const webdav = createClient(process.env.STORAGE_URL, {
  maxBodyLength: 1024 * 1024 * 10,
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session?.token.sub) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400).end(); // 400 Bad Request
    return;
  }

  const metaData = await prisma.image.findUnique({
    select: { mimeType: true, ownerId: true },
    where: { id },
  });

  if (!metaData || metaData.ownerId !== Number.parseInt(session.token.sub)) {
    res.status(404).end(); // 404 Not Found
    return;
  }

  const stream = webdav.createReadStream(join("/image-upload", id));

  res.status(200);
  res.setHeader("Content-Type", metaData.mimeType);

  stream.pipe(res);
};

export const config: PageConfig = {
  api: {
    responseLimit: false,
  },
};

export default handler;
