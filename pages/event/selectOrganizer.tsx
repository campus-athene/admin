import { EventOrganizer, PrismaClient } from "@prisma/client";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { GetServerSideProps, NextPage } from "next";
import { Button, Container, Table } from "react-bootstrap";
import Head from "next/head";

const prisma = new PrismaClient();

type Data = {
  organizers: (Pick<EventOrganizer, "id" | "name"> & { selected: boolean })[];
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
      adminsEventOrganizerId: true,
      isGlobalAdmin: true,
    },
  });

  if (!user?.isGlobalAdmin)
    return {
      notFound: true,
    };

  const setOrganizerId =
    typeof context.query.organizerId === "string" &&
    Number.parseInt(context.query.organizerId);

  if (setOrganizerId) {
    console.log(`Setting organizerId to ${setOrganizerId} for user ${userId}`);
    await prisma.adminUser.update({
      where: {
        id: userId,
      },
      data: {
        adminsEventOrganizerId: setOrganizerId,
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
      organizers: await prisma.eventOrganizer
        .findMany({
          select: {
            id: true,
            name: true,
          },
        })
        .then((organizers) =>
          organizers.map((organizer) => ({
            ...organizer,
            selected: organizer.id === user.adminsEventOrganizerId,
          }))
        ),
    },
  };
};

const SelectOrganizerPage: NextPage<Data> = (props) => {
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
          {props.organizers.map((organizer) => (
            <tr key={organizer.id}>
              <td>{organizer.name}</td>
              <td>
                {organizer.selected ? (
                  <Button disabled={true} variant={"outline-primary"} size="sm">
                    Ausgewählt
                  </Button>
                ) : (
                  <Button href={`?organizerId=${organizer.id}`} size="sm">
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

export default SelectOrganizerPage;
