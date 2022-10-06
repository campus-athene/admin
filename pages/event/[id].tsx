import { PrismaClient } from "@prisma/client";
import moment, { utc } from "moment";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { FormEventHandler, useState } from "react";
import {
  Alert,
  Button,
  Container,
  Form,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import FileUpload from "../../components/FileUpload";
import { RequestBody } from "../api/event";

type Data =
  | {
      id: number;
      title: string;
      description: string;
      date: string;
      online: boolean;
      eventType: string;
      venue: string | null;
      participationLink: string | null;
      registrationDeadline: string | null;
      registrationLink: string | null;
      // price: string;
      image: string;

      create: false;
    }
  | { create: true };

const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const idParam = context.params?.id;

  if (idParam === "create") return { props: { create: true } };

  const id = typeof idParam === "string" && Number.parseInt(idParam);
  if (!id) return { notFound: true };

  const event = await prisma.event.findUnique({ where: { id } });

  if (!event) return { notFound: true };
  return {
    props: {
      ...event,
      date: event.date.toISOString(),
      registrationDeadline: event.registrationDeadline?.toISOString() || null,
      create: false,
    },
  };
};

const EventPage: NextPage<Data> = (data) => {
  const [hasRegDeadline, setHasRegDeadline] = useState(
    data.create ? false : !!data.registrationDeadline
  );
  const [venueType, setVenueType] = useState<"online" | "presence">(
    data.create || !data.online ? "presence" : "online"
  );
  const [image, setImage] = useState<string | null>(
    data.create ? null : data.image
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const controls = e.target as unknown as { [id: string]: HTMLInputElement };

    let response: Response;

    if (data.create) {
      if (!image) {
        setError("Bitte wähle ein Bild aus.");
        return;
      }

      const body: RequestBody = {
        title: controls.title.value,
        description: controls.desc.value,
        date: moment(controls.date.value).utc().toISOString(),
        online: controls.venueType.value === "online",
        eventType: controls.eventType.value,
        venue: controls.venue.value,
        participationLink: controls.participationLink.value,
        registrationDeadline: hasRegDeadline
          ? moment(controls.regDeadline.value).utc().toISOString()
          : null,
        registrationLink: controls.registrationLink.value,
        image: image,
      };

      response = await fetch("/api/event", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } else {
      if (!image) {
        setError("Bitte wähle ein Bild aus.");
        return;
      }

      const body: RequestBody = {
        id: data.id,
        title: controls.title.value,
        description: controls.desc.value,
        date: moment(controls.date.value).utc().toISOString(),
        online: controls.venueType.value === "online",
        eventType: controls.eventType.value,
        venue: controls.venue.value,
        participationLink: controls.participationLink.value,
        registrationDeadline: hasRegDeadline
          ? moment(controls.regDeadline.value).utc().toISOString()
          : null,
        registrationLink: controls.registrationLink.value,
        image: image,
      };

      response = await fetch("/api/event", {
        method: data.create ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    if (response.ok) history.back();
    else
      setError(
        response.headers.get("Content-Length")?.match(/^[1-9][0-9]*$/)
          ? await response.text()
          : "Ein unbekannter Fehler ist aufgetreten."
      );
  };

  return (
    <Container className="pt-3 pb-4">
      <Head>
        <title>
          {data.create ? "Veranstaltung erstellen" : "Veranstaltung bearbeiten"}
        </title>
      </Head>
      <h1>
        {data.create ? "Veranstaltung erstellen" : "Veranstaltung bearbeiten"}
      </h1>
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Titel</Form.Label>
          <Form.Control
            id="title"
            type="text"
            defaultValue={data.create ? undefined : data.title}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Beschreibung</Form.Label>
          <Form.Control
            id="desc"
            as="textarea"
            rows={4}
            defaultValue={data.create ? undefined : data.description}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Veranstaltungsformat</Form.Label>
          <Form.Select
            id="eventType"
            defaultValue={data.create ? undefined : data.eventType}
          >
            {[
              "Beratung",
              "Konferenz",
              "Seminar",
              "Workshop",
              "Training",
              "Exkursion",
              "Konferenz",
              "Vortrag",
              "Messe",
            ].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Datum</Form.Label>
          <Form.Control
            id="date"
            type="datetime-local"
            defaultValue={
              data.create
                ? undefined
                : utc(data.date).local().format("YYYY-MM-DDThh:mm")
            }
          />
        </Form.Group>
        <Form.Group className="mb3">
          <Form.Check
            label="Keine Anmeldung erforderlich"
            checked={!hasRegDeadline}
            onChange={(e) => setHasRegDeadline(!e.target.checked)}
          />
        </Form.Group>
        <Form.Group
          className="mb-3"
          style={{ visibility: hasRegDeadline ? undefined : "collapse" }}
        >
          <Form.Label>Anmelden bis</Form.Label>
          <Form.Control
            id="regDeadline"
            type="datetime-local"
            defaultValue={
              data.create || !data.registrationDeadline
                ? undefined
                : utc(data.registrationDeadline)
                    .local()
                    .format("YYYY-MM-DDThh:mm")
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Anmelden unter (Weblink / E-Mail-Adresse)</Form.Label>
          <Form.Control
            id="registrationLink"
            type="text"
            defaultValue={
              data.create ? undefined : data.registrationLink || undefined
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Bild (3:2-Format)</Form.Label>
          <FileUpload
            imageId={image || undefined}
            onFileUploaded={(id) => setImage(id)}
            style={{
              height: "8rem",
              width: "12rem",
            }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Veranstaltungstype</Form.Label>
          <div>
            <ToggleButtonGroup
              name="venueType"
              onChange={(value) => setVenueType(value)}
              value={venueType}
            >
              <ToggleButton
                id="venueType-presence"
                type="radio"
                value="presence"
                variant="outline-secondary"
              >
                Präsenz
              </ToggleButton>
              <ToggleButton
                id="venueType-online"
                type="radio"
                value="online"
                variant="outline-secondary"
              >
                Online
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </Form.Group>
        <Form.Group
          className="mb-3"
          style={{
            visibility: venueType === "online" ? "visible" : "collapse",
          }}
        >
          <Form.Label>Teilnahme-Link</Form.Label>
          <Form.Control
            id="participationLink"
            type="text"
            defaultValue={
              data.create ? undefined : data.participationLink || undefined
            }
          />
        </Form.Group>
        <Form.Group
          className="mb-3"
          style={{
            visibility: venueType === "presence" ? "visible" : "collapse",
          }}
        >
          <Form.Label>Adresse</Form.Label>
          <Form.Control
            id="venue"
            type="text"
            defaultValue={data.create ? undefined : data.venue || undefined}
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">
          {data.create ? "Veranstaltung erstellen" : "Änderungen speichern"}
        </Button>
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

export default EventPage;
