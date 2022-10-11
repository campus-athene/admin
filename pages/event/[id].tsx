import { PrismaClient } from "@prisma/client";
import moment, { utc } from "moment";
import { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
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
      venueAddress: string | null;
      registrationDeadline: string | null;
      registrationLink: string | null;
      price: string | null;
      image: string;

      create: false;
    }
  | { create: true };
const select = {
  id: true,
  title: true,
  description: true,
  date: true,
  online: true,
  eventType: true,
  venue: true,
  venueAddress: true,
  registrationDeadline: true,
  registrationLink: true,
  price: true,
  image: true,
};

const prisma = new PrismaClient();

export const getServerSideProps: GetServerSideProps<Data> = async (context) => {
  const idParam = context.params?.id;

  if (idParam === "create") return { props: { create: true } };

  const id = typeof idParam === "string" && Number.parseInt(idParam);
  if (!id) return { notFound: true };

  const event = await prisma.event.findUnique({ select, where: { id } });

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
  const router = useRouter();

  const [formHasValidated, setFormHasValidated] = useState(false);
  const [isFree, setIsFree] = useState(data.create ? false : !data.price);
  const [needsRegistration, setNeedsRegsitration] = useState(
    data.create ? false : !!data.registrationLink
  );
  const [regLinkType, setRegLinkType] = useState<"email" | "weblink">(
    data.create || !data.registrationLink?.startsWith("mailto:")
      ? "weblink"
      : "email"
  );
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
      venueAddress: controls.venueAddress.value,
      registrationDeadline:
        needsRegistration && hasRegDeadline
          ? moment(controls.regDeadline.value).utc().toISOString()
          : null,
      registrationLink: needsRegistration
        ? (regLinkType === "email" ? "mailto:" : "") +
          controls.registrationLink.value
        : null,
      price: isFree ? null : controls.price.value,
      image: image,
    };

    const response = await fetch("/api/event", {
      method: data.create ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data.create ? body : { id: data.id, ...body }),
    });

    if (!response.ok) {
      setError(
        response.headers.get("Content-Length")?.match(/^[1-9][0-9]*$/)
          ? await response.text()
          : "Ein unbekannter Fehler ist aufgetreten."
      );
      return;
    }

    if (history.length > 1) router.back();
    else router.replace(`/event`);
  };

  return (
    <Container className="pt-3 pb-4">
      <Head>
        <title>
          {data.create ? "Veranstaltung erstellen" : "Veranstaltung bearbeiten"}
        </title>
      </Head>
      <h1 className="mb-4">
        {data.create ? "Veranstaltung erstellen" : "Veranstaltung bearbeiten"}
      </h1>
      <Form
        onSubmit={onSubmit}
        onInvalid={() => setFormHasValidated(true)}
        validated={formHasValidated}
      >
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            id="title"
            type="text"
            defaultValue={data.create ? undefined : data.title}
            maxLength={50}
            required
          />
          <Form.Text>Maximal 50 Zeichen</Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Beschreibung</Form.Label>
          <Form.Control
            id="desc"
            as="textarea"
            rows={4}
            defaultValue={data.create ? undefined : data.description}
            minLength={100}
            maxLength={1000}
            required
          />
          <Form.Text>100 bis 1.000 Zeichen</Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Veranstaltungsformat</Form.Label>
          <Form.Select
            id="eventType"
            defaultValue={data.create ? undefined : data.eventType}
          >
            {[
              "Beratung",
              "Exkursion",
              "Infoveranstaltung",
              "Konferenz",
              "Kultur",
              "Messe",
              "Seminar",
              "Sport",
              "Party",
              "Vortrag",
              "Workshop",
              "Sonstiges",
            ].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Datum und Uhrzeit</Form.Label>
          <Form.Control
            id="date"
            type="datetime-local"
            defaultValue={
              data.create
                ? undefined
                : utc(data.date).local().format("YYYY-MM-DDThh:mm")
            }
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{ marginBottom: isFree ? "0" : undefined }}>
            Eintrittspreis
            <Form.Check
              checked={isFree}
              inline
              label="Kostenfrei"
              style={{ marginLeft: "1em" }}
              onChange={(e) => setIsFree(e.target.checked)}
            />
          </Form.Label>
          <Form.Control
            id="price"
            defaultValue={data.create || !data.price ? undefined : data.price}
            required={!isFree}
            style={{
              display: isFree ? "none" : undefined,
            }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Bild (3:2-Format)</Form.Label>
          <FileUpload
            imageId={image || undefined}
            onFileUploaded={(id) => setImage(id)}
            required
            style={{
              height: "8rem",
              width: "12rem",
            }}
            validated={formHasValidated}
          />
          <Form.Control
            type="hidden"
            defaultValue={data.create ? undefined : data.image}
            required
          />
        </Form.Group>

        <h4 className="mt-5 mb-3">Anmeldung</h4>
        <Form.Group className="mb-3">
          <Form.Check
            label="Anmeldung erforderlich"
            checked={needsRegistration}
            onChange={(e) => setNeedsRegsitration(e.target.checked)}
          />
        </Form.Group>
        <Form.Group
          className="mb-3"
          style={{ display: needsRegistration ? undefined : "none" }}
        >
          <Form.Label>
            Anmelden per
            <Form.Check
              checked={regLinkType === "weblink"}
              inline
              label="Web-Link"
              onChange={() => setRegLinkType("weblink")}
              style={{ marginLeft: "1em" }}
              type="radio"
            />
            <Form.Check
              checked={regLinkType === "email"}
              inline
              label="E-Mail"
              onChange={() => setRegLinkType("email")}
              type="radio"
            />
          </Form.Label>
          <Form.Control
            id="registrationLink"
            type={regLinkType === "weblink" ? "url" : "email"}
            defaultValue={
              data.create
                ? undefined
                : data.registrationLink?.startsWith("mailto:")
                ? data.registrationLink.substring(7)
                : data.registrationLink || undefined
            }
            required={needsRegistration}
          />
        </Form.Group>
        <Form.Group
          className="mb-3"
          style={{ display: needsRegistration ? undefined : "none" }}
        >
          <Form.Label>
            <Form.Check
              label="Anmeldung endet am"
              checked={hasRegDeadline}
              onChange={(e) => setHasRegDeadline(e.target.checked)}
            />
          </Form.Label>
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
            required={needsRegistration && hasRegDeadline}
            style={{
              display: hasRegDeadline ? undefined : "none",
            }}
          />
        </Form.Group>

        <h4 className="mt-5 mb-3">Veranstaltungsort</h4>
        <Form.Group className="mb-3">
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
            display: venueType === "presence" ? undefined : "none",
          }}
        >
          <Form.Label>Gebäudenummer und Raum</Form.Label>
          <Form.Control
            id="venue"
            type="text"
            defaultValue={data.create ? undefined : data.venue || undefined}
            required={venueType === "presence"}
          />
        </Form.Group>
        <Form.Group
          className="mb-3"
          style={{
            display: venueType === "presence" ? undefined : "none",
          }}
        >
          <Form.Label>Adresse inklusive Ort</Form.Label>
          <Form.Control
            id="venueAddress"
            type="text"
            defaultValue={
              data.create ? undefined : data.venueAddress || undefined
            }
            required={venueType === "presence"}
          />
        </Form.Group>
        <div className="mb-5 mt-5">
          {error && <Alert variant="danger">{error}</Alert>}
          <Button type="submit">
            {data.create ? "Veranstaltung erstellen" : "Speichern"}
          </Button>
          <Button
            onClick={() => history.back()}
            variant="secondary"
            style={{ marginLeft: "0.5em" }}
          >
            Abbrechen
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EventPage;
