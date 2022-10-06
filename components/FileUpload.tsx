import {
  ChangeEventHandler,
  CSSProperties,
  HTMLAttributes,
  MouseEventHandler,
  useRef,
  useState,
} from "react";
import { Button, Form, Modal } from "react-bootstrap";

const FileUpload = (props: {
  imageId?: string;
  onFileUploaded?: (id: string, file: File) => void;
  style: CSSProperties;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const abortRef = useRef<{ controller: AbortController | null }>({
    controller: null,
  });

  const onChange: ChangeEventHandler<HTMLInputElement> = async (ev) => {
    const file = ev.target.files?.item(0);
    setFile(file || null);
  };

  const onUpload: MouseEventHandler<HTMLButtonElement> = async (ev) => {
    if (!file) return;

    setIsUploading(true);
    let id: string | null = null;
    abortRef.current.controller = new AbortController();

    try {
      id = (
        await (
          await fetch("/api/upload", {
            body: file,
            headers: {
              "content-type": file.type,
            },
            method: "POST",
            signal: abortRef.current.controller.signal,
          })
        ).json()
      )?.id;
    } catch (error) {
      console.error(error);
    }

    setIsUploading(false);

    if (!id) {
      alert(
        "Die Datei konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut."
      );
      return;
    }

    setIsModalOpen(false);
    setFile(null);
    props.onFileUploaded && props.onFileUploaded(id, file);
  };

  const onCancel: MouseEventHandler<HTMLButtonElement> = async (ev) => {
    abortRef.current.controller?.abort();
    setIsModalOpen(false);
  };

  return (
    <>
      {props.imageId ? (
        <picture>
          <img
            alt="Bildvorschau"
            onClick={() => setIsModalOpen(true)}
            src={`/api/image/${props.imageId}`}
            style={{
              border: "1px solid lightgray",
              boxSizing: "content-box",
              display: "block",
              ...props.style,
            }}
          />
        </picture>
      ) : (
        <div
          onClick={() => setIsModalOpen(true)}
          style={{
            border: "1px solid lightgray",
            boxSizing: "content-box",
            display: "block",
            ...props.style,
          }}
        />
      )}
      <Modal show={isModalOpen}>
        <Modal.Header>
          <Modal.Title>Bild hochladen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control onChange={onChange} type="file" />
          <Form.Text style={{ display: "block", marginTop: "0.75em" }}>
            {isUploading
              ? "Datei wird hochgeladen..."
              : file
              ? `${file.name} ausgewählt.`
              : "Bitte Bild auswählen."}
          </Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onCancel} variant="secondary">
            Abbrechen
          </Button>
          <Button disabled={isUploading || !file} onClick={onUpload}>
            Hochladen
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileUpload;
