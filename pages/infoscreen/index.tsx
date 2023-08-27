import { PrismaClient } from "@prisma/client";
import moment, { utc } from "moment";
import "moment/locale/de";
import { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Button, Container, Table } from "react-bootstrap";
import { Role, getServerSidePropsWithAuth } from "../../common/authHelper";

type Data = {
  infoScreens: {
    id: number;
    comment: string;
    campaignStart: number | null;
    campaignEnd: number | null;
    media: string;
  }[];
};

const prisma = new PrismaClient();

export const getServerSideProps = getServerSidePropsWithAuth<Data>(
  { role: Role.InfosScreenEditor },
  async () => {
    const infoScreens = await prisma.infoScreen.findMany({
      where: {
        OR: [
          {
            campaignEnd: {
              gt: moment().toDate(),
            },
          },
          {
            campaignEnd: null,
          },
        ],
      },
      orderBy: {
        position: "asc",
      },
      select: {
        id: true,
        comment: true,
        campaignStart: true,
        campaignEnd: true,
        mediaDeId: true,
        mediaEnId: true,
      },
    });

    return {
      props: {
        infoScreens: infoScreens.map((infoScreen) => ({
          id: infoScreen.id,
          comment: infoScreen.comment,
          campaignStart: infoScreen.campaignStart?.getTime() ?? null,
          campaignEnd: infoScreen.campaignEnd?.getTime() ?? null,
          media: infoScreen.mediaDeId || (infoScreen.mediaEnId as string),
        })),
      },
    };
  },
);

const InfoScreenPage: NextPage<Data> = (data) => {
  const router = useRouter();

  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Info-Screens</title>
      </Head>

      <h1 style={{ display: "flex", alignItems: "end" }}>
        <span style={{ flexGrow: "1" }}>Info-Screens</span>
        <Button as="a" href="/infoscreen/create" variant="primary">
          Neuer Info-Screen
        </Button>
      </h1>
      <Table>
        <thead>
          <tr>
            <th />
            <th>Kommentar</th>
            <th>Start</th>
            <th>Ende</th>
          </tr>
        </thead>
        <tbody>
          {data.infoScreens.map((infoScreen) => (
            <tr
              key={infoScreen.id}
              onClick={() => router.push(`/infoscreen/${infoScreen.id}`)}
              style={{ cursor: "pointer" }}
            >
              <td className="pl-0 py-0">
                <img
                  src={`/api/image/${infoScreen.media}`}
                  style={{
                    width: "auto",
                    height: "2.5rem",
                    aspectRatio: "16/9",
                  }}
                />
              </td>
              <td>{infoScreen.comment}</td>
              <td>
                {infoScreen.campaignStart
                  ? utc(infoScreen.campaignStart)
                      .local()
                      .locale("de")
                      .format("llll")
                  : "-"}
              </td>
              <td>
                {infoScreen.campaignEnd
                  ? utc(infoScreen.campaignEnd)
                      .local()
                      .locale("de")
                      .format("llll")
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default InfoScreenPage;
