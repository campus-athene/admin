import { PrismaClient } from "@prisma/client";
import { utc } from "moment";
import "moment/locale/de";
import { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button, Container, Modal, Table } from "react-bootstrap";
import { authOptions } from "../api/auth/[...nextauth]";

const fieldSelector = {
  id: true,
  title: true,
  date: true,
  registrationDeadline: true,
};
type EventData = {
  id: number;
  title: string;
  date: string;
  registrationDeadline: number | null;
};
type Data = {
  events: EventData[];
  eventLimit: {
    count: number;
    limit: number;
  };
};

const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  const userId = Number.parseInt(session?.token.sub || "");

  if (!userId)
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          context.resolvedUrl
        )}`,
        permanent: false,
      },
    };

  const [events, { eventLimit }] = await Promise.all([
    prisma.event.findMany({
      select: fieldSelector,
      orderBy: {
        date: "desc",
      },
      where: {
        organiser: userId,
      },
    }),
    prisma.eventOrganiser.findUniqueOrThrow({
      select: { eventLimit: true },
      where: { id: userId },
    }),
  ]);

  return {
    props: {
      events: events.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        registrationDeadline:
          e.registrationDeadline?.getUTCMilliseconds() || null,
      })),
      eventLimit: {
        count: events.filter((e) => e.date >= new Date()).length,
        limit: eventLimit,
      },
    },
  };
};

const EventPage: NextPage<Data> = (data) => {
  const router = useRouter();

  const [deleteEvent, setDeleteEvent] = useState<EventData | null>(null);

  const onDeleteEvent = async () => {
    if (!deleteEvent) return;
    await fetch("/api/event", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: deleteEvent.id }),
    });

    router.replace(router.asPath);
    setDeleteEvent(null);
  };

  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Veranstaltungen</title>
      </Head>

      <h1>Veranstaltungen</h1>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Datum</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.events.map((e) => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>{utc(e.date).local().locale("de").format("llll")}</td>
              <td>
                <a href={`/event/${e.id}`}>Bearbeiten</a>
              </td>
              <td>
                <a
                  href="#"
                  onClick={(arg) => {
                    arg.preventDefault();
                    setDeleteEvent(e);
                  }}
                >
                  Löschen
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p>
        {data.eventLimit.count} / {data.eventLimit.limit} Veranstaltungen
      </p>
      <Button as="a" href="/event/create">
        Neue Veranstaltung erstellen
      </Button>
      {deleteEvent && (
        <Modal show={true}>
          <Modal.Header>Veranstaltung löschen</Modal.Header>
          <Modal.Body>
            Veranstaltung &ldquo;{deleteEvent.title}&rdquo; wirklich löschen?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setDeleteEvent(null)}>
              Abbrechen
            </Button>
            <Button variant="danger" onClick={onDeleteEvent}>
              Löschen
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default EventPage;
