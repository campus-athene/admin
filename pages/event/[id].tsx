import { PrismaClient } from "@prisma/client";
import moment, { utc } from "moment";
import { GetServerSideProps, NextPage } from "next";
import { FormEventHandler, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap";

type Data =
  | {
      id: number;
      title: string;
      description: string;
      date: string;
      registrationDeadline: string | null;
      image: string;
      create: false;
    }
  | { create: true };

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const idParam = context.params?.id;

  if (idParam === "create") return { props: { create: true } };

  const id = typeof idParam === "string" && Number.parseInt(idParam);
  if (!id) return { notFound: true };

  const prisma = new PrismaClient();
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
  const [error, setError] = useState<string | null>(null);

  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    const controls = e.target as unknown as { [id: string]: HTMLInputElement };

    const body = {
      id: data.create ? undefined : data.id,
      title: controls.title.value,
      description: controls.desc.value,
      date: moment(controls.date.value).utc().toISOString(),
      registrationDeadline: hasRegDeadline
        ? moment(controls.regDeadline.value).utc().toISOString()
        : null,
      image: controls.image.value,
    };

    const res = await fetch("/api/event", {
      method: data.create ? "PUT" : "POST",
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
    <Container>
      <h1>
        {data.create
          ? "Neue Veranstaltung anlegen"
          : "Veranstaltung bearbeiten"}
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
            label="Keine Anmeldung / Keine Deadline"
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
          <Form.Label>Bild</Form.Label>
          <Form.Control
            id="image"
            type="url"
            defaultValue={data.create ? undefined : data.image}
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">
          Veranstaltung {data.create ? "erstellen" : "ändern"}
        </Button>
      </Form>
    </Container>
  );
};

export default EventPage;
