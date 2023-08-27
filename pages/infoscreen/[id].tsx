import { PrismaClient } from "@prisma/client";
import moment from "moment";
import { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import FileUpload from "../../components/FileUpload";
import { RequestBody } from "../api/infoscreen";

type Data = {
  infoScreen: {
    id: number;
    comment: string;
    position: number;
    campaignStart: number | null;
    campaignEnd: number | null;
    mediaDe: string | null;
    mediaEn: string | null;
    externalLinkDe: string | null;
    externalLinkEn: string | null;
  } | null;
};

const prisma = new PrismaClient();

export const getServerSideProps: GetStaticProps<Data> = async (context) => {
  const idString = context.params?.id;

  if (idString === "create") {
    return {
      props: {
        infoScreen: null,
      },
    };
  }

  const id = typeof idString === "string" ? parseInt(idString) : null;

  const infoScreen =
    id && Number.isInteger(id)
      ? await prisma.infoScreen.findUnique({
          where: {
            id,
          },
        })
      : null;

  if (!infoScreen) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      infoScreen: {
        id: infoScreen.id,
        comment: infoScreen.comment,
        position: infoScreen.position,
        campaignStart: infoScreen.campaignStart
          ? infoScreen.campaignStart.getTime()
          : null,
        campaignEnd: infoScreen.campaignEnd
          ? infoScreen.campaignEnd.getTime()
          : null,
        mediaDe: infoScreen.mediaDeId,
        mediaEn: infoScreen.mediaEnId,
        externalLinkDe: infoScreen.externalLinkDe,
        externalLinkEn: infoScreen.externalLinkEn,
      },
    },
  };
};

const InfoScreenPage: NextPage<Data> = (data) => {
  const [mediaDe, setMediaDe] = useState<string | undefined>(
    data.infoScreen?.mediaDe || undefined,
  );
  const [mediaEn, setMediaEn] = useState<string | undefined>(
    data.infoScreen?.mediaEn || undefined,
  );
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;

    const body: RequestBody = {
      id: data.infoScreen?.id,
      comment: form.comment.value,
      position: Number.parseFloat(form.position.value),
      campaignStart: moment(form.campaignStart.value).utc().valueOf(),
      campaignEnd: moment(form.campaignEnd.value).utc().valueOf(),
      mediaDe: form.mediaDe.value || null,
      mediaEn: form.mediaEn.value || null,
      externalLinkDe: form.externalLinkDe.value || null,
      externalLinkEn: form.externalLinkEn.value || null,
    };

    const response = await fetch("/api/infoscreen", {
      method: data.infoScreen ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      window.location.href = "/infoscreen";
    } else {
      alert("Fehler beim Speichern");
    }
  };

  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>
          {`Info-Screen ${data.infoScreen ? "bearbeiten" : "erstellen"}`}
        </title>
      </Head>

      <h1>Info-Screen {data.infoScreen ? "bearbeiten" : "erstellen"}</h1>
      <Form onSubmit={onSubmit}>
        <Row>
          <Col lg={10}>
            <Form.Group className="mb-3" controlId="comment">
              <Form.Label>Kommentar</Form.Label>
              <Form.Control
                type="text"
                name="comment"
                defaultValue={data.infoScreen?.comment}
              />
            </Form.Group>
          </Col>
          <Col lg={2}>
            <Form.Group className="mb-3" controlId="position">
              <Form.Label>Position</Form.Label>
              <Form.Control
                type="number"
                name="position"
                defaultValue={data.infoScreen?.position}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="campaignStart">
              <Form.Label>Kampagnenstart</Form.Label>
              <Form.Control
                type="datetime-local"
                name="campaignStart"
                defaultValue={moment(data.infoScreen?.campaignStart).format(
                  "YYYY-MM-DDTHH:mm",
                )}
              />
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group className="mb-3" controlId="campaignEnd">
              <Form.Label>Kampagnenende</Form.Label>
              <Form.Control
                type="datetime-local"
                name="campaignEnd"
                defaultValue={
                  data.infoScreen?.campaignEnd
                    ? moment(data.infoScreen?.campaignEnd).format(
                        "YYYY-MM-DDTHH:mm",
                      )
                    : undefined
                }
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3" controlId="externalLinkDe">
          <Form.Label>Externer Link (Deutsch)</Form.Label>
          <Form.Control
            type="url"
            name="externalLinkDe"
            defaultValue={data.infoScreen?.externalLinkDe || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="externalLinkEn">
          <Form.Label>Externer Link (Englisch)</Form.Label>
          <Form.Control
            type="url"
            name="externalLinkEn"
            defaultValue={data.infoScreen?.externalLinkEn || undefined}
          />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="mediaDe">
              <Form.Label>Medium (Deutsch)</Form.Label>
              <FileUpload
                imageId={mediaDe}
                onFileUploaded={(id) => setMediaDe(id)}
                style={{
                  width: "auto",
                  height: "8rem",
                  aspectRatio: "16/9",
                }}
              />
              <Form.Control
                type="hidden"
                name="mediaDe"
                defaultValue={mediaDe}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="mediaEn">
              <Form.Label>Medium (Englisch)</Form.Label>
              <FileUpload
                imageId={mediaEn}
                onFileUploaded={(id) => setMediaEn(id)}
                style={{
                  width: "auto",
                  height: "8rem",
                  aspectRatio: "16/9",
                }}
              />
              <Form.Control
                type="hidden"
                name="mediaEn"
                defaultValue={mediaEn}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Button as="a" href="/infoscreen" variant="secondary">
            Abbrechen
          </Button>
          <Button type="submit" variant="primary" className="ms-3">
            Speichern
          </Button>
        </Form.Group>
      </Form>
    </Container>
  );
};

export default InfoScreenPage;
