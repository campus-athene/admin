import { Client } from "@googlemaps/google-maps-services-js";
import { PrismaClient } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

if (!process.env.GCP_API_KEY)
  throw new Error("Environment variable GCP_API_KEY has not been defined.");

const prisma = new PrismaClient();

type RequestEventData = {
  title: string;
  description: string;
  date: string;
  online: boolean;
  eventType: string;
  venue: string | null;
  venueAddress: string | null;
  registrationDeadline: string | null;
  registrationLink: string | null;
  price: string | null;
  image: string;
};

export type RequestBody =
  // PUT
  | RequestEventData
  // POST
  | ({ id: number } & RequestEventData)
  // DELETE
  | { id: number };
export type ResponseBody = { id: number } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  const session = await getServerSession(req, res, authOptions);

  const userId = Number.parseInt(session?.token.sub || "");

  if (!userId) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  const organizerId = (
    await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { adminsEventOrganizer: { select: { id: true } } },
    })
  )?.adminsEventOrganizer?.id;

  if (!organizerId) {
    res.status(401).end(); // 401 Unauthorized
    return;
  }

  const body = req.body as RequestBody;
  let id: number;

  let venueData = null;
  if ("venueAddress" in body && body.venueAddress) {
    if (!process.env.GCP_API_KEY)
      throw new Error("Environment variable GCP_API_KEY has not been defined.");

    const geocodeResponse = await new Client({}).geocode({
      params: {
        key: process.env.GCP_API_KEY,
        address: body.venueAddress,
        language: "de",
        region: "de",
      },
    });

    if (geocodeResponse.data.status !== "OK") {
      console.warn(`Geocoding returned ${geocodeResponse.data.status}.`);
      res.status(400).json({ error: "Adresse ungültig." });
      return;
    }

    if (geocodeResponse.data.results.length !== 1)
      console.warn(
        `Geocoding returned ${geocodeResponse.data.results.length} results.'`,
      );

    venueData = JSON.stringify(geocodeResponse.data.results[0]);
  }

  switch (req.method) {
    case "PUT":
      if ("id" in body)
        throw new Error("PUT request body must not contain id.");
      const newEvent = await prisma.event.create({
        data: {
          organizer: organizerId,
          title: body.title,
          description: body.description,
          date: new Date(body.date),
          online: body.online,
          eventType: body.eventType,
          venue: body.venue,
          venueAddress: body.venueAddress,
          venueData,
          registrationDeadline:
            body.registrationDeadline && new Date(body.registrationDeadline),
          registrationLink: body.registrationLink,
          price: body.price,
          image: body.image,
        },
        select: { id: true },
      });

      id = newEvent.id;
      break;

    case "POST":
      if (!("id" in body && "title" in body))
        throw new Error("POST request body must contain id and title.");

      id = body.id;
      if (!id) {
        res.status(404).end(); // 404 Not Found
        return;
      }
      const { count } = await prisma.event.updateMany({
        where: { id, organizer: organizerId },
        data: {
          title: body.title,
          description: body.description,
          date: new Date(body.date),
          online: body.online,
          eventType: body.eventType,
          venue: body.venue,
          venueAddress: body.venueAddress,
          venueData,
          registrationDeadline:
            body.registrationDeadline && new Date(body.registrationDeadline),
          registrationLink: body.registrationLink,
          price: body.price,
          image: body.image,
        },
      });

      if (count !== 1) {
        // Strictly speaking it could also have been forbidden to update due to the request coming from the wrong organizer.
        res.status(404).end(); // 404 Not Found
        return;
      }

      break;

    case "DELETE":
      if (!("id" in body))
        throw new Error("DELETE request body must contain id.");
      id = body.id;
      if (!id) {
        res.status(404).end(); // 404 Not Found
        return;
      }
      await prisma.event.deleteMany({
        where: { id, organizer: organizerId },
      });

      break;

    default: // 405 Method Not Allowed
      res.status(405).end();
      return;
  }

  res.status(200).json({ id }); // 204 OK
}
