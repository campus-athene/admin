import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<never>
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  const organiser = Number.parseInt(session?.token.sub || "");

  if (!organiser) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  const body = req.body as { [key: string]: string };

  switch (req.method) {
    case "PUT":
      await prisma.event.create({
        data: {
          organiser,
          title: body.title,
          description: body.description,
          date: new Date(body.date),
          registrationDeadline:
            body.registrationDeadline && new Date(body.registrationDeadline),
          image: body.image,
        },
      });

      break;

    case "POST":
      const idPost = Number.parseInt(body.id);
      if (!idPost) {
        res.status(404).end(); // 404 Not Found
        return;
      }
      const { count } = await prisma.event.updateMany({
        where: { id: idPost, organiser },
        data: {
          title: body.title,
          description: body.description,
          date: new Date(body.date),
          registrationDeadline:
            body.registrationDeadline && new Date(body.registrationDeadline),
          image: body.image,
        },
      });

      if (count !== 1) {
        // Strictly speaking it could also have been forbidden to update due to the request coming from the wrong organiser.
        res.status(404).end(); // 404 Not Found
        return;
      }

      break;

    case "DELETE":
      const idDelete = Number.parseInt(body.id);
      if (!idDelete) {
        res.status(404).end(); // 404 Not Found
        return;
      }
      await prisma.event.deleteMany({
        where: { id: idDelete, organiser },
      });

      break;

    default: // 405 Method Not Allowed
      res.status(405).end();
      return;
  }

  res.status(204).end(); // 204 No Content
}
