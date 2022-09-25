import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import Head from "next/head";
import { Card, CardGroup, Container } from "react-bootstrap";
import { authOptions } from "./api/auth/[...nextauth]";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session)
    return {
      redirect: {
        destination: `/api/auth/signin?callbackUrl=${encodeURIComponent(
          context.resolvedUrl
        )}`,
        permanent: false,
      },
    };

  return { props: {} };
};

const Home: NextPage = () => {
  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Campus Administrations-Portal</title>
      </Head>

      <h1>Campus Administrations-Portal</h1>

      <CardGroup>
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
            <Card.Link href="/profile">Veranstalterprofil bearbeiten</Card.Link>
          </Card.Body>
        </Card>
      </CardGroup>
    </Container>
  );
};

export default Home;
