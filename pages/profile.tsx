import { EventOrganizer, PrismaClient } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import { getServerSession } from "next-auth";
import Head from "next/head";
import { FormEventHandler, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap";
import FileUpload from "../components/FileUpload";
import { authOptions } from "./api/auth/[...nextauth]";
import { Body } from "./api/profile";

type Data = EventOrganizer;

const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  const userId = Number.parseInt(session?.token.sub || "");
  if (!userId) return { notFound: true };

  const orgaObj = (
    await prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        adminsEventOrganizer: true,
      },
    })
  )?.adminsEventOrganizer;

  if (!orgaObj) return { notFound: true };

  return { props: orgaObj };
};

const ProfilePage: NextPage<Data> = (data) => {
  const [formHasValidated, setFormHasValidated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoImg, setLogoImg] = useState<string>(data.logoImg);
  const [coverImg, setCoverImg] = useState<string | null>(data.coverImg);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const controls = e.target as unknown as { [id: string]: HTMLInputElement };

    const body: Body = {
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
          : "Ein unbekannter Fehler ist aufgetreten.",
      );
  };

  return (
    <Container className="pt-3 pb-5">
      <Head>
        <title>Veranstalterprofil bearbeiten</title>
      </Head>

      <h1 className="mb-4">Veranstalterprofil bearbeiten</h1>
      <Form
        onSubmit={onSubmit}
        onInvalid={() => setFormHasValidated(true)}
        validated={formHasValidated}
      >
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            id="name"
            type="text"
            defaultValue={data.name}
            maxLength={50}
            required
          />
          <Form.Text>Maximal 50 Zeichen</Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Beschreibung</Form.Label>
          <Form.Control
            id="description"
            as="textarea"
            rows={4}
            defaultValue={data.description}
            minLength={100}
            maxLength={1000}
            required
          />
          <Form.Text>100 bis 1.000 Zeichen</Form.Text>
        </Form.Group>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1em" }}>
          <Form.Group className="mb-3">
            <Form.Label>Logo (1:1)</Form.Label>
            <FileUpload
              imageId={logoImg}
              onFileUploaded={(id) => setLogoImg(id)}
              style={{
                height: "8rem",
                width: "8rem",
              }}
              required
              validated={formHasValidated}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Titelbild (3:1)</Form.Label>
            <FileUpload
              imageId={coverImg || undefined}
              onFileUploaded={(id) => setCoverImg(id)}
              onRemoveFile={() => setCoverImg(null)}
              style={{
                height: "8rem",
                width: "24rem",
              }}
              validated={formHasValidated}
            />
          </Form.Group>
        </div>

        <h4 className="mt-5 mb-3">Kontakt</h4>
        <Form.Group className="mb-3">
          <Form.Label>Webseite</Form.Label>
          <Form.Control
            id="socialWebsite"
            type="url"
            defaultValue={data.socialWebsite || undefined}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>E-Mail-Adresse</Form.Label>
          <Form.Control
            id="socialEmail"
            type="email"
            defaultValue={data.socialEmail || undefined}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Telefon</Form.Label>
          <Form.Control
            id="socialPhone"
            type="tel"
            defaultValue={data.socialPhone || undefined}
          />
        </Form.Group>

        <h4 className="mt-5 mb-0">Soziale Medien</h4>
        <Form.Text className="mt-0 mb-3" style={{ display: "block" }}>
          Angaben jeweils als vollständige URL
        </Form.Text>
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
          <Form.Label>LinkedIn</Form.Label>
          <Form.Control
            id="socialLinkedin"
            type="url"
            defaultValue={data.socialLinkedin || undefined}
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
        <Form.Group className="mb-3">
          <Form.Label>TikTok</Form.Label>
          <Form.Control
            id="socialTiktok"
            type="url"
            defaultValue={data.socialTiktok || undefined}
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
          <Form.Label>YouTube</Form.Label>
          <Form.Control
            id="socialYoutube"
            type="url"
            defaultValue={data.socialYoutube || undefined}
          />
        </Form.Group>

        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">Speichern</Button>
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
