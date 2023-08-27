import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

type UndefinedPartial<T> = {
  [P in keyof T]?: undefined;
};
type InfoScreenId = {
  id: number;
};
type InfoScreenValues = {
  comment: string;
  position: number;
  campaignStart: number | null;
  campaignEnd: number | null;
  mediaDe: string | null;
  mediaEn: string | null;
  externalLinkDe: string | null;
  externalLinkEn: string | null;
};

export type RequestBody =
  | (UndefinedPartial<InfoScreenId> & InfoScreenValues)
  | (InfoScreenId & InfoScreenValues)
  | (InfoScreenId & UndefinedPartial<InfoScreenValues>);

export type ResponseBody = { id: number } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = Number.parseInt(session?.token.sub || "");

  const hasAccess =
    userId &&
    (await prisma.adminUserRoles.count({
      where: {
        userId,
        role: { in: ["GLOBAL_ADMIN", "INFO_SCREEN_EDITOR"] },
      },
    })) > 0;

  if (!hasAccess) {
    res
      .status(401) // 401 Unauthorized
      .json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as RequestBody;
  let id: number;

  if (req.method === "PUT") {
    const putBody = body as InfoScreenValues;
    const result = await prisma.infoScreen.create({
      data: {
        comment: putBody.comment,
        position: putBody.position,
        campaignStart: putBody.campaignStart
          ? new Date(putBody.campaignStart)
          : null,
        campaignEnd: putBody.campaignEnd ? new Date(putBody.campaignEnd) : null,
        mediaDeId: putBody.mediaDe,
        mediaEnId: putBody.mediaEn,
        externalLinkDe: putBody.externalLinkDe,
        externalLinkEn: putBody.externalLinkEn,
      },
      select: { id: true },
    });
    id = result.id;
  } else if (req.method === "POST") {
    const postBody = body as InfoScreenId & InfoScreenValues;
    id = postBody.id;
    await prisma.infoScreen.update({
      where: { id },
      data: {
        comment: postBody.comment,
        position: postBody.position,
        campaignStart: postBody.campaignStart
          ? new Date(postBody.campaignStart)
          : null,
        campaignEnd: postBody.campaignEnd
          ? new Date(postBody.campaignEnd)
          : null,
        mediaDeId: postBody.mediaDe,
        mediaEnId: postBody.mediaEn,
        externalLinkDe: postBody.externalLinkDe,
        externalLinkEn: postBody.externalLinkEn,
      },
    });
  } else if (req.method === "DELETE") {
    id = (body as InfoScreenId).id;
    await prisma.infoScreen.delete({ where: { id } });
  } else {
    res.status(405).end(); // 405 Method Not Allowed
    return;
  }

  res.status(200).json({ id });
}
