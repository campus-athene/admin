import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

export type Body = {
  name: string;
  description: string;
  logoImg: string;
  coverImg: string | null;
  socialWebsite: string;
  socialEmail: string;
  socialPhone: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialTiktok: string | null;
  socialYoutube: string | null;
  socialTelegram: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<never>
) {
  if (req.method !== "POST") {
    res.status(405).end(); // 405 Method Not Allowed
    return;
  }

  const session = await unstable_getServerSession(req, res, authOptions);

  const userId = Number.parseInt(session?.token.sub || "");

  if (!userId) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  const body = req.body as Body;

  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      adminsEventOrganiser: {
        update: {
          name: body.name,
          description: body.description,
          logoImg: body.logoImg,
          coverImg: body.coverImg,
          socialWebsite: body.socialWebsite,
          socialEmail: body.socialEmail,
          socialPhone: body.socialPhone,
          socialFacebook: body.socialFacebook,
          socialInstagram: body.socialInstagram,
          socialTwitter: body.socialTwitter,
          socialLinkedin: body.socialLinkedin,
          socialTiktok: body.socialTiktok,
          socialYoutube: body.socialYoutube,
          socialTelegram: body.socialTelegram,
        },
      },
    },
  });

  res.status(204).end(); // 204 No Content
}
