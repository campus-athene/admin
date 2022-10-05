import { EventOrganiser, PrismaClient } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession } from "next-auth";
import Head from "next/head";
import { FormEventHandler, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap";
import FileUpload from "../components/FileUpload";
import { authOptions } from "./api/auth/[...nextauth]";

type Data = EventOrganiser;

const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  const orgaId = Number.parseInt(session?.token.sub || "");
  if (!orgaId) return { notFound: true };

  const orgaObj = await prisma.eventOrganiser.findUnique({
    where: { id: orgaId },
  });
  if (!orgaObj) return { notFound: true };

  return { props: orgaObj };
};

const ProfilePage: NextPage<Data> = (data) => {
  const [error, setError] = useState<string | null>(null);

  const [logoImg, setLogoImg] = useState<string>(data.logoImg);
  const [coverImg, setCoverImg] = useState<string>(data.coverImg);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const controls = e.target as unknown as { [id: string]: HTMLInputElement };

    const body = {
      name: controls.name.value,
      description: controls.description.value,
      logoImg,
      coverImg,
      socialWebsite: controls.socialWebsite.value,
      socialEmail: controls.socialEmail.value,
      socialPhone: controls.socialPhone.value,
      socialFacebook: controls.socialFacebook.value,
      socialInstagram: controls.socialInstagram.value,
      socialTwitter: controls.socialTwitter.value,
      socialLinkedin: controls.socialLinkedin.value,
      socialTiktok: controls.socialTiktok.value,
      socialYoutube: controls.socialYoutube.value,
      socialTelegram: controls.socialTelegram.value,
    };

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) history.back();
    else
      setError(
        res.headers.get("Content-Length")?.match(/^[1-9][0-9]*$/)
          ? await res.text()
          : "Ein unbekannter Fehler ist aufgetreten."
      );
  };

  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Veranstalterprofil bearbeiten</title>
      </Head>

      <h1>Veranstalterprofil bearbeiten</h1>
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control id="name" type="text" defaultValue={data.name} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Beschreibung</Form.Label>
          <Form.Control
            id="description"
            as="textarea"
            rows={4}
            defaultValue={data.description}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Logo</Form.Label>
          <FileUpload onFileUploaded={(id) => setLogoImg(id)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Titelbild</Form.Label>
          <FileUpload onFileUploaded={(id) => setCoverImg(id)} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Webseite</Form.Label>
          <Form.Control
            id="socialWebsite"
            type="url"
            defaultValue={data.socialWebsite || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>E-Mail-Adresse</Form.Label>
          <Form.Control
            id="socialEmail"
            type="email"
            defaultValue={data.socialEmail || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Telefon</Form.Label>
          <Form.Control
            id="socialPhone"
            type="url"
            defaultValue={data.socialPhone || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Facebook</Form.Label>
          <Form.Control
            id="socialFacebook"
            type="url"
            defaultValue={data.socialFacebook || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Instagram</Form.Label>
          <Form.Control
            id="socialInstagram"
            type="url"
            defaultValue={data.socialInstagram || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Twitter</Form.Label>
          <Form.Control
            id="socialTwitter"
            type="url"
            defaultValue={data.socialTwitter || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>LinkedIn</Form.Label>
          <Form.Control
            id="socialLinkedin"
            type="url"
            defaultValue={data.socialLinkedin || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>TikTok</Form.Label>
          <Form.Control
            id="socialTiktok"
            type="url"
            defaultValue={data.socialTiktok || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>YouTube</Form.Label>
          <Form.Control
            id="socialYoutube"
            type="url"
            defaultValue={data.socialYoutube || undefined}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Telegram</Form.Label>
          <Form.Control
            id="socialTelegram"
            type="url"
            defaultValue={data.socialTelegram || undefined}
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">Änderungen speichern</Button>
        <Button
          onClick={() => history.back()}
          variant="secondary"
          style={{ marginLeft: "0.5em" }}
        >
          Abbrechen
        </Button>
      </Form>
    </Container>
  );
};

export default ProfilePage;
