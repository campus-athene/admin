import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

type RequestEventData = {
  title: string;
  description: string;
  date: string;
  online: boolean;
  eventType: string;
  venue: string | null;
  participationLink: string | null;
  registrationDeadline: string | null;
  registrationLink: string | null;
  // price: string;
  image: string;
};

export type RequestBody =
  // PUT
  | RequestEventData
  // POST
  | ({ id: number } & RequestEventData)
  // DELETE
  | { id: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<void>
) {
  const session = await unstable_getServerSession(req, res, authOptions);

  const organiser = Number.parseInt(session?.token.sub || "");

  if (!organiser) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  const body = req.body as RequestBody;

  switch (req.method) {
    case "PUT":
      if ("id" in body)
        throw new Error("PUT request body must not contain id.");
      await prisma.event.create({
        data: {
          organiser,
          title: body.title,
          description: body.description,
          date: new Date(body.date),
          online: body.online,
          eventType: body.eventType,
          venue: body.venue,
          registrationDeadline:
            body.registrationDeadline && new Date(body.registrationDeadline),
          registrationLink: body.registrationLink,
          image: body.image,
        },
      });

      break;

    case "POST":
      if (!("id" in body && "title" in body))
        throw new Error("POST request body must contain id and title.");

      const idPost = body.id;
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
          online: body.online,
          eventType: body.eventType,
          venue: body.venue,
          registrationDeadline:
            body.registrationDeadline && new Date(body.registrationDeadline),
          registrationLink: body.registrationLink,
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
      if (!("id" in body))
        throw new Error("DELETE request body must contain id.");
      const idDelete = body.id;
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
