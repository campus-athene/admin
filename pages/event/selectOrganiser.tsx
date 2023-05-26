import { EventOrganiser, PrismaClient } from "@prisma/client";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { GetServerSideProps, NextPage } from "next";
import { Button, Container, Table } from "react-bootstrap";
import Head from "next/head";

const prisma = new PrismaClient();

type Data = {
  organisers: (Pick<EventOrganiser, "id" | "name"> & { selected: boolean })[];
};

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

  const user = await prisma.adminUser.findUnique({
    where: {
      id: userId,
    },
    select: {
      adminsEventOrganiserId: true,
      isGlobalAdmin: true,
    },
  });

  if (!user?.isGlobalAdmin)
    return {
      notFound: true,
    };

  const setOrganiserId =
    typeof context.query.organiserId === "string" &&
    Number.parseInt(context.query.organiserId);

  if (setOrganiserId) {
    console.log(`Setting organiserId to ${setOrganiserId} for user ${userId}`);
    await prisma.adminUser.update({
      where: {
        id: userId,
      },
      data: {
        adminsEventOrganiserId: setOrganiserId,
      },
    });
    return {
      redirect: {
        destination: "/event",
        permanent: false,
      },
    };
  }

  return {
    props: {
      organisers: await prisma.eventOrganiser
        .findMany({
          select: {
            id: true,
            name: true,
          },
        })
        .then((organisers) =>
          organisers.map((organiser) => ({
            ...organiser,
            selected: organiser.id === user.adminsEventOrganiserId,
          }))
        ),
    },
  };
};

const SelectOrganiserPage: NextPage<Data> = (props) => {
  return (
    <Container className="pt-3 pb-4">
      <Head>
        <title>Organisator auswählen</title>
      </Head>

      <h1>Organisator auswählen</h1>
      <Table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Auswählen</th>
          </tr>
        </thead>
        <tbody>
          {props.organisers.map((organiser) => (
            <tr key={organiser.id}>
              <td>{organiser.name}</td>
              <td>
                {organiser.selected ? (
                  <Button disabled={true} variant={"outline-primary"} size="sm">
                    Ausgewählt
                  </Button>
                ) : (
                  <Button href={`?organiserId=${organiser.id}`} size="sm">
                    Auswählen
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default SelectOrganiserPage;
