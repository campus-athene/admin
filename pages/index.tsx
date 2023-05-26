import { PrismaClient } from "@prisma/client";
import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import Head from "next/head";
import { Card, CardGroup, Container } from "react-bootstrap";
import { authOptions } from "./api/auth/[...nextauth]";

const prisma = new PrismaClient();

type Data = {
  isGlobalAdmin: boolean;
  eventOrganizer: string | null;
};

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session?.token.sub)
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          context.resolvedUrl
        )}`,
        permanent: false,
      },
    };

  const adminUser = await prisma.adminUser.findUnique({
    where: {
      id: Number.parseInt(session.token.sub),
    },
    select: {
      isGlobalAdmin: true,
      adminsEventOrganizer: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!adminUser?.isGlobalAdmin)
    return {
      redirect: {
        destination: "/event",
        permanent: true,
      },
    };

  return {
    props: {
      isGlobalAdmin: true,
      eventOrganizer: adminUser.adminsEventOrganizer
        ? adminUser.adminsEventOrganizer.name
        : null,
    },
  };
};

const Home: NextPage<Data> = (props) => {
  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Campus Administrations-Portal</title>
      </Head>

      <h1 className="mb-4">Campus Administrations-Portal</h1>

      {typeof props.eventOrganizer === "string" && (
        <>
          <h3>Campus Events</h3>
          <h4>{props.eventOrganizer}</h4>
          <CardGroup className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Veranstaltungen &rarr;</Card.Title>
                <Card.Link href="/event">
                  Veranstaltungen einsehen, erstellen und bearbeiten.
                </Card.Link>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <Card.Title>Veranstalterprofil &rarr;</Card.Title>
                <Card.Link href="/profile">
                  Veranstalterprofil bearbeiten
                </Card.Link>
              </Card.Body>
            </Card>
          </CardGroup>
        </>
      )}

      {props.isGlobalAdmin && (
        <>
          <h3>Administration</h3>
          <CardGroup className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Veranstalter auswählen &rarr;</Card.Title>
                <Card.Link href="/event/selectOrganizer">
                  Veranstalter auswählen, für den Veranstaltungen bearbeitet
                  werden.
                </Card.Link>
              </Card.Body>
            </Card>
          </CardGroup>
        </>
      )}
    </Container>
  );
};

export default Home;
