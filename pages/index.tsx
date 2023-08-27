import { PrismaClient } from "@prisma/client";
import type { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import Link from "next/link";
import { Alert, Card, CardGroup, Container } from "react-bootstrap";
import { authOptions } from "./api/auth/[...nextauth]";

const prisma = new PrismaClient();

type Data = {
  isGlobalAdmin: boolean;
  eventOrganizer: string | null;
  isInfoScreenEditor: boolean;
  needsPasswordChange: boolean;
};

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  const adminUser =
    session?.token.sub &&
    (await prisma.adminUser.findUnique({
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
        lastPasswordChange: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    }));

  if (!adminUser)
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          context.resolvedUrl,
        )}`,
        permanent: false,
      },
    };

  return {
    props: {
      isGlobalAdmin: adminUser.isGlobalAdmin,
      eventOrganizer: adminUser.adminsEventOrganizer
        ? adminUser.adminsEventOrganizer.name
        : null,
      isInfoScreenEditor: adminUser.roles.some((r) =>
        ["INFO_SCREEN_EDITOR", "GLOBAL_ADMIN"].includes(r.role),
      ),
      needsPasswordChange: !adminUser.lastPasswordChange,
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

      {props.needsPasswordChange && (
        <Alert variant="warning">
          <Alert.Heading>Passwort ändern</Alert.Heading>
          <p>
            Bitte ändere Dein Passwort. Das Standardpasswort ist nicht sicher.
            Du kannst es in den <Link href="/settings">Einstellungen</Link>{" "}
            ändern.
          </p>
        </Alert>
      )}

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

      {props.isInfoScreenEditor && (
        <>
          <h3>Info-Screens</h3>
          <CardGroup className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Info-Screens &rarr;</Card.Title>
                <Card.Link href="/infoscreen">
                  Info-Screens einsehen, erstellen und bearbeiten.
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
