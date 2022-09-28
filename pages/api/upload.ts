import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import { writeFile } from "fs/promises";
import { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { unstable_getServerSession } from "next-auth";
import { join } from "path";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await unstable_getServerSession(req, res, authOptions);

  if (!session?.token.sub) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  if (!req.headers["content-type"]) {
    res.status(400).end(); // 400 Bad Request
    return;
  }

  const id = randomBytes(8).toString("hex");

  await writeFile(join(process.env.IMAGE_DIR || "/vol/img", id), req);

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
